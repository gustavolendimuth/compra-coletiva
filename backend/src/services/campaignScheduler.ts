import { prisma } from '../index';
import { PaymentReleaseService } from './paymentReleaseService';

/**
 * Fecha automaticamente grupos que passaram da data limite
 */
export async function closeExpiredCampaigns() {
  const now = new Date();

  try {
    const expiredCampaigns = await prisma.campaign.findMany({
      where: {
        status: 'ACTIVE',
        deadline: {
          lte: now
        }
      },
      select: { id: true }
    });

    if (expiredCampaigns.length === 0) {
      return 0;
    }

    await prisma.campaign.updateMany({
      where: {
        id: { in: expiredCampaigns.map(campaign => campaign.id) }
      },
      data: {
        status: 'CLOSED'
      }
    });

    await Promise.all(
      expiredCampaigns.map(async (campaign) => {
        try {
          await PaymentReleaseService.checkAndReleaseForCampaign(campaign.id);
        } catch (error) {
          console.error(
            `[CampaignScheduler] Failed to check payment release for campaign ${campaign.id}:`,
            error
          );
        }
      })
    );

    if (expiredCampaigns.length > 0) {
      console.log(`[CampaignScheduler] Closed ${expiredCampaigns.length} expired campaign(s)`);
    }

    return expiredCampaigns.length;
  } catch (error) {
    console.error('[CampaignScheduler] Error closing expired campaigns:', error);
    return 0;
  }
}

/**
 * Inicia o scheduler para verificar grupos expirados
 * @param intervalMs Intervalo em milissegundos (padrão: 1 minuto)
 */
export function startCampaignScheduler(intervalMs: number = 60000) {
  console.log('[CampaignScheduler] Starting scheduler...');

  // Executa imediatamente ao iniciar
  void closeExpiredCampaigns();

  // Configura intervalo para execução periódica
  const interval = setInterval(() => {
    void closeExpiredCampaigns();
  }, intervalMs);

  // Retorna função para parar o scheduler
  return () => {
    clearInterval(interval);
    console.log('[CampaignScheduler] Scheduler stopped');
  };
}
