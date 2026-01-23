'use client';

/**
 * NotificationIcon Component
 * Bell icon with badge showing unread notification count
 * Toggles NotificationDropdown on click
 */

import { useState, useRef } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationDropdown } from './NotificationDropdown';

export function NotificationIcon() {
  const { isAuthenticated } = useAuth();
  const { unreadCount } = useNotifications();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  if (!isAuthenticated) {
    return null;
  }

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={toggleDropdown}
        className="p-2 rounded-md hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
        title="Notificações"
        aria-label="Notificações"
        aria-expanded={isDropdownOpen}
      >
        <div className="relative">
          <Bell size={20} className="text-gray-600 flex-shrink-0" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
        <span className="md:hidden text-sm font-medium text-gray-700">
          Notificações
        </span>
      </button>

      <NotificationDropdown
        isOpen={isDropdownOpen}
        onClose={() => setIsDropdownOpen(false)}
        buttonRef={buttonRef}
      />
    </div>
  );
}
