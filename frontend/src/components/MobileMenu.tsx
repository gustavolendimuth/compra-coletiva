import React, { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Users, X } from 'lucide-react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { UserMenu } from './UserMenu';
import { NotificationIcon } from './NotificationIcon';
import { NewCampaignButton } from './NewCampaignButton';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Full-screen mobile menu with smooth animations
 * Appears from the right side and covers the entire viewport
 */
export const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const menuRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when menu is open
  useBodyScrollLock(isOpen);

  // Close menu when route changes
  useEffect(() => {
    if (isOpen) {
      onClose();
    }
  }, [location.pathname]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Focus trap - focus first element when opened
  useEffect(() => {
    if (isOpen && menuRef.current) {
      const focusableElements = menuRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }
    }
  }, [isOpen]);

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Mobile menu panel */}
      <div
        ref={menuRef}
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navegação"
      >
        {/* Header */}
        <div className="bg-primary-600 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Users className="w-6 h-6" />
            <span className="text-lg font-bold">Compra Coletiva</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-primary-700 transition-colors text-white"
            aria-label="Fechar menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Menu content */}
        <div className="flex flex-col h-[calc(100%-72px)] overflow-y-auto">
          {/* Navigation links */}
          <nav className="flex-1 p-6 space-y-4">
            <Link
              to="/campaigns"
              className={`block px-4 py-3 rounded-lg font-semibold text-base transition-colors ${
                location.pathname.includes('/campaigns')
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Campanhas
            </Link>

            {/* New Campaign Button */}
            <div className="pt-2">
              <NewCampaignButton />
            </div>

            {/* Notifications */}
            <div className="border-t pt-4 mt-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3 px-4">
                Notificações
              </h3>
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors">
                <NotificationIcon />
                <span className="text-sm text-gray-700">Mensagens</span>
              </div>
            </div>
          </nav>

          {/* User menu at bottom */}
          <div className="border-t p-6 bg-gray-50">
            <UserMenu />
          </div>
        </div>
      </div>
    </>
  );
};
