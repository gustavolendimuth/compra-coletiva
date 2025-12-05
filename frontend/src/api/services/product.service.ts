/**
 * Product Service
 * Handles all product-related API operations
 */

import { apiClient } from '../client';
import type { Product, CreateProductDto, UpdateProductDto } from '../types';

export const productService = {
  /**
   * Get all products in a campaign
   * @param campaignId - Campaign ID
   * @returns Array of products
   */
  getByCampaign: (campaignId: string) =>
    apiClient.get<Product[]>('/products', { params: { campaignId } }).then(res => res.data),

  /**
   * Create a new product
   * @param data - Product creation data (campaignId, name, price, weight)
   * @returns Created product
   */
  create: (data: CreateProductDto) =>
    apiClient.post<Product>('/products', data).then(res => res.data),

  /**
   * Update an existing product
   * @param id - Product ID
   * @param data - Partial product data to update
   * @returns Updated product
   */
  update: (id: string, data: UpdateProductDto) =>
    apiClient.patch<Product>(`/products/${id}`, data).then(res => res.data),

  /**
   * Delete a product
   * @param id - Product ID
   */
  delete: (id: string) =>
    apiClient.delete(`/products/${id}`).then(res => res.data)
};
