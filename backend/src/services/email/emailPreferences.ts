/**
 * EmailPreference Service - Gerencia preferências de email dos usuários
 */

import { prisma } from '../../index';
import { NotificationType } from '@prisma/client';
import { LinkBuilder } from '../../utils/linkBuilder';

export interface EmailPreferenceData {
  emailEnabled: boolean;
  campaignReadyToSend: boolean;
  campaignStatusChanged: boolean;
  campaignArchived: boolean;
  newMessage: boolean;
  digestEnabled: boolean;
  digestFrequency: string;
}

export class EmailPreferenceService {
  /**
   * Obtém preferências do usuário (cria com defaults se não existir)
   */
  static async getOrCreatePreferences(userId: string) {
    try {
      let preferences = await prisma.emailPreference.findUnique({
        where: { userId },
      });

      // Se não existe, criar com defaults
      if (!preferences) {
        preferences = await prisma.emailPreference.create({
          data: {
            userId,
            emailEnabled: true,
            campaignReadyToSend: true,
            campaignStatusChanged: true,
            campaignArchived: true,
            newMessage: true,
            digestEnabled: false,
            digestFrequency: 'DAILY',
          },
        });

        console.log(`[EmailPreferenceService] Created default preferences for user ${userId}`);
      }

      return preferences;
    } catch (error) {
      console.error('[EmailPreferenceService] Error getting/creating preferences:', error);
      throw error;
    }
  }

  /**
   * Atualiza preferências do usuário
   */
  static async updatePreferences(userId: string, data: Partial<EmailPreferenceData>) {
    try {
      // Garantir que preferências existem
      await this.getOrCreatePreferences(userId);

      // Atualizar
      const updated = await prisma.emailPreference.update({
        where: { userId },
        data,
      });

      console.log(`[EmailPreferenceService] Updated preferences for user ${userId}`);
      return updated;
    } catch (error) {
      console.error('[EmailPreferenceService] Error updating preferences:', error);
      throw error;
    }
  }

  /**
   * Verifica se usuário permite receber email de determinado tipo
   */
  static async checkNotificationEnabled(
    userId: string,
    notificationType: NotificationType
  ): Promise<boolean> {
    try {
      const prefs = await this.getOrCreatePreferences(userId);

      // Verificar se emails estão habilitados globalmente
      if (!prefs.emailEnabled) {
        return false;
      }

      // Verificar por tipo específico
      switch (notificationType) {
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
    } catch (error) {
      console.error('[EmailPreferenceService] Error checking notification enabled:', error);
      // Em caso de erro, permitir envio (fail-open)
      return true;
    }
  }

  /**
   * Desabilita todos os emails (unsubscribe)
   */
  static async unsubscribeAll(userId: string) {
    try {
      const updated = await this.updatePreferences(userId, {
        emailEnabled: false,
      });

      console.log(`[EmailPreferenceService] User ${userId} unsubscribed from all emails`);
      return updated;
    } catch (error) {
      console.error('[EmailPreferenceService] Error unsubscribing:', error);
      throw error;
    }
  }

  /**
   * Processa unsubscribe via token
   */
  static async unsubscribeByToken(userId: string, token: string): Promise<boolean> {
    try {
      // Verificar token
      const isValid = LinkBuilder.verifyUnsubscribeToken(token, userId);

      if (!isValid) {
        console.warn(`[EmailPreferenceService] Invalid unsubscribe token for user ${userId}`);
        return false;
      }

      // Desabilitar emails
      await this.unsubscribeAll(userId);
      return true;
    } catch (error) {
      console.error('[EmailPreferenceService] Error processing unsubscribe token:', error);
      return false;
    }
  }

  /**
   * Reabilita emails
   */
  static async resubscribe(userId: string) {
    try {
      const updated = await this.updatePreferences(userId, {
        emailEnabled: true,
      });

      console.log(`[EmailPreferenceService] User ${userId} resubscribed to emails`);
      return updated;
    } catch (error) {
      console.error('[EmailPreferenceService] Error resubscribing:', error);
      throw error;
    }
  }
}
