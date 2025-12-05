/**
 * Notification Service
 * Handles user notifications
 */

import { apiClient } from '../client';
import type { Notification, NotificationListResponse } from '../types';

export const notificationService = {
  /**
   * Get all notifications for current user
   * @returns List of notifications with unread count
   */
  list: () =>
    apiClient.get<NotificationListResponse>('/notifications').then(res => res.data),

  /**
   * Mark a notification as read
   * @param id - Notification ID
   * @returns Updated notification
   */
  markAsRead: (id: string) =>
    apiClient.patch<Notification>(`/notifications/${id}/read`).then(res => res.data),

  /**
   * Delete a notification
   * @param id - Notification ID
   */
  delete: (id: string) =>
    apiClient.delete(`/notifications/${id}`).then(res => res.data)
};
