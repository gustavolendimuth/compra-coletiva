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
        select: { id: true, email: true, role: true }
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
export const emitOrderStatusChanged = (campaignId: string, data: any) => {
  const io = getIO();
  io.to(`campaign-${campaignId}`).emit('order-status-changed', data);
  console.log(`📡 Emitted order-status-changed to campaign-${campaignId}`, data);
};

export const emitOrderCreated = (campaignId: string, data: any) => {
  const io = getIO();
  io.to(`campaign-${campaignId}`).emit('order-created', data);
  console.log(`📡 Emitted order-created to campaign-${campaignId}`, data);
};

export const emitOrderDeleted = (campaignId: string, data: any) => {
  const io = getIO();
  io.to(`campaign-${campaignId}`).emit('order-deleted', data);
  console.log(`📡 Emitted order-deleted to campaign-${campaignId}`, data);
};

export const emitOrderUpdated = (campaignId: string, data: any) => {
  const io = getIO();
  io.to(`campaign-${campaignId}`).emit('order-updated', data);
  console.log(`📡 Emitted order-updated to campaign-${campaignId}`, data);
};

export const emitCampaignUpdated = (campaignId: string, data: any) => {
  const io = getIO();
  io.to(`campaign-${campaignId}`).emit('campaign-updated', data);
  console.log(`📡 Emitted campaign-updated to campaign-${campaignId}`, data);
};

export const emitMessageSent = (orderId: string, data: any) => {
  const io = getIO();
  io.to(`order-${orderId}`).emit('message-sent', data);
  console.log(`📡 Emitted message-sent to order-${orderId}`, data);
};
