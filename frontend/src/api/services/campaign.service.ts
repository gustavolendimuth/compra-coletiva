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
  CloneCampaignDto,
  DistanceResult,
  CampaignOrdersSummaryResponse
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
   * Get campaign by ID or slug
   * @param idOrSlug - Campaign ID or slug
   * @returns Campaign details
   */
  getById: (idOrSlug: string) =>
    apiClient.get<Campaign>(`/campaigns/${idOrSlug}`).then(res => res.data),
  
  /**
   * Get campaign by slug (alias for getById)
   * @param slug - Campaign slug
   * @returns Campaign details
   */
  getBySlug: (slug: string) =>
    apiClient.get<Campaign>(`/campaigns/${slug}`).then(res => res.data),

  /**
   * Create a new campaign
   * @param data - Campaign creation data
   * @returns Created campaign
   */
  create: (data: CreateCampaignDto) =>
    apiClient.post<Campaign>('/campaigns', data).then(res => res.data),

  /**
   * Update an existing campaign
   * @param idOrSlug - Campaign ID or slug
   * @param data - Partial campaign data to update
   * @returns Updated campaign
   */
  update: (idOrSlug: string, data: UpdateCampaignDto) =>
    apiClient.patch<Campaign>(`/campaigns/${idOrSlug}`, data).then(res => res.data),

  /**
   * Update campaign status
   * @param idOrSlug - Campaign ID or slug
   * @param status - New status (ACTIVE, CLOSED, SENT, ARCHIVED)
   * @returns Updated campaign
   */
  updateStatus: (idOrSlug: string, status: 'ACTIVE' | 'CLOSED' | 'SENT' | 'ARCHIVED') =>
    apiClient.patch<Campaign>(`/campaigns/${idOrSlug}/status`, { status }).then(res => res.data),

  /**
   * Delete a campaign
   * @param idOrSlug - Campaign ID or slug
   */
  delete: (idOrSlug: string) =>
    apiClient.delete(`/campaigns/${idOrSlug}`).then(res => res.data),

  /**
   * Download supplier invoice PDF
   * @param idOrSlug - Campaign ID or slug
   * @returns Promise that triggers browser download
   */
  downloadSupplierInvoice: async (idOrSlug: string) => {
    const response = await apiClient.get(`/campaigns/${idOrSlug}/supplier-invoice`, {
      responseType: 'blob'
    });

    // Create a blob URL and trigger download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;

    // Extract filename from Content-Disposition header or use default
    const contentDisposition = response.headers['content-disposition'];
    let filename = `fatura-fornecedor-${idOrSlug}.pdf`;
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
   * Get a plain-text summary of all campaign orders for sharing
   * @param idOrSlug - Campaign ID or slug
   */
  getOrdersSummary: (idOrSlug: string) =>
    apiClient
      .get<CampaignOrdersSummaryResponse>(`/campaigns/${idOrSlug}/orders-summary`)
      .then((res) => res.data),

  /**
   * Clone a campaign with all its products
   * @param idOrSlug - Campaign ID or slug to clone
   * @param data - New campaign data (name and optional description)
   * @returns Created campaign
   */
  clone: (idOrSlug: string, data: CloneCampaignDto) =>
    apiClient.post<Campaign>(`/campaigns/${idOrSlug}/clone`, data).then(res => res.data),

  /**
   * Upload campaign image
   * @param idOrSlug - Campaign ID or slug
   * @param file - Image file to upload
   * @returns Upload response with image URL
   */
  uploadImage: async (idOrSlug: string, file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    
    return apiClient.post<{ message: string; imageUrl: string; storageType: 'S3' | 'LOCAL' }>(
      `/campaigns/${idOrSlug}/image`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    ).then(res => res.data);
  },

  /**
   * Delete campaign image
   * @param idOrSlug - Campaign ID or slug
   */
  deleteImage: (idOrSlug: string) =>
    apiClient.delete(`/campaigns/${idOrSlug}/image`).then(res => res.data),

  /**
   * Calculate distance to a campaign's pickup location
   */
  getDistance: (
    idOrSlug: string,
    params: { zipCode?: string; coords?: { lat: number; lng: number } }
  ) =>
    apiClient
      .get<DistanceResult>(`/campaigns/${idOrSlug}/distance`, {
        params: {
          fromZipCode: params.zipCode ? params.zipCode.replace(/\D/g, "") : undefined,
          fromLat: params.coords?.lat,
          fromLng: params.coords?.lng,
        },
      })
      .then((res) => res.data),
};
