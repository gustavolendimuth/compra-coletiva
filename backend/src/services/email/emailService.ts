/**
 * EmailService - Camada de abstração para envio de emails
 * Seleciona automaticamente o provider (Resend → Gmail → erro)
 * Cria registros no EmailLog para rastreamento
 */

import { prisma } from '../../index';
import { getEmailConfig } from '../../config/email';
import { EmailProvider, SendEmailParams, EmailResponse } from './providers/emailProvider.interface';
import { ResendProvider } from './providers/resendProvider';
import { GmailProvider } from './providers/gmailProvider';

export interface SendEmailOptions extends SendEmailParams {
  userId?: string;
  notificationId?: string;
  templateName?: string;
}

export class EmailService {
  private static provider: EmailProvider | null = null;

  /**
   * Obtém o provider configurado (lazy loading)
   */
  private static getProvider(): EmailProvider {
    if (this.provider) {
      return this.provider;
    }

    const config = getEmailConfig();

    // Se emails desabilitados, retornar provider mock
    if (!config.enabled) {
      console.log('[EmailService] Email system disabled');
      throw new Error('Email system is disabled (EMAIL_ENABLED=false)');
    }

    // Auto-seleção de provider
    if (config.provider === 'auto') {
      // Tenta Resend primeiro
      const resendProvider = new ResendProvider();
      if (resendProvider.isConfigured()) {
        console.log('[EmailService] Using Resend provider');
        this.provider = resendProvider;
        return this.provider;
      }

      // Fallback para Gmail
      const gmailProvider = new GmailProvider();
      if (gmailProvider.isConfigured()) {
        console.log('[EmailService] Using Gmail provider (fallback)');
        this.provider = gmailProvider;
        return this.provider;
      }

      throw new Error(
        'No email provider configured. Set RESEND_API_KEY or GMAIL credentials.'
      );
    }

    // Provider específico
    if (config.provider === 'resend') {
      this.provider = new ResendProvider();
    } else if (config.provider === 'gmail') {
      this.provider = new GmailProvider();
    } else {
      throw new Error(`Unknown provider: ${config.provider}`);
    }

    if (!this.provider.isConfigured()) {
      throw new Error(`Provider ${config.provider} is not configured`);
    }

    console.log(`[EmailService] Using ${config.provider} provider`);
    return this.provider;
  }

  /**
   * Envia um email e registra no EmailLog
   */
  static async send(options: SendEmailOptions): Promise<EmailResponse> {
    const {
      userId,
      notificationId,
      templateName,
      ...emailParams
    } = options;

    const resolvedTemplateName = templateName || 'unknown';
    let emailLog: { id: string } | null = null;

    try {
      if (notificationId) {
        const existingSentLog = await prisma.emailLog.findFirst({
          where: {
            notificationId,
            to: emailParams.to,
            templateName: resolvedTemplateName,
            status: 'SENT',
          },
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
            provider: true,
            providerId: true,
          },
        });

        if (existingSentLog) {
          console.log(
            `[EmailService] Skipping duplicate send for notification ${notificationId} (already sent)`
          );
          return {
            success: true,
            provider: existingSentLog.provider,
            messageId: existingSentLog.providerId || undefined,
          };
        }

        const existingOpenLog = await prisma.emailLog.findFirst({
          where: {
            notificationId,
            to: emailParams.to,
            templateName: resolvedTemplateName,
            status: {
              in: ['PENDING', 'RETRYING', 'FAILED'],
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
          },
        });

        if (existingOpenLog) {
          emailLog = await prisma.emailLog.update({
            where: { id: existingOpenLog.id },
            data: {
              attempts: {
                increment: 1,
              },
              status: 'PENDING',
              error: null,
              failedAt: null,
            },
            select: {
              id: true,
            },
          });
        }
      }

      if (!emailLog) {
        // Criar registro inicial no EmailLog
        emailLog = await prisma.emailLog.create({
          data: {
            userId: userId || null,
            notificationId: notificationId || null,
            to: emailParams.to,
            subject: emailParams.subject,
            templateName: resolvedTemplateName,
            provider: 'pending',
            status: 'PENDING',
            attempts: 1,
          },
          select: {
            id: true,
          },
        });
      }

      console.log(`[EmailService] Sending email to ${emailParams.to} (${emailParams.subject})`);

      // Obter provider e enviar
      const provider = this.getProvider();
      const response = await provider.send(emailParams);

      // Atualizar EmailLog com resultado
      if (response.success) {
        await prisma.emailLog.update({
          where: { id: emailLog.id },
          data: {
            status: 'SENT',
            provider: response.provider,
            providerId: response.messageId,
            sentAt: new Date(),
          },
        });

        console.log(`[EmailService] Email sent successfully via ${response.provider}`);
      } else {
        await prisma.emailLog.update({
          where: { id: emailLog.id },
          data: {
            status: 'FAILED',
            provider: response.provider,
            error: response.error,
            failedAt: new Date(),
          },
        });

        console.error(`[EmailService] Email failed:`, response.error);
      }

      return response;
    } catch (error) {
      console.error('[EmailService] Error sending email:', error);

      if (emailLog) {
        await this.markAsFailed(
          emailLog.id,
          error instanceof Error ? error.message : 'Unknown error'
        );
      }

      return {
        success: false,
        provider: 'unknown',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Incrementa tentativas no EmailLog
   */
  static async incrementAttempts(emailLogId: string): Promise<void> {
    try {
      await prisma.emailLog.update({
        where: { id: emailLogId },
        data: {
          attempts: {
            increment: 1,
          },
          status: 'RETRYING',
        },
      });
    } catch (error) {
      console.error('[EmailService] Failed to increment attempts:', error);
    }
  }

  /**
   * Marca email como falha permanente
   */
  static async markAsFailed(emailLogId: string, error: string): Promise<void> {
    try {
      await prisma.emailLog.update({
        where: { id: emailLogId },
        data: {
          status: 'FAILED',
          error,
          failedAt: new Date(),
        },
      });
    } catch (err) {
      console.error('[EmailService] Failed to mark as failed:', err);
    }
  }
}
