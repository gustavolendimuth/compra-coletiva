import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, ChevronDown } from 'lucide-react';

interface UserMenuProps {
  variant?: 'default' | 'mobile';
  onAction?: () => void; // Callback for when an action is performed (like logout)
}

export const UserMenu: React.FC<UserMenuProps> = ({ variant = 'default', onAction }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
    onAction?.(); // Call callback if provided
  };

  const openAuthModal = (tab: 'login' | 'register' = 'login') => {
    window.dispatchEvent(new CustomEvent('openAuthModal', { detail: { tab } }));
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => openAuthModal('login')}
          className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Entrar
        </button>
        <button
          onClick={() => openAuthModal('register')}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Criar Conta
        </button>
      </div>
    );
  }

  const getRoleName = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Admin';
      case 'CAMPAIGN_CREATOR':
        return 'Criador';
      case 'CUSTOMER':
        return 'Comprador';
      default:
        return role;
    }
  };

  // Mobile variant - fixed layout with all info visible
  if (variant === 'mobile') {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium text-lg flex-shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-base font-semibold text-gray-900 truncate">{user.name}</div>
            <div className="text-sm text-gray-600 truncate">{user.email}</div>
            <div className="text-xs text-gray-500 mt-0.5">{getRoleName(user.role)}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
        >
          <LogOut size={18} />
          Sair da Conta
        </button>
      </div>
    );
  }

  // Default variant - dropdown menu
  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium flex-shrink-0">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="hidden md:flex flex-col justify-center min-w-0">
          <div className="text-sm font-medium text-gray-700 truncate leading-tight">{user.name}</div>
          <div className="text-xs text-gray-500 leading-tight">{getRoleName(user.role)}</div>
        </div>
        <ChevronDown
          size={16}
          className={`text-gray-500 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="text-sm font-medium text-gray-900">{user.name}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
            <div className="text-xs text-gray-400 mt-1">{getRoleName(user.role)}</div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      )}
    </div>
  );
};
