/**
 * Gmail SMTP Provider usando Nodemailer
 * Fallback para desenvolvimento ou pequenas aplicações
 */

import nodemailer from 'nodemailer';
import { EmailProvider, SendEmailParams, EmailResponse } from './emailProvider.interface';
import { getEmailConfig } from '../../../config/email';

export class GmailProvider implements EmailProvider {
  name = 'gmail';
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initialize();
  }

  /**
   * Inicializa o transporter do Nodemailer
   */
  private initialize(): void {
    const config = getEmailConfig();

    if (!this.isConfigured()) {
      console.warn('[GmailProvider] Not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD.');
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: config.gmail.user,
          pass: config.gmail.appPassword,
        },
      });

      console.log('[GmailProvider] Initialized successfully');
    } catch (error) {
      console.error('[GmailProvider] Failed to initialize:', error);
      this.transporter = null;
    }
  }

  /**
   * Verifica se o provider está configurado
   */
  isConfigured(): boolean {
    const config = getEmailConfig();
    return !!(config.gmail.user && config.gmail.appPassword);
  }

  /**
   * Envia email via Gmail SMTP
   *
   * NOTA: Gmail SMTP sempre usa o email da conta autenticada como remetente
   * por questões de segurança. Porém, podemos customizar o nome do remetente
   * usando o formato: "Nome Customizado" <email@gmail.com>
   */
  async send(params: SendEmailParams): Promise<EmailResponse> {
    if (!this.transporter) {
      return {
        success: false,
        provider: this.name,
        error: 'Gmail provider not configured',
      };
    }

    try {
      const config = getEmailConfig();

      // Gmail sempre usa o email da conta autenticada, mas podemos customizar o nome
      const fromName = config.gmail.fromName || 'Compra Coletiva';
      const fromEmail = config.gmail.user; // Sempre usa o email da conta autenticada
      const from = `"${fromName}" <${fromEmail}>`;

      const mailOptions = {
        from, // Formato: "Nome" <email@gmail.com>
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
        replyTo: params.replyTo,
      };

      const info = await this.transporter.sendMail(mailOptions);

      console.log('[GmailProvider] Email sent successfully:', info.messageId);

      return {
        success: true,
        messageId: info.messageId,
        provider: this.name,
      };
    } catch (error) {
      console.error('[GmailProvider] Failed to send email:', error);

      return {
        success: false,
        provider: this.name,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Verifica conexão com Gmail SMTP
   */
  async verify(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('[GmailProvider] Connection verified');
      return true;
    } catch (error) {
      console.error('[GmailProvider] Connection verification failed:', error);
      return false;
    }
  }
}
