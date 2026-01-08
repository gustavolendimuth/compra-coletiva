/**
 * Interface para provedores de email (Resend, Gmail, etc)
 */

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  provider: string;
  error?: string;
}

export interface EmailProvider {
  /**
   * Nome do provider
   */
  name: string;

  /**
   * Envia um email
   * @param params Parâmetros do email
   * @returns Resposta do envio
   */
  send(params: SendEmailParams): Promise<EmailResponse>;

  /**
   * Verifica se o provider está configurado corretamente
   * @returns true se configurado
   */
  isConfigured(): boolean;
}
