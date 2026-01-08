/**
 * Email Preference Service
 * Handles user email notification preferences
 */

import { apiClient } from '../client';
import type {
  EmailPreference,
  UpdateEmailPreferenceDto,
  UnsubscribeResponse,
  ResubscribeResponse,
} from '../types';

export const emailPreferenceService = {
  /**
   * Get current user's email preferences
   * @returns Email preferences
   */
  get: () =>
    apiClient.get<EmailPreference>('/email-preferences').then(res => res.data),

  /**
   * Update email preferences
   * @param data - Preference fields to update
   * @returns Updated preferences
   */
  update: (data: UpdateEmailPreferenceDto) =>
    apiClient.patch<EmailPreference>('/email-preferences', data).then(res => res.data),

  /**
   * Unsubscribe from all emails (public endpoint, requires token)
   * @param token - Unsubscribe token from email
   * @param userId - User ID
   * @returns Success response
   */
  unsubscribe: (token: string, userId: string) =>
    apiClient
      .post<UnsubscribeResponse>(`/email-preferences/unsubscribe?token=${token}&userId=${userId}`)
      .then(res => res.data),

  /**
   * Resubscribe to emails (authenticated)
   * @returns Updated preferences
   */
  resubscribe: () =>
    apiClient.post<ResubscribeResponse>('/email-preferences/resubscribe').then(res => res.data),
};
