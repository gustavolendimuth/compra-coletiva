import { CampaignStatus } from '@prisma/client';
import { prisma } from '../index';
import { emitCampaignUpdated } from './socketService';

/**
 * Interface para resultado de mudança de status
 */
interface StatusChangeResult {
  changed: boolean;
  previousStatus?: CampaignStatus;
  newStatus?: CampaignStatus;
  reason?: string;
}

/**
 * Serviço para gerenciar mudanças automáticas de status de campanhas
 * baseadas no estado de pagamento dos pedidos.
 */
export class CampaignStatusService {
  /**
   * Verifica se uma campanha deve ser arquivada automaticamente e realiza o arquivamento.
   *
   * Condições para arquivamento:
   * 1. Status da campanha deve ser SENT
   * 2. Campanha deve ter pelo menos 1 pedido
   * 3. TODOS os pedidos devem estar marcados como pagos (isPaid = true)
   *
   * @param campaignId - ID da campanha a verificar
   * @returns Resultado indicando se houve mudança de status
   */
  static async checkAndArchiveCampaign(campaignId: string): Promise<StatusChangeResult> {
    try {
      // Buscar campanha com todos os pedidos (apenas campos necessários)
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

      // Verificação 1: Campanha existe?
      if (!campaign) {
        return {
          changed: false,
          reason: 'Campaign not found'
        };
      }

      // Verificação 2: Status é SENT?
      if (campaign.status !== 'SENT') {
        return {
          changed: false,
          reason: `Campaign status is ${campaign.status}, not SENT`
        };
      }

      // Verificação 3: Tem pelo menos 1 pedido?
      if (campaign.orders.length === 0) {
        return {
          changed: false,
          reason: 'Campaign has no orders'
        };
      }

      // Verificação 4: Todos os pedidos estão pagos?
      const allOrdersPaid = campaign.orders.every(order => order.isPaid === true);

      if (!allOrdersPaid) {
        const unpaidCount = campaign.orders.filter(order => !order.isPaid).length;
        return {
          changed: false,
          reason: `Campaign has ${unpaidCount} unpaid order(s) out of ${campaign.orders.length}`
        };
      }

      // Todas as condições atendidas - arquivar a campanha
      const updatedCampaign = await prisma.campaign.update({
        where: { id: campaignId },
        data: { status: 'ARCHIVED' }
      });

      console.log(
        `[CampaignStatusService] Auto-archived campaign ${campaignId} - ` +
        `all ${campaign.orders.length} order(s) are paid`
      );

      // Emitir evento socket para notificar clientes conectados
      emitCampaignUpdated(campaignId, {
        status: 'ARCHIVED',
        autoArchived: true,
        reason: 'all_orders_paid'
      });

      return {
        changed: true,
        previousStatus: campaign.status,
        newStatus: updatedCampaign.status
      };

    } catch (error) {
      console.error('[CampaignStatusService] Error in checkAndArchiveCampaign:', error);
      throw error;
    }
  }

  /**
   * Verifica se uma campanha arquivada deve voltar para SENT e realiza a reversão.
   *
   * Condições para reversão:
   * 1. Status da campanha deve ser ARCHIVED
   * 2. Campanha deve ter pelo menos 1 pedido
   * 3. PELO MENOS UM pedido deve estar marcado como não pago (isPaid = false)
   *
   * @param campaignId - ID da campanha a verificar
   * @returns Resultado indicando se houve mudança de status
   */
  static async checkAndUnarchiveCampaign(campaignId: string): Promise<StatusChangeResult> {
    try {
      // Buscar campanha com todos os pedidos (apenas campos necessários)
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

      // Verificação 1: Campanha existe?
      if (!campaign) {
        return {
          changed: false,
          reason: 'Campaign not found'
        };
      }

      // Verificação 2: Status é ARCHIVED?
      if (campaign.status !== 'ARCHIVED') {
        return {
          changed: false,
          reason: `Campaign status is ${campaign.status}, not ARCHIVED`
        };
      }

      // Verificação 3: Tem pelo menos 1 pedido?
      if (campaign.orders.length === 0) {
        return {
          changed: false,
          reason: 'Campaign has no orders'
        };
      }

      // Verificação 4: Existe algum pedido não pago?
      const hasUnpaidOrders = campaign.orders.some(order => order.isPaid === false);

      if (!hasUnpaidOrders) {
        return {
          changed: false,
          reason: 'All orders are still paid'
        };
      }

      // Todas as condições atendidas - reverter para SENT
      const updatedCampaign = await prisma.campaign.update({
        where: { id: campaignId },
        data: { status: 'SENT' }
      });

      const unpaidCount = campaign.orders.filter(order => !order.isPaid).length;
      console.log(
        `[CampaignStatusService] Auto-unarchived campaign ${campaignId} - ` +
        `${unpaidCount} unpaid order(s) detected`
      );

      // Emitir evento socket para notificar clientes conectados
      emitCampaignUpdated(campaignId, {
        status: 'SENT',
        autoUnarchived: true,
        reason: 'unpaid_orders_detected'
      });

      return {
        changed: true,
        previousStatus: campaign.status,
        newStatus: updatedCampaign.status
      };

    } catch (error) {
      console.error('[CampaignStatusService] Error in checkAndUnarchiveCampaign:', error);
      throw error;
    }
  }
}
