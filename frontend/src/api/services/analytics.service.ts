/**
 * Analytics Service
 * Handles campaign analytics and statistics
 */

import { apiClient } from '../client';
import type { Analytics } from '../types';

export const analyticsService = {
  /**
   * Get analytics for a specific campaign
   * @param campaignId - Campaign ID
   * @returns Campaign analytics (totals, by product, by customer)
   */
  getByCampaign: (campaignId: string) =>
    apiClient.get<Analytics>(`/analytics/campaign/${campaignId}`).then(res => res.data)
};
