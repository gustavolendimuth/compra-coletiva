import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

let io: Server | null = null;

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

  io.on('connection', (socket: Socket) => {
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
