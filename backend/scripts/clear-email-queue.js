/**
 * Script to clear the email queue
 * Usage: node scripts/clear-email-queue.js
 */

const { Queue } = require('bullmq');
const Redis = require('ioredis');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

async function clearQueue() {
  console.log('🧹 Clearing email queue...');

  const connection = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
  });

  const emailQueue = new Queue('email-notifications', { connection });

  try {
    // Limpa jobs falhados
    const failedCount = await emailQueue.clean(0, 1000, 'failed');
    console.log(`✅ Removed ${failedCount.length} failed jobs`);

    // Limpa jobs aguardando
    const waitingCount = await emailQueue.clean(0, 1000, 'wait');
    console.log(`✅ Removed ${waitingCount.length} waiting jobs`);

    // Limpa jobs atrasados
    const delayedCount = await emailQueue.clean(0, 1000, 'delayed');
    console.log(`✅ Removed ${delayedCount.length} delayed jobs`);

    // Limpa jobs ativos (em processamento)
    const activeCount = await emailQueue.clean(0, 1000, 'active');
    console.log(`✅ Removed ${activeCount.length} active jobs`);

    // Obliterar completamente a fila (remove tudo, incluindo métricas)
    await emailQueue.obliterate({ force: true });
    console.log('✅ Queue obliterated');

    console.log('🎉 Email queue cleared successfully!');
  } catch (error) {
    console.error('❌ Error clearing queue:', error);
  } finally {
    await emailQueue.close();
    await connection.quit();
    process.exit(0);
  }
}

clearQueue();
