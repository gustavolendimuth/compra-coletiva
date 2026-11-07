import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { TokenService } from './tokenService';
import { prisma } from '../index';

let io: Server | null = null;

// Extended Socket type with user info
interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    email: string;
    role: string;
    name: string | null;
  };
}

type SocketUser = NonNullable<AuthenticatedSocket['user']>;

/**
 * Dono do pedido, criador da campanha ou ADMIN
 */
const canAccessOrder = async (user: SocketUser | undefined, orderId: unknown): Promise<boolean> => {
  if (!user || typeof orderId !== 'string' || !orderId) {
    return false;
  }
  if (user.role === 'ADMIN') {
    return true;
  }
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { userId: true, campaign: { select: { creatorId: true } } },
  });
  if (!order) {
    return false;
  }
  return order.userId === user.id || order.campaign?.creatorId === user.id;
};

/**
 * Chaves que nunca podem sair na sala pública da campanha
 */
const SENSITIVE_CAMPAIGN_ROOM_KEYS = new Set([
  'email',
  'pixKey',
  'pixName',
  'pixType',
  'paymentProofUrl',
  'paymentProofKey',
]);

/**
 * Remove recursivamente as chaves sensíveis de um payload
 */
export const stripSensitiveKeys = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(stripSensitiveKeys);
  }
  if (value instanceof Date) {
    return value;
  }
  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if (!SENSITIVE_CAMPAIGN_ROOM_KEYS.has(key)) {
        result[key] = stripSensitiveKeys(nested);
      }
    }
    return result;
  }
  return value;
};

const emitToCampaignRoom = (campaignId: string, event: string, data: unknown) => {
  const io = getIO();
  const payload = stripSensitiveKeys(data);
  io.to(`campaign-${campaignId}`).emit(event, payload);
  return payload;
};

export const initializeSocket = (httpServer: HttpServer): Server => {
  const corsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').flatMap(origin => {
        const trimmed = origin.trim();
        if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
          return [trimmed];
        }
        return [`http://${trimmed}`, `https://${trimmed}`];
      })
    : ['http://localhost:5173'];

  io = new Server(httpServer, {
    cors: {
      origin: corsOrigins,
      credentials: true,
    },
  });

  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;

      if (!token) {
        // Allow unauthenticated connections for viewing public data
        console.log(`⚠️  Unauthenticated socket connected: ${socket.id}`);
        return next();
      }

      // Verify token
      const payload = TokenService.verifyAccessToken(token as string);

      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, email: true, role: true, name: true }
      });

      if (!user) {
        return next(new Error('User not found'));
      }

      // Attach user to socket
      socket.user = user;
      console.log(`✅ Authenticated socket connected: ${socket.id} (${user.email})`);
      next();
    } catch (error) {
      console.log(`❌ Socket authentication failed: ${socket.id}`, error);
      // Allow connection but without user info (for public viewing)
      next();
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`✅ Client connected: ${socket.id}`);

    // Auto-join user room (for user-specific notifications)
    if (socket.user) {
      socket.join(`user-${socket.user.id}`);
      console.log(`📌 Socket ${socket.id} auto-joined user-${socket.user.id}`);
    }

    // Join campaign room
    socket.on('join-campaign', (campaignId: string) => {
      socket.join(`campaign-${campaignId}`);
      console.log(`📌 Socket ${socket.id} joined campaign-${campaignId}`);
    });

    // Leave campaign room
    socket.on('leave-campaign', (campaignId: string) => {
      socket.leave(`campaign-${campaignId}`);
      console.log(`📍 Socket ${socket.id} left campaign-${campaignId}`);
    });

    // Join order room (for order-specific chat) - apenas dono, criador da campanha ou ADMIN
    socket.on('join-order', async (orderId: string) => {
      try {
        if (!(await canAccessOrder(socket.user, orderId))) {
          return;
        }
        socket.join(`order-${orderId}`);
        console.log(`📌 Socket ${socket.id} joined order-${orderId}`);
      } catch (error) {
        console.error(`❌ join-order failed for socket ${socket.id}`, error);
      }
    });

    // Leave order room
    socket.on('leave-order', (orderId: string) => {
      socket.leave(`order-${orderId}`);
      console.log(`📍 Socket ${socket.id} left order-${orderId}`);
    });

    // Typing indicator for campaign chat
    socket.on('typing', (data: { campaignId: string; isTyping: boolean }) => {
      if (socket.user && data && typeof data.campaignId === 'string') {
        socket.to(`campaign-${data.campaignId}`).emit('user-typing', {
          userId: socket.user.id,
          userName: socket.user.name,
          isTyping: data.isTyping
        });
      }
    });

    // Creator typing indicator (sent to specific user)
    // Só entrega para quem tem pedido em campanha criada pelo emissor
    socket.on('creator-typing', async (data: { userId: string; isTyping: boolean }) => {
      try {
        if (!socket.user || !data || typeof data.userId !== 'string') {
          return;
        }
        const order = await prisma.order.findFirst({
          where: { userId: data.userId, campaign: { creatorId: socket.user.id } },
          select: { id: true },
        });
        if (!order) {
          return;
        }
        socket.to(`user-${data.userId}`).emit('creator-typing', {
          creatorId: socket.user.id,
          creatorName: socket.user.name,
          isTyping: data.isTyping
        });
      } catch (error) {
        console.error(`❌ creator-typing failed for socket ${socket.id}`, error);
      }
    });

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initializeSocket first.');
  }
  return io;
};

