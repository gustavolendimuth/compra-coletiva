/**
 * LinkBuilder - Gerador de deep links para notificações por email
 * Cria URLs que navegam direto para o contexto relevante
 */

import crypto from 'crypto';
import { NotificationType, Prisma } from '@prisma/client';
import { getEmailConfig } from '../config/email';
import { getSecret } from '../config/secrets';

/**
 * Chave do unsubscribe derivada do JWT_ACCESS_SECRET (validado no boot),
 * com separação de domínio para não reutilizar a chave do JWT crua.
 */
function getUnsubscribeKey(): Buffer {
  return crypto
    .createHmac('sha256', getSecret('JWT_ACCESS_SECRET'))
    .update('unsubscribe-token-v1')
    .digest();
}

function signUnsubscribePayload(userId: string, timestamp: number): string {
  return crypto
    .createHmac('sha256', getUnsubscribeKey())
    .update(`${userId}:${timestamp}`)
    .digest('hex');
}

export interface NotificationMetadata {
  campaignSlug?: string;
  campaignId?: string;
  campaignName?: string;
  orderId?: string;
  isQuestion?: boolean;
  messageId?: string;
  senderName?: string;
  [key: string]: Prisma.InputJsonValue | undefined;
}

export class LinkBuilder {
  private static baseUrl: string;

  /**
   * Obtém base URL do frontend
   */
  private static getBaseUrl(): string {
    if (!this.baseUrl) {
      const config = getEmailConfig();
      this.baseUrl = config.frontendUrl;
    }
    return this.baseUrl;
  }

  /**
   * Gera deep link a partir do tipo de notificação e metadados
   */
  static buildNotificationLink(
    type: NotificationType,
    metadata: NotificationMetadata
  ): string {
    const baseUrl = this.getBaseUrl();
    const campaignSlug = metadata.campaignSlug || metadata.campaignId;

    switch (type) {
      case 'CAMPAIGN_READY_TO_SEND':
      case 'CAMPAIGN_STATUS_CHANGED':
      case 'CAMPAIGN_ARCHIVED':
      case 'PAYMENT_RELEASED':
        // Link direto para a campanha
        return `${baseUrl}/campanhas/${campaignSlug}`;

      case 'NEW_MESSAGE':
        if (metadata.isQuestion) {
          // Link para tab de Q&A da campanha
          return `${baseUrl}/campanhas/${campaignSlug}?openQuestions=true`;
        } else {
          // Link para chat do pedido
          return `${baseUrl}/campanhas/${campaignSlug}?tab=orders&orderId=${metadata.orderId}&openChat=true`;
        }

      default:
        // Fallback: página inicial
        return baseUrl;
    }
  }

  /**
   * Gera token seguro para unsubscribe
   * Formato: HMAC-SHA256 do userId com secret
   */
  static generateUnsubscribeToken(userId: string): string {
    const timestamp = Date.now();
    const token = signUnsubscribePayload(userId, timestamp);

    return `${token}.${timestamp}`;
  }

  /**
   * Gera link de unsubscribe
   */
  static buildUnsubscribeLink(userId: string): string {
    const baseUrl = this.getBaseUrl();
    const token = this.generateUnsubscribeToken(userId);
    return `${baseUrl}/unsubscribe?token=${token}&userId=${userId}`;
  }

  /**
   * Gera link para página de preferências de email
   */
  static buildPreferencesLink(): string {
    const baseUrl = this.getBaseUrl();
    return `${baseUrl}/email-preferences`;
  }

  /**
   * Verifica validade do token de unsubscribe
   * @param token Token gerado
   * @param userId ID do usuário
   * @param maxAgeMs Idade máxima do token em ms (padrão: 30 dias)
   * @returns true se válido
   */
  static verifyUnsubscribeToken(
    token: string,
    userId: string,
    maxAgeMs: number = 30 * 24 * 60 * 60 * 1000 // 30 dias
  ): boolean {
    try {
      const [hash, timestampStr] = token.split('.');
      const timestamp = parseInt(timestampStr, 10);
      if (!hash || !Number.isFinite(timestamp)) {
        return false;
      }

      // Verificar idade do token
      const age = Date.now() - timestamp;
      if (age > maxAgeMs) {
        console.warn('[LinkBuilder] Token expired');
        return false;
      }

      // Verificar hash
      const expected = Buffer.from(signUnsubscribePayload(userId, timestamp), 'utf8');
      const received = Buffer.from(hash, 'utf8');
      if (received.length !== expected.length) {
        return false;
      }

      return crypto.timingSafeEqual(received, expected);
    } catch (error) {
      console.error('[LinkBuilder] Token verification error:', error);
      return false;
    }
  }

  /**
   * Gera link para campanha específica
   */
  static buildCampaignLink(campaignSlug: string): string {
    const baseUrl = this.getBaseUrl();
    return `${baseUrl}/campanhas/${campaignSlug}`;
  }

  /**
   * Gera link para home
   */
  static buildHomeLink(): string {
    return this.getBaseUrl();
  }

  /**
   * Gera URL completa para asset (imagens, logos)
   */
  static buildAssetUrl(path: string): string {
    const baseUrl = this.getBaseUrl();
    return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  }
}
