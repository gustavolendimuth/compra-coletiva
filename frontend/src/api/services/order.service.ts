/**
 * Order Service
 * Handles all order-related API operations
 */

import { apiClient } from '../client';
import type { Order, CreateOrderDto, UpdateOrderDto, UpdateOrderWithItemsDto } from '../types';

export const orderService = {
  /**
   * Get all orders in a campaign
   * @param campaignId - Campaign ID
   * @returns Array of orders with items
   */
  getByCampaign: (campaignId: string) =>
    apiClient.get<Order[]>('/orders', { params: { campaignId } }).then(res => res.data),

  /**
   * Create a new order
   * @param data - Order creation data (campaignId, items array)
   * @returns Created order with items
   */
  create: (data: CreateOrderDto) =>
    apiClient.post<Order>('/orders', data).then(res => res.data),

  /**
   * Update order properties (isPaid, isSeparated)
   * @param id - Order ID
   * @param data - Partial order data to update
   * @returns Updated order
   */
  update: (id: string, data: UpdateOrderDto) =>
    apiClient.patch<Order>(`/orders/${id}`, data).then(res => res.data),

  /**
   * Update order with items (full replacement)
   * @param id - Order ID
   * @param data - Order items to update
   * @returns Updated order with recalculated totals
   */
  updateWithItems: (id: string, data: UpdateOrderWithItemsDto) =>
    apiClient.put<Order>(`/orders/${id}`, data).then(res => res.data),

  /**
   * Update order payment status with proof
   * @param id - Order ID
   * @param isPaid - Payment status
   * @param file - Payment proof file (required when marking as paid)
   * @returns Updated order
   */
  updatePayment: (id: string, isPaid: boolean, file?: File) => {
    const formData = new FormData();
    formData.append('isPaid', String(isPaid));
    if (file) {
      formData.append('paymentProof', file);
    }
    return apiClient
      .patch<Order>(`/orders/${id}/payment`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((res) => res.data);
  },

  /**
   * Delete an order
   * @param id - Order ID
   */
  delete: (id: string) =>
    apiClient.delete(`/orders/${id}`).then(res => res.data)
};
