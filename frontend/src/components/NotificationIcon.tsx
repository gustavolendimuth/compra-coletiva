import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { messageApi } from '../api';

export const NotificationIcon: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }

    try {
      const { count } = await messageApi.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Fetch unread count on mount and when auth changes
  useEffect(() => {
    fetchUnreadCount();

    // Refresh count every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Listen for custom events to refresh count
  useEffect(() => {
    const handleRefreshCount = () => {
      fetchUnreadCount();
    };

    window.addEventListener('refreshUnreadCount', handleRefreshCount);

    return () => {
      window.removeEventListener('refreshUnreadCount', handleRefreshCount);
    };
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <button
      onClick={fetchUnreadCount}
      className="relative p-2 rounded-md hover:bg-gray-100 transition-colors flex items-center justify-center"
      title="Mensagens não lidas"
    >
      <Bell size={20} className="text-gray-600 flex-shrink-0" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
};
