import { NotificationType } from '@prisma/client';
import { prisma } from '../index';
import { emitNotificationCreated } from './socketService';

export interface NotificationMetadata {
  campaignId?: string;
  campaignName?: string;
  [key: string]: any;
}

export class NotificationService {
  /**
   * Cria uma notificação e emite evento socket
   */
  static async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    metadata?: NotificationMetadata
  ) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          message,
          metadata: metadata || {}
        }
      });

      console.log(`[NotificationService] Created notification for user ${userId}: ${type}`);

      // Emitir evento socket para o usuário
      emitNotificationCreated(userId, notification);

      return notification;
    } catch (error) {
      console.error('[NotificationService] Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Verifica se campanha está CLOSED com todos pagos e cria notificação
   * Retorna true se notificação foi criada
   */
  static async checkAndCreateReadyToSendNotification(campaignId: string): Promise<boolean> {
    try {
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        include: {
          orders: {
            select: {
              id: true,
              isPaid: true
            }
          }
        }
      });

      if (!campaign) {
        return false;
      }

      // Condições para criar notificação:
      // 1. Status = CLOSED
      // 2. Pelo menos 1 pedido
      // 3. TODOS os pedidos pagos
      if (
        campaign.status !== 'CLOSED' ||
        campaign.orders.length === 0 ||
        !campaign.orders.every(order => order.isPaid === true)
      ) {
        return false;
      }

      // Verificar se já existe notificação (evitar duplicatas)
      if (campaign.creatorId) {
        const existingNotification = await prisma.notification.findFirst({
          where: {
            userId: campaign.creatorId,
            type: 'CAMPAIGN_READY_TO_SEND',
            metadata: {
              path: ['campaignId'],
              equals: campaignId
            },
            read: false
          }
        });

        if (existingNotification) {
          return false;
        }

        // Criar notificação
        await this.createNotification(
          campaign.creatorId,
          'CAMPAIGN_READY_TO_SEND',
          'Grupo pronto para enviar',
          `Todos os pedidos do grupo "${campaign.name}" foram pagos. Você pode alterar o status para ENVIADO quando fizer o pedido ao fornecedor.`,
          {
            campaignId: campaign.id,
            campaignName: campaign.name
          }
        );

        console.log(`[NotificationService] Created READY_TO_SEND notification for campaign ${campaignId}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('[NotificationService] Error in checkAndCreateReadyToSendNotification:', error);
      return false;
    }
  }

  /**
   * Marcar notificação como lida
   */
  static async markAsRead(notificationId: string, userId: string) {
    try {
      const notification = await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId
        },
        data: {
          read: true
        }
      });

      return notification.count > 0;
    } catch (error) {
      console.error('[NotificationService] Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Deletar notificação
   */
  static async deleteNotification(notificationId: string, userId: string) {
    try {
      await prisma.notification.deleteMany({
        where: {
          id: notificationId,
          userId
        }
      });
    } catch (error) {
      console.error('[NotificationService] Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Obter contagem de notificações não lidas
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      return await prisma.notification.count({
        where: {
          userId,
          read: false
        }
      });
    } catch (error) {
      console.error('[NotificationService] Error getting unread count:', error);
      return 0;
    }
  }
}
