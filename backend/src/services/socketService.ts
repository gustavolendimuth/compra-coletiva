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

    // Join order room (for order-specific chat)
    socket.on('join-order', (orderId: string) => {
      socket.join(`order-${orderId}`);
      console.log(`📌 Socket ${socket.id} joined order-${orderId}`);
    });

    // Leave order room
    socket.on('leave-order', (orderId: string) => {
      socket.leave(`order-${orderId}`);
      console.log(`📍 Socket ${socket.id} left order-${orderId}`);
    });

    // Typing indicator for campaign chat
    socket.on('typing', (data: { campaignId: string; isTyping: boolean }) => {
      if (socket.user) {
        socket.to(`campaign-${data.campaignId}`).emit('user-typing', {
          userId: socket.user.id,
          userName: socket.user.name,
          isTyping: data.isTyping
        });
      }
    });

    // Creator typing indicator (sent to specific user)
    socket.on('creator-typing', (data: { userId: string; isTyping: boolean }) => {
      if (socket.user) {
        socket.to(`user-${data.userId}`).emit('creator-typing', {
          creatorId: socket.user.id,
          creatorName: socket.user.name,
          isTyping: data.isTyping
        });
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
export const emitOrderStatusChanged = (campaignId: string, data: unknown) => {
  const io = getIO();
  io.to(`campaign-${campaignId}`).emit('order-status-changed', data);
  console.log(`📡 Emitted order-status-changed to campaign-${campaignId}`, data);
};

export const emitOrderCreated = (campaignId: string, data: unknown) => {
  const io = getIO();
  io.to(`campaign-${campaignId}`).emit('order-created', data);
  console.log(`📡 Emitted order-created to campaign-${campaignId}`, data);
};

export const emitOrderDeleted = (campaignId: string, data: unknown) => {
  const io = getIO();
  io.to(`campaign-${campaignId}`).emit('order-deleted', data);
  console.log(`📡 Emitted order-deleted to campaign-${campaignId}`, data);
};

export const emitOrderUpdated = (campaignId: string, data: unknown) => {
  const io = getIO();
  io.to(`campaign-${campaignId}`).emit('order-updated', data);
  console.log(`📡 Emitted order-updated to campaign-${campaignId}`, data);
};

export const emitCampaignUpdated = (campaignId: string, data: unknown) => {
  const io = getIO();
  io.to(`campaign-${campaignId}`).emit('campaign-updated', data);
  console.log(`📡 Emitted campaign-updated to campaign-${campaignId}`, data);
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
  const io = getIO();
  // Emite para todos na room da campanha
  io.to(`campaign-${campaignId}`).emit('campaign-message-published', data);
  console.log(`📡 Emitted campaign-message-published to campaign-${campaignId}`, data);
};

export const emitCampaignMessageEdited = (creatorId: string, campaignId: string, data: unknown) => {
  const io = getIO();
  // Emite para o criador (se a pergunta ainda não foi respondida)
  io.to(`user-${creatorId}`).emit('campaign-message-edited', data);
  console.log(`📡 Emitted campaign-message-edited to user-${creatorId} (campaign ${campaignId})`, data);
};

export const emitCampaignMessageDeleted = (campaignId: string, data: unknown) => {
  const io = getIO();
  io.to(`campaign-${campaignId}`).emit('campaign-message-deleted', data);
  console.log(`📡 Emitted campaign-message-deleted to campaign-${campaignId}`, data);
};

export const emitUserTyping = (campaignId: string, data: unknown) => {
  const io = getIO();
  io.to(`campaign-${campaignId}`).emit('user-typing', data);
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
