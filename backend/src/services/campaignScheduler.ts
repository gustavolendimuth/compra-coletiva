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

    // Escrita condicional por campanha: só fecha a que ainda está ACTIVE e vencida no momento
    // da escrita (uma que virou SENT/CLOSED depois da leitura fica como está)
    const closedIds: string[] = [];
    for (const campaign of expiredCampaigns) {
      const { count } = await prisma.campaign.updateMany({
        where: {
          id: campaign.id,
          status: 'ACTIVE',
          deadline: { lte: now }
        },
        data: {
          status: 'CLOSED'
        }
      });
      if (count > 0) {
        closedIds.push(campaign.id);
      }
    }

    await Promise.all(
      closedIds.map(async (campaignId) => {
        try {
          await PaymentReleaseService.checkAndReleaseForCampaign(campaignId);
        } catch (error) {
          console.error(
            `[CampaignScheduler] Failed to check payment release for campaign ${campaignId}:`,
            error
          );
        }
      })
    );

    if (closedIds.length > 0) {
      console.log(`[CampaignScheduler] Closed ${closedIds.length} expired campaign(s)`);
    }

    return closedIds.length;
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
