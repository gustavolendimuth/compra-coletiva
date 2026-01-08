/**
 * Email Queue - Configuração BullMQ para processamento assíncrono de emails
 */

import { Queue } from 'bullmq';
import { getEmailConfig } from '../../config/email';
import { NotificationType } from '@prisma/client';
import { NotificationMetadata } from '../../utils/linkBuilder';

export interface EmailJobData {
  type: 'notification' | 'welcome' | 'password-reset' | 'email-verification';

  // Para notificações
  notificationId?: string;
  notificationType?: NotificationType;
  userId: string;
  userName: string;
  userEmail: string;
  title?: string;
  message?: string;
  metadata?: NotificationMetadata;

  // Para password reset e email verification
  resetToken?: string;
  verificationToken?: string;
  newEmail?: string;
}

let emailQueue: Queue<EmailJobData> | null = null;

/**
 * Obtém ou cria a fila de emails
 */
export function getEmailQueue(): Queue<EmailJobData> {
  if (emailQueue) {
    return emailQueue;
  }

  const config = getEmailConfig();

  // Configuração de conexão Redis
  const connection = config.redis.url
    ? { url: config.redis.url }
    : {
        host: config.redis.host,
        port: config.redis.port,
      };

  // Criar fila
  emailQueue = new Queue<EmailJobData>('email-queue', {
    connection,
    defaultJobOptions: {
      attempts: config.queue.maxAttempts,
      backoff: {
        type: 'exponential',
        delay: config.queue.retryDelay,
      },
      removeOnComplete: {
        count: 100, // Manter últimos 100 jobs completados
        age: 24 * 3600, // 24 horas
      },
      removeOnFail: {
        count: 1000, // Manter últimos 1000 jobs falhados para debug
      },
    },
  });

  console.log('[EmailQueue] Queue initialized successfully');

  return emailQueue;
}

/**
 * Adiciona job de notificação à fila
 */
export async function queueNotificationEmail(
  notificationId: string,
  notificationType: NotificationType,
  userId: string,
  userName: string,
  userEmail: string,
  title: string,
  message: string,
  metadata?: NotificationMetadata
): Promise<void> {
  const queue = getEmailQueue();

  try {
    await queue.add(
      'send-notification-email',
      {
        type: 'notification',
        notificationId,
        notificationType,
        userId,
        userName,
        userEmail,
        title,
        message,
        metadata,
      },
      {
        // Job-specific options
        priority: 1, // Notificações têm prioridade alta
      }
    );

    console.log(`[EmailQueue] Queued notification email for user ${userId}`);
  } catch (error) {
    console.error('[EmailQueue] Failed to queue notification email:', error);
    throw error;
  }
}

/**
 * Adiciona job de boas-vindas à fila
 */
export async function queueWelcomeEmail(
  userId: string,
  userName: string,
  userEmail: string
): Promise<void> {
  const queue = getEmailQueue();

  try {
    await queue.add(
      'send-welcome-email',
      {
        type: 'welcome',
        userId,
        userName,
        userEmail,
      },
      {
        priority: 2, // Menor prioridade que notificações
      }
    );

    console.log(`[EmailQueue] Queued welcome email for user ${userId}`);
  } catch (error) {
    console.error('[EmailQueue] Failed to queue welcome email:', error);
    throw error;
  }
}

/**
 * Adiciona job de reset de senha à fila
 */
export async function queuePasswordResetEmail(
  userId: string,
  userName: string,
  userEmail: string,
  resetToken: string
): Promise<void> {
  const queue = getEmailQueue();

  try {
    await queue.add(
      'send-password-reset-email',
      {
        type: 'password-reset',
        userId,
        userName,
        userEmail,
        resetToken,
      },
      {
        priority: 1, // Alta prioridade
      }
    );

    console.log(`[EmailQueue] Queued password reset email for user ${userId}`);
  } catch (error) {
    console.error('[EmailQueue] Failed to queue password reset email:', error);
    throw error;
  }
}

/**
 * Adiciona job de verificação de email à fila
 */
export async function queueEmailVerificationEmail(
  userId: string,
  newEmail: string,
  verificationToken: string
): Promise<void> {
  const queue = getEmailQueue();

  try {
    await queue.add(
      'send-email-verification',
      {
        type: 'email-verification',
        userId,
        userName: '', // Será preenchido pelo worker
        userEmail: newEmail, // O novo email para onde enviar
        verificationToken,
        newEmail,
      },
      {
        priority: 1, // Alta prioridade
      }
    );

    console.log(`[EmailQueue] Queued email verification for user ${userId}`);
  } catch (error) {
    console.error('[EmailQueue] Failed to queue email verification:', error);
    throw error;
  }
}

/**
 * Fecha a fila (para graceful shutdown)
 */
export async function closeEmailQueue(): Promise<void> {
  if (emailQueue) {
    await emailQueue.close();
    emailQueue = null;
    console.log('[EmailQueue] Queue closed');
  }
}
