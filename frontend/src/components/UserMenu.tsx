'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/Button';

interface UserMenuProps {
  variant?: 'default' | 'mobile';
  onAction?: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({ variant = 'default', onAction }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
    onAction?.();
  };

  const openAuthModal = (tab: 'login' | 'register' = 'login') => {
    window.dispatchEvent(new CustomEvent('openAuthModal', { detail: { tab } }));
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => openAuthModal('login')}>
          Entrar
        </Button>
        <Button variant="cta" size="sm" onClick={() => openAuthModal('register')}>
          Criar Conta
        </Button>
      </div>
    );
  }

  const getRoleName = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Admin';
      case 'CAMPAIGN_CREATOR': return 'Criador';
      case 'CUSTOMER': return 'Comprador';
      default: return role;
    }
  };

  const avatarInitial = user.name.charAt(0).toUpperCase();

  if (variant === 'mobile') {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0 shadow-sm shadow-sky-300/30">
            {avatarInitial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-base font-semibold text-sky-900 truncate">{user.name}</div>
            <div className="text-sm text-sky-600/70 truncate">{user.email}</div>
            <div className="text-xs text-sky-500/60 mt-0.5">{getRoleName(user.role)}</div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Link
            href="/perfil"
            onClick={onAction}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-sky-800 bg-sky-50 hover:bg-sky-100/80 rounded-2xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Meu Perfil
          </Link>

          {user.role === 'ADMIN' && (
            <Link
              href="/admin"
              onClick={onAction}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-sky-700 bg-sky-100/60 hover:bg-sky-100 rounded-2xl transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Painel de Admin
            </Link>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100/80 rounded-2xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sair da Conta
          </button>
        </div>
      </div>
    );
  }

  // Default variant - dropdown menu
  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-1 rounded-xl hover:bg-sky-50/60 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 shadow-sm shadow-sky-300/20">
          {avatarInitial}
        </div>
        <div className="hidden md:flex items-center min-w-0">
          <div className="text-sm font-medium text-sky-900 truncate leading-tight">{user.name}</div>
        </div>
        <svg
          className={`w-4 h-4 text-sky-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg shadow-sky-200/30 border border-sky-100 py-2 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-sky-100">
            <div className="text-sm font-semibold text-sky-900">{user.name}</div>
            <div className="text-sm text-sky-600/70">{user.email}</div>
            <div className="text-xs text-sky-400/70 mt-0.5">{getRoleName(user.role)}</div>
          </div>

          <div className="py-1">
            <Link
              href="/perfil"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-sky-800 hover:bg-sky-50/80 transition-colors"
            >
              <svg className="w-4 h-4 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Meu Perfil
            </Link>

            {user.role === 'ADMIN' && (
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-sky-700 hover:bg-sky-50/80 transition-colors"
              >
                <svg className="w-4 h-4 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Painel de Admin
              </Link>
            )}
          </div>

          <div className="border-t border-sky-100 pt-1">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50/60 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sair
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
