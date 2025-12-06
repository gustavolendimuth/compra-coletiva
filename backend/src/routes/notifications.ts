import { Router } from 'express';
import { prisma } from '../index';
import { asyncHandler } from '../middleware/errorHandler';
import { requireAuth } from '../middleware/authMiddleware';
import { NotificationService } from '../services/notificationService';

const router = Router();

// GET /api/notifications - Lista todas as notificações do usuário
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' }
  });

  const unreadCount = await NotificationService.getUnreadCount(req.user!.id);

  res.json({
    notifications,
    total: notifications.length,
    unreadCount
  });
}));

// PATCH /api/notifications/:id/read - Marca notificação como lida
router.patch('/:id/read', requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const success = await NotificationService.markAsRead(id, req.user!.id);

  if (!success) {
    return res.status(404).json({ message: 'Notification not found' });
  }

  res.json({ success: true });
}));

// DELETE /api/notifications/:id - Remove notificação
router.delete('/:id', requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;

  await NotificationService.deleteNotification(id, req.user!.id);

  res.json({ success: true });
}));

export default router;
