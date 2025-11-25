import { Router } from 'express';
import { prisma } from '../index';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { requireAuth, requireMessageAccess } from '../middleware/authMiddleware';
import { z } from 'zod';
import { emitMessageSent } from '../services/socketService';

const router = Router();

const createMessageSchema = z.object({
  orderId: z.string(),
  message: z.string().min(1)
  // senderName e senderType removidos - agora vem do req.user
});

// GET /api/messages?orderId=xxx - Lista mensagens de um pedido
router.get('/', requireAuth, requireMessageAccess, asyncHandler(async (req, res) => {
  const { orderId } = req.query;

  if (!orderId || typeof orderId !== 'string') {
    throw new AppError(400, 'orderId is required');
  }

  const messages = await prisma.orderMessage.findMany({
    where: { orderId },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          role: true
        }
      }
    },
    orderBy: { createdAt: 'asc' }
  });

  // Marca mensagens como lidas se o usuário atual não é o sender
  const messagesToMarkAsRead = messages.filter(
    msg => msg.senderId && msg.senderId !== req.user!.id && !msg.isRead
  );

  if (messagesToMarkAsRead.length > 0) {
    await prisma.orderMessage.updateMany({
      where: {
        id: { in: messagesToMarkAsRead.map(m => m.id) }
      },
      data: { isRead: true }
    });
  }

  res.json(messages);
}));

// POST /api/messages - Cria uma nova mensagem
router.post('/', requireAuth, requireMessageAccess, asyncHandler(async (req, res) => {
  const data = createMessageSchema.parse(req.body);

  // Verifica se o pedido existe
  const order = await prisma.order.findUnique({
    where: { id: data.orderId },
    include: {
      campaign: {
        select: { creatorId: true }
      }
    }
  });

  if (!order) {
    throw new AppError(404, 'Order not found');
  }

  // Cria a mensagem com senderId do usuário autenticado
  const message = await prisma.orderMessage.create({
    data: {
      orderId: data.orderId,
      senderId: req.user!.id,
      message: data.message,
      // Mantém campos legado para compatibilidade (nullable)
      senderName: req.user!.name,
      senderType: req.user!.role === 'ADMIN' || order.campaign.creatorId === req.user!.id ? 'ADMIN' : 'CUSTOMER',
      isRead: false
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          role: true
        }
      }
    }
  });

  // Emite evento Socket.io
  emitMessageSent(data.orderId, message);

  res.status(201).json(message);
}));

// GET /api/messages/unread-count - Conta mensagens não lidas
router.get('/unread-count', requireAuth, asyncHandler(async (req, res) => {
  // Busca pedidos do usuário
  const userOrders = await prisma.order.findMany({
    where: { userId: req.user!.id },
    select: { id: true }
  });

  // Busca campanhas criadas pelo usuário
  const userCampaigns = await prisma.campaign.findMany({
    where: { creatorId: req.user!.id },
    select: {
      orders: {
        select: { id: true }
      }
    }
  });

  const campaignOrderIds = userCampaigns.flatMap(c => c.orders.map(o => o.id));
  const allOrderIds = [...userOrders.map(o => o.id), ...campaignOrderIds];

  // Conta mensagens não lidas onde o usuário NÃO é o sender
  const unreadCount = await prisma.orderMessage.count({
    where: {
      orderId: { in: allOrderIds },
      senderId: { not: req.user!.id },
      isRead: false
    }
  });

  res.json({ count: unreadCount });
}));

export default router;
