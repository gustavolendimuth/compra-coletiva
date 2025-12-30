/**
 * NotificationDropdown Component
 * Dropdown panel displaying user notifications
 */

import { useEffect, useRef, useState } from 'react';
import { NotificationItem } from './ui/NotificationItem';
import { useNotifications } from '../hooks/useNotifications';
import { Loader2 } from 'lucide-react';
import { Portal } from './ui/Portal';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  buttonRef?: React.RefObject<HTMLButtonElement>;
}

export function NotificationDropdown({
  isOpen,
  onClose,
  buttonRef,
}: NotificationDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, right: 0 });
  const {
    notifications,
    isLoading,
    handleNotificationClick,
    deleteNotification,
  } = useNotifications();

  // Calculate position (fixed positioning for both mobile and desktop)
  useEffect(() => {
    if (isOpen && buttonRef?.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8, // 8px spacing (mt-2)
        right: window.innerWidth - rect.right,
      });
    }
  }, [isOpen, buttonRef]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef?.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, buttonRef]);

  // Close on ESC key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleItemClick = (notification: any) => {
    handleNotificationClick(notification);
    onClose();
  };

  return (
    <Portal>
      <div
        ref={dropdownRef}
        className="fixed w-80 md:w-96 bg-white border border-gray-200 rounded-lg shadow-lg max-h-[80vh] overflow-hidden flex flex-col z-[100]"
        style={{
          top: `${position.top}px`,
          right: `${position.right}px`,
        }}
      >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <h3 className="text-base md:text-lg font-semibold text-gray-900">
          Notificações
        </h3>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </div>
            <p className="text-sm md:text-base text-gray-600 font-medium mb-1">
              Nenhuma notificação
            </p>
            <p className="text-xs md:text-sm text-gray-500">
              Você está em dia!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={handleItemClick}
                onDelete={deleteNotification}
              />
            ))}
          </div>
        )}
      </div>
      </div>
    </Portal>
  );
}
