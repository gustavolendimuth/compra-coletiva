/**
 * Campaign Service
 * Handles all campaign-related API operations
 */

import { apiClient } from '../client';
import type {
  Campaign,
  CampaignListParams,
  CampaignListResponse,
  CreateCampaignDto,
  UpdateCampaignDto,
  CloneCampaignDto
} from '../types';

export const campaignService = {
  /**
   * Get paginated list of campaigns with filters
   * @param params - Query parameters for filtering and pagination
   * @returns Paginated campaign list with suggestions
   */
  list: (params: CampaignListParams = {}) =>
    apiClient.get<CampaignListResponse>('/campaigns', { params }).then(res => res.data),

  /**
   * Get all campaigns (legacy method, uses list internally)
   * @returns Array of campaigns
   */
  getAll: () =>
    apiClient.get<CampaignListResponse>('/campaigns').then(res => res.data.data),

  /**
   * Get campaign by ID
   * @param id - Campaign ID
   * @returns Campaign details
   */
  getById: (id: string) =>
    apiClient.get<Campaign>(`/campaigns/${id}`).then(res => res.data),

  /**
   * Create a new campaign
   * @param data - Campaign creation data
   * @returns Created campaign
   */
  create: (data: CreateCampaignDto) =>
    apiClient.post<Campaign>('/campaigns', data).then(res => res.data),

  /**
   * Update an existing campaign
   * @param id - Campaign ID
   * @param data - Partial campaign data to update
   * @returns Updated campaign
   */
  update: (id: string, data: UpdateCampaignDto) =>
    apiClient.patch<Campaign>(`/campaigns/${id}`, data).then(res => res.data),

  /**
   * Update campaign status
   * @param id - Campaign ID
   * @param status - New status (ACTIVE, CLOSED, SENT, ARCHIVED)
   * @returns Updated campaign
   */
  updateStatus: (id: string, status: 'ACTIVE' | 'CLOSED' | 'SENT' | 'ARCHIVED') =>
    apiClient.patch<Campaign>(`/campaigns/${id}/status`, { status }).then(res => res.data),

  /**
   * Delete a campaign
   * @param id - Campaign ID
   */
  delete: (id: string) =>
    apiClient.delete(`/campaigns/${id}`).then(res => res.data),

  /**
   * Download supplier invoice PDF
   * @param id - Campaign ID
   * @returns Promise that triggers browser download
   */
  downloadSupplierInvoice: async (id: string) => {
    const response = await apiClient.get(`/campaigns/${id}/supplier-invoice`, {
      responseType: 'blob'
    });

    // Create a blob URL and trigger download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;

    // Extract filename from Content-Disposition header or use default
    const contentDisposition = response.headers['content-disposition'];
    let filename = `fatura-fornecedor-${id}.pdf`;
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  /**
   * Clone a campaign with all its products
   * @param id - Campaign ID to clone
   * @param data - New campaign data (name and optional description)
   * @returns Created campaign
   */
  clone: (id: string, data: CloneCampaignDto) =>
    apiClient.post<Campaign>(`/campaigns/${id}/clone`, data).then(res => res.data)
};
