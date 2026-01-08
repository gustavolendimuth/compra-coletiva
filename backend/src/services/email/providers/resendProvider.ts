/**
 * Resend Provider
 * Recomendado para produção - 3k emails/mês grátis
 */

import { Resend } from 'resend';
import { EmailProvider, SendEmailParams, EmailResponse } from './emailProvider.interface';
import { getEmailConfig } from '../../../config/email';

export class ResendProvider implements EmailProvider {
  name = 'resend';
  private client: Resend | null = null;

  constructor() {
    this.initialize();
  }

  /**
   * Inicializa o cliente Resend
   */
  private initialize(): void {
    const config = getEmailConfig();

    if (!this.isConfigured()) {
      console.warn('[ResendProvider] Not configured. Set RESEND_API_KEY.');
      return;
    }

    try {
      this.client = new Resend(config.resend.apiKey);
      console.log('[ResendProvider] Initialized successfully');
    } catch (error) {
      console.error('[ResendProvider] Failed to initialize:', error);
      this.client = null;
    }
  }

  /**
   * Verifica se o provider está configurado
   */
  isConfigured(): boolean {
    const config = getEmailConfig();
    return !!config.resend.apiKey;
  }

  /**
   * Envia email via Resend API
   */
  async send(params: SendEmailParams): Promise<EmailResponse> {
    if (!this.client) {
      return {
        success: false,
        provider: this.name,
        error: 'Resend provider not configured',
      };
    }

    try {
      const config = getEmailConfig();

      const { data, error } = await this.client.emails.send({
        from: params.from || config.resend.fromEmail,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
        reply_to: params.replyTo,
      });

      if (error) {
        console.error('[ResendProvider] API error:', error);
        return {
          success: false,
          provider: this.name,
          error: error.message || 'Resend API error',
        };
      }

      console.log('[ResendProvider] Email sent successfully:', data?.id);

      return {
        success: true,
        messageId: data?.id,
        provider: this.name,
      };
    } catch (error) {
      console.error('[ResendProvider] Failed to send email:', error);

      return {
        success: false,
        provider: this.name,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
