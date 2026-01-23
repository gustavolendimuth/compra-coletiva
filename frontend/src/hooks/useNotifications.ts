'use client';

/**
 * useNotifications Hook
 * Manages notification fetching, state, and actions
 */

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { notificationService } from '../api';
import type { Notification } from '../api/types';
import toast from 'react-hot-toast';
import { getSocket } from '../lib/socket';

export function useNotifications() {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();

  // Fetch notifications
  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationService.list,
    enabled: isAuthenticated,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  // Real-time notifications via Socket.IO
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    const socket = getSocket();

    // Note: Backend auto-joins user to `user-${userId}` room on connection
    // No need to manually join, just listen for events

    // Listen for new notifications
    const handleNotificationCreated = (notification: Notification) => {
      // Invalidate notifications query to refetch
      queryClient.invalidateQueries({ queryKey: ['notifications'] });

      // Show toast notification
      toast.success(notification.title, {
        duration: 4000,
        icon: '🔔',
      });
    };

    // Refetch notifications when socket connects/reconnects
    // This ensures we don't miss any notifications during connection
    const handleConnect = () => {
      console.log('[useNotifications] Socket connected, refetching notifications');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };

    socket.on('notification-created', handleNotificationCreated);
    socket.on('connect', handleConnect);

    // If socket is already connected, trigger initial refetch
    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off('notification-created', handleNotificationCreated);
      socket.off('connect', handleConnect);
    };
  }, [isAuthenticated, user?.id, queryClient]);

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: () => {
      toast.error('Erro ao marcar notificação como lida');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notificação removida');
    },
    onError: () => {
      toast.error('Erro ao remover notificação');
    },
  });

  // Handle notification click - navigate and mark as read
  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }

    // Navigate based on notification type
    // Prefer campaignSlug, fallback to campaignId for backward compatibility
    const campaignSlug = notification.metadata?.campaignSlug || notification.metadata?.campaignId;
    const isQuestion = notification.metadata?.isQuestion;

    switch (notification.type) {
      case 'CAMPAIGN_READY_TO_SEND':
      case 'CAMPAIGN_STATUS_CHANGED':
      case 'CAMPAIGN_ARCHIVED':
        if (campaignSlug) {
          router.push(`/campanhas/${campaignSlug}`);
        }
        break;
      case 'NEW_MESSAGE':
        if (campaignSlug) {
          if (isQuestion) {
            // Navigate to campaign questions tab
            router.push(`/campanhas/${campaignSlug}?openQuestions=true`);
          } else {
            // Navigate to campaign detail page
            router.push(`/campanhas/${campaignSlug}`);
          }
        }
        break;
      default:
        console.warn('Unknown notification type:', notification.type);
    }
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead: markAsReadMutation.mutate,
    deleteNotification: deleteMutation.mutate,
    handleNotificationClick,
  };
}
