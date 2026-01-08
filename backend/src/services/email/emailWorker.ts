/**
 * Email Worker - Processa jobs da fila de email
 * Pode rodar no mesmo processo ou em container separado
 */

import { Worker, Job } from 'bullmq';
import { getEmailConfig } from '../../config/email';
import { EmailService } from './emailService';
import { EmailJobData } from './emailQueue';
import {
  renderNotificationEmail,
  renderWelcomeEmail,
  renderPasswordResetEmail,
  EmailTemplateData,
} from './templates';
import { prisma } from '../../index';

let emailWorker: Worker<EmailJobData> | null = null;

/**
 * Processa job de email
 */
async function processEmailJob(job: Job<EmailJobData>): Promise<void> {
  const { data } = job;

  console.log(`[EmailWorker] Processing job ${job.id} (type: ${data.type})`);

  try {
    // Verificar preferências do usuário (se existir)
    const canSend = await checkEmailPreferences(data);
    if (!canSend) {
      console.log(`[EmailWorker] User ${data.userId} opted out of ${data.type} emails`);
      return;
    }

    // Renderizar template apropriado
    let emailContent: { html: string; subject: string; templateName: string };

    if (data.type === 'notification' && data.notificationType) {
      const templateData: EmailTemplateData = {
        userName: data.userName,
        userId: data.userId,
        title: data.title || '',
        message: data.message || '',
        metadata: data.metadata || {},
      };

      emailContent = await renderNotificationEmail(data.notificationType, templateData);
    } else if (data.type === 'welcome') {
      emailContent = await renderWelcomeEmail(data.userName, data.userId);
    } else if (data.type === 'password-reset' && data.resetToken) {
      emailContent = await renderPasswordResetEmail(
        data.userName,
        data.userId,
        data.resetToken
      );
    } else {
      throw new Error(`Invalid job type: ${data.type}`);
    }

    // Enviar email
    const response = await EmailService.send({
      to: data.userEmail,
      subject: emailContent.subject,
      html: emailContent.html,
      userId: data.userId,
      notificationId: data.notificationId,
      templateName: emailContent.templateName,
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to send email');
    }

    console.log(`[EmailWorker] Job ${job.id} completed successfully`);
  } catch (error) {
    console.error(`[EmailWorker] Job ${job.id} failed:`, error);
    throw error;
  }
}

/**
 * Verifica se usuário permite receber este tipo de email
 */
async function checkEmailPreferences(data: EmailJobData): Promise<boolean> {
  try {
    const prefs = await prisma.emailPreference.findUnique({
      where: { userId: data.userId },
    });

    // Se não tem preferências, criar com defaults (tudo habilitado)
    if (!prefs) {
      await prisma.emailPreference.create({
        data: {
          userId: data.userId,
          emailEnabled: true,
          campaignReadyToSend: true,
          campaignStatusChanged: true,
          campaignArchived: true,
          newMessage: true,
        },
      });
      return true;
    }

    // Verificar se emails estão habilitados globalmente
    if (!prefs.emailEnabled) {
      return false;
    }

    // Verificar por tipo de notificação
    if (data.type === 'notification' && data.notificationType) {
      switch (data.notificationType) {
        case 'CAMPAIGN_READY_TO_SEND':
          return prefs.campaignReadyToSend;
        case 'CAMPAIGN_STATUS_CHANGED':
          return prefs.campaignStatusChanged;
        case 'CAMPAIGN_ARCHIVED':
          return prefs.campaignArchived;
        case 'NEW_MESSAGE':
          return prefs.newMessage;
        default:
          return true;
      }
    }

    // Welcome e password reset sempre enviam
    return true;
  } catch (error) {
    console.error('[EmailWorker] Error checking preferences:', error);
    // Em caso de erro, permitir envio (fail-open)
    return true;
  }
}

/**
 * Inicia o worker
 */
export function startEmailWorker(): Worker<EmailJobData> {
  if (emailWorker) {
    console.warn('[EmailWorker] Worker already running');
    return emailWorker;
  }

  const config = getEmailConfig();

  if (!config.enabled) {
    console.log('[EmailWorker] Email system disabled, worker not started');
    throw new Error('Email system is disabled');
  }

  // Configuração de conexão Redis
  const connection = config.redis.url
    ? { url: config.redis.url }
    : {
        host: config.redis.host,
        port: config.redis.port,
      };

  // Criar worker
  emailWorker = new Worker<EmailJobData>('email-queue', processEmailJob, {
    connection,
    concurrency: 5, // Processar até 5 emails simultaneamente
    limiter: {
      max: config.queue.rateLimit,
      duration: 60000, // por minuto
    },
  });

  // Event handlers
  emailWorker.on('completed', (job) => {
    console.log(`[EmailWorker] Job ${job.id} completed`);
  });

  emailWorker.on('failed', (job, error) => {
    console.error(`[EmailWorker] Job ${job?.id} failed:`, error);
  });

  emailWorker.on('error', (error) => {
    console.error('[EmailWorker] Worker error:', error);
  });

  console.log('[EmailWorker] Worker started successfully');
  return emailWorker;
}

/**
 * Para o worker (graceful shutdown)
 */
export async function stopEmailWorker(): Promise<void> {
  if (emailWorker) {
    await emailWorker.close();
    emailWorker = null;
    console.log('[EmailWorker] Worker stopped');
  }
}