// Event emitters for different entities
export const emitOrderStatusChanged = (campaignId: string, orderId: string) => {
  // Só identificadores: o cliente faz refetch pela API autorizada
  emitToCampaignRoom(campaignId, 'order-status-changed', { orderId, campaignId });
  console.log(`📡 Emitted order-status-changed to campaign-${campaignId}`, { orderId });
};

export const emitOrderCreated = (campaignId: string, orderId: string) => {
  // Só identificadores: o cliente faz refetch pela API autorizada
  emitToCampaignRoom(campaignId, 'order-created', { orderId, campaignId });
  console.log(`📡 Emitted order-created to campaign-${campaignId}`, { orderId });
};

export const emitOrderDeleted = (campaignId: string, orderId: string) => {
  // Só identificadores: o cliente faz refetch pela API autorizada
  emitToCampaignRoom(campaignId, 'order-deleted', { orderId, campaignId });
  console.log(`📡 Emitted order-deleted to campaign-${campaignId}`, { orderId });
};

export const emitOrderUpdated = (campaignId: string, orderId: string) => {
  // Só identificadores: o cliente faz refetch pela API autorizada
  emitToCampaignRoom(campaignId, 'order-updated', { orderId, campaignId });
  console.log(`📡 Emitted order-updated to campaign-${campaignId}`, { orderId });
};

export const emitCampaignUpdated = (campaignId: string, data: unknown) => {
  emitToCampaignRoom(campaignId, 'campaign-updated', data);
  console.log(`📡 Emitted campaign-updated to campaign-${campaignId}`);
};

export const emitMessageSent = (orderId: string, data: unknown) => {
  const io = getIO();
  io.to(`order-${orderId}`).emit('message-sent', data);
  console.log(`📡 Emitted message-sent to order-${orderId}`, data);
};

// Campaign Messages Events
export const emitCampaignQuestionReceived = (creatorId: string, campaignId: string, data: unknown) => {
  const io = getIO();
  // Emite apenas para o criador (via room específica)
  io.to(`user-${creatorId}`).emit('campaign-question-received', data);
  console.log(`📡 Emitted campaign-question-received to user-${creatorId} (campaign ${campaignId})`, data);
};

export const emitCampaignMessagePublished = (campaignId: string, data: unknown) => {
  // Emite para todos na room da campanha
  emitToCampaignRoom(campaignId, 'campaign-message-published', data);
  console.log(`📡 Emitted campaign-message-published to campaign-${campaignId}`);
};

export const emitCampaignMessageEdited = (creatorId: string, campaignId: string, data: unknown) => {
  const io = getIO();
  // Emite para o criador (se a pergunta ainda não foi respondida)
  io.to(`user-${creatorId}`).emit('campaign-message-edited', data);
  console.log(`📡 Emitted campaign-message-edited to user-${creatorId} (campaign ${campaignId})`, data);
};

export const emitCampaignMessageDeleted = (campaignId: string, data: unknown) => {
  emitToCampaignRoom(campaignId, 'campaign-message-deleted', data);
  console.log(`📡 Emitted campaign-message-deleted to campaign-${campaignId}`);
};

export const emitUserTyping = (campaignId: string, data: unknown) => {
  emitToCampaignRoom(campaignId, 'user-typing', data);
};

export const emitCreatorTyping = (userId: string, data: unknown) => {
  const io = getIO();
  io.to(`user-${userId}`).emit('creator-typing', data);
};

// Notification Events
export const emitNotificationCreated = (userId: string, data: unknown) => {
  const io = getIO();
  io.to(`user-${userId}`).emit('notification-created', data);
  console.log(`📡 Emitted notification-created to user-${userId}`, data);
};
