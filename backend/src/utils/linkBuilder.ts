/**
 * LinkBuilder - Gerador de deep links para notificações por email
 * Cria URLs que navegam direto para o contexto relevante
 */

import crypto from 'crypto';
import { NotificationType } from '@prisma/client';
import { getEmailConfig } from '../config/email';

export interface NotificationMetadata {
  campaignSlug?: string;
  campaignId?: string;
  orderId?: string;
  isQuestion?: boolean;
  messageId?: string;
  [key: string]: any;
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
    const secret = process.env.JWT_SECRET || 'default-secret-change-me';
    const timestamp = Date.now();
    const payload = `${userId}:${timestamp}`;

    const token = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

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

      // Verificar idade do token
      const age = Date.now() - timestamp;
      if (age > maxAgeMs) {
        console.warn('[LinkBuilder] Token expired');
        return false;
      }

      // Verificar hash
      const secret = process.env.JWT_SECRET || 'default-secret-change-me';
      const payload = `${userId}:${timestamp}`;
      const expectedHash = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      return hash === expectedHash;
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
