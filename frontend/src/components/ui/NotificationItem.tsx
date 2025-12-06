/**
 * NotificationItem Component
 * Individual notification item with click and delete actions
 */

import { X, Bell, Archive, CheckCircle, MessageCircle } from 'lucide-react';
import type { Notification } from '../../api/types';

interface NotificationItemProps {
  notification: Notification;
  onClick: (notification: Notification) => void;
  onDelete: (id: string) => void;
}

export function NotificationItem({
  notification,
  onClick,
  onDelete,
}: NotificationItemProps) {
  const formatDate = (date: string) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInMs = now.getTime() - notificationDate.getTime();
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Agora';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInHours < 24) return `${diffInHours}h`;
    if (diffInDays < 7) return `${diffInDays}d`;

    return notificationDate.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    });
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'CAMPAIGN_READY_TO_SEND':
        return <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />;
      case 'CAMPAIGN_ARCHIVED':
        return <Archive className="w-5 h-5 text-gray-600 flex-shrink-0" />;
      case 'NEW_MESSAGE':
        return <MessageCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />;
      default:
        return <Bell className="w-5 h-5 text-blue-600 flex-shrink-0" />;
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(notification.id);
  };

  return (
    <div
      onClick={() => onClick(notification)}
      className={`flex gap-3 p-3 md:p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
        !notification.isRead ? 'bg-blue-50' : ''
      }`}
    >
      {/* Icon */}
      <div className="pt-1">
        {getIcon()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4 className={`text-sm md:text-base font-medium ${
            !notification.isRead ? 'text-gray-900' : 'text-gray-700'
          }`}>
            {notification.title}
          </h4>

          <button
            onClick={handleDelete}
            className="p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
            aria-label="Remover notificação"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <p className="text-xs md:text-sm text-gray-600 mb-2 break-words">
          {notification.message}
        </p>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {formatDate(notification.createdAt)}
          </span>
          {!notification.isRead && (
            <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />
          )}
        </div>
      </div>
    </div>
  );
}
