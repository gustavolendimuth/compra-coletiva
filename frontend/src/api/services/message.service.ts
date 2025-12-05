/**
 * Message Service
 * Handles both order messages (private chat) and campaign messages (public Q&A)
 */

import { apiClient } from '../client';
import type {
  OrderMessage,
  CreateOrderMessageDto,
  UnreadCountResponse,
  CampaignMessage,
  CampaignMessageListResponse,
  CampaignMessageListParams,
  CreateCampaignMessageDto,
  CreateCampaignMessageResponse,
  EditCampaignMessageDto,
  AnswerCampaignMessageDto
} from '../types';

/**
 * Order Messages (Private Chat between customer and campaign creator)
 */
export const orderMessageService = {
  /**
   * Get all messages for an order
   * @param orderId - Order ID
   * @returns Array of order messages
   */
  getByOrder: (orderId: string) =>
    apiClient.get<OrderMessage[]>('/messages', { params: { orderId } }).then(res => res.data),

  /**
   * Send a message in an order chat
   * @param data - Message data (orderId, message)
   * @returns Created message
   */
  create: (data: CreateOrderMessageDto) =>
    apiClient.post<OrderMessage>('/messages', data).then(res => res.data),

  /**
   * Get count of unread messages for current user
   * @returns Unread message count
   */
  getUnreadCount: () =>
    apiClient.get<UnreadCountResponse>('/messages/unread-count').then(res => res.data)
};

/**
 * Campaign Messages (Public Q&A for campaigns)
 */
export const campaignMessageService = {
  /**
   * List public Q&A messages for a campaign
   * @param campaignId - Campaign ID
   * @param params - Pagination parameters (limit, offset)
   * @returns Paginated list of campaign messages
   */
  list: (campaignId: string, params?: CampaignMessageListParams) =>
    apiClient.get<CampaignMessageListResponse>('/campaign-messages', {
      params: { campaignId, ...params }
    }).then(res => res.data),

  /**
   * Create a new question in a campaign
   * @param data - Question data (campaignId, question)
   * @returns Created message with spam score and edit deadline
   */
  create: (data: CreateCampaignMessageDto) =>
    apiClient.post<CreateCampaignMessageResponse>('/campaign-messages', data).then(res => res.data),

  /**
   * Edit your own question (within 15 minutes, if not answered)
   * @param id - Message ID
   * @param question - Updated question text
   * @returns Updated message
   */
  edit: (id: string, question: string) =>
    apiClient.patch<CampaignMessage>(`/campaign-messages/${id}`, { question } as EditCampaignMessageDto)
      .then(res => res.data),

  /**
   * Get your own questions in a campaign
   * @param campaignId - Campaign ID
   * @returns Array of your messages (including private unanswered ones)
   */
  getMine: (campaignId: string) =>
    apiClient.get<CampaignMessage[]>('/campaign-messages/mine', {
      params: { campaignId }
    }).then(res => res.data),

  /**
   * [CREATOR ONLY] Get unanswered questions for your campaign
   * @param campaignId - Campaign ID
   * @returns Array of unanswered messages
   */
  getUnanswered: (campaignId: string) =>
    apiClient.get<CampaignMessage[]>('/campaign-messages/unanswered', {
      params: { campaignId }
    }).then(res => res.data),

  /**
   * [CREATOR ONLY] Answer a question (auto-publishes the message)
   * @param id - Message ID
   * @param answer - Answer text
   * @returns Updated message with answer
   */
  answer: (id: string, answer: string) =>
    apiClient.patch<CampaignMessage>(`/campaign-messages/${id}/answer`, { answer } as AnswerCampaignMessageDto)
      .then(res => res.data),

  /**
   * [CREATOR ONLY] Delete a spam question
   * @param id - Message ID
   */
  delete: (id: string) =>
    apiClient.delete(`/campaign-messages/${id}`).then(res => res.data)
};
