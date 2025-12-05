/**
 * Feedback Service
 * Handles user feedback and bug reports
 */

import { apiClient } from '../client';
import type {
  Feedback,
  CreateFeedbackDto,
  UpdateFeedbackDto,
  FeedbackListParams,
  FeedbackListResponse,
  FeedbackStatsResponse
} from '../types';

export const feedbackService = {
  /**
   * Create new feedback (authenticated or anonymous with email)
   * @param data - Feedback data (type, title, description, email?)
   * @returns Created feedback
   */
  create: (data: CreateFeedbackDto) =>
    apiClient.post<Feedback>('/feedback', data).then(res => res.data),

  /**
   * [ADMIN ONLY] List all feedback with filters
   * @param params - Filter parameters (type, status, limit, offset)
   * @returns Paginated feedback list
   */
  list: (params?: FeedbackListParams) =>
    apiClient.get<FeedbackListResponse>('/feedback', { params }).then(res => res.data),

  /**
   * Get feedback submitted by current user
   * @returns Array of user's feedback
   */
  getMine: () =>
    apiClient.get<Feedback[]>('/feedback/my').then(res => res.data),

  /**
   * [ADMIN ONLY] Get feedback statistics
   * @returns Statistics by type and status
   */
  getStats: () =>
    apiClient.get<FeedbackStatsResponse>('/feedback/stats').then(res => res.data),

  /**
   * [ADMIN ONLY] Update feedback status
   * @param id - Feedback ID
   * @param data - Update data (status, adminNotes)
   * @returns Updated feedback
   */
  updateStatus: (id: string, data: UpdateFeedbackDto) =>
    apiClient.patch<Feedback>(`/feedback/${id}`, data).then(res => res.data),

  /**
   * [ADMIN ONLY] Delete feedback
   * @param id - Feedback ID
   */
  delete: (id: string) =>
    apiClient.delete(`/feedback/${id}`).then(res => res.data)
};
