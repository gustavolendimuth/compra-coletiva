import { prisma } from '../index';

/**
 * Fecha automaticamente campanhas que passaram da data limite
 */
export async function closeExpiredCampaigns() {
  const now = new Date();

  try {
    const result = await prisma.campaign.updateMany({
      where: {
        status: 'ACTIVE',
        deadline: {
          lte: now
        }
      },
      data: {
        status: 'CLOSED'
      }
    });

    if (result.count > 0) {
      console.log(`[CampaignScheduler] Closed ${result.count} expired campaign(s)`);
    }

    return result.count;
  } catch (error) {
    console.error('[CampaignScheduler] Error closing expired campaigns:', error);
    throw error;
  }
}

/**
 * Inicia o scheduler para verificar campanhas expiradas
 * @param intervalMs Intervalo em milissegundos (padrão: 1 minuto)
 */
export function startCampaignScheduler(intervalMs: number = 60000) {
  console.log('[CampaignScheduler] Starting scheduler...');

  // Executa imediatamente ao iniciar
  closeExpiredCampaigns();

  // Configura intervalo para execução periódica
  const interval = setInterval(() => {
    closeExpiredCampaigns();
  }, intervalMs);

  // Retorna função para parar o scheduler
  return () => {
    clearInterval(interval);
    console.log('[CampaignScheduler] Scheduler stopped');
  };
}
