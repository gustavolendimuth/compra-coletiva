/**
 * Validation Service
 * Handles financial validation and integrity checks
 */

import { apiClient } from '../client';
import type { ValidationResult } from '../types';

export const validationService = {
  /**
   * Validate financial integrity of a campaign
   * Checks:
   * - Shipping distribution (sum of order shipping fees = campaign shipping cost)
   * - Total calculation (sum of order totals = sum of subtotals + shipping cost)
   * - Paid/unpaid sum (sum of paid + unpaid orders = sum of all order totals)
   *
   * @param campaignId - Campaign ID
   * @returns Validation result with detailed checks
   */
  validateCampaign: (campaignId: string) =>
    apiClient.get<ValidationResult>(`/validation/campaign/${campaignId}`).then(res => res.data)
};
