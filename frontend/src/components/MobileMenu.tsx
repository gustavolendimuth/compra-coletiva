import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { UserMenu } from './UserMenu';
import { NotificationIcon } from './NotificationIcon';
import { NewCampaignButton } from './NewCampaignButton';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const MENU_ITEMS = [
  { to: '/campaigns', label: 'Campanhas' },
] as const;

/**
 * Full-screen mobile menu with smooth animations
 * Appears from the left side and covers the entire viewport
 */
export const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const menuRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  console.log('MobileMenu render - isOpen:', isOpen, 'isAnimating:', isAnimating);

  // Trigger animation when isOpen changes
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    }
  }, [isOpen]);

  // Lock body scroll when menu is open
  useBodyScrollLock(isOpen);

  // Enhanced focus trap with return focus capability
  useFocusTrap(menuRef, isOpen, { returnFocusOnCleanup: true });

  // Close menu when route changes (but not on initial mount)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

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

  // Handle swipe to close (right to left)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    // Swipe left (close gesture)
    if (touchStartX.current - touchEndX.current > 50) {
      onClose();
    }
    // Reset values
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  // Don't render if never opened
  if (!isOpen && !isAnimating) return null;

  return (
    <>
      {/* Full-screen backdrop with blur and darkening */}
      <div
        className={`fixed top-16 left-0 right-0 bottom-0 bg-black/40 backdrop-blur-sm z-[60] transition-all duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Mobile menu panel */}
      <div
        ref={menuRef}
        className={`fixed top-16 left-0 bottom-0 w-[85%] max-w-md bg-white shadow-[8px_0_24px_-8px_rgba(0,0,0,0.2)] z-[70] transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navegação"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Menu content - full height now */}
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Navigation links */}
          <nav className="flex-1 p-6 space-y-4">
            {MENU_ITEMS.map((item, index) => (
              <Link
                key={item.to}
                to={item.to}
                className={`block px-4 py-3 rounded-lg font-semibold text-base transition-all ${
                  location.pathname.includes(item.to)
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100 hover:scale-[1.02]'
                } ${isOpen ? 'animate-slide-in opacity-100' : 'opacity-0'}`}
                style={{
                  animationDelay: isOpen ? `${50 + index * 50}ms` : '0ms',
                  animationFillMode: 'backwards'
                }}
              >
                {item.label}
              </Link>
            ))}

            {/* New Campaign Button */}
            <div
              className={`pt-2 ${isOpen ? 'animate-slide-in opacity-100' : 'opacity-0'}`}
              style={{
                animationDelay: isOpen ? `${50 + MENU_ITEMS.length * 50}ms` : '0ms',
                animationFillMode: 'backwards'
              }}
            >
              <NewCampaignButton onModalOpen={onClose} />
            </div>

            {/* Notifications */}
            <div
              className={`border-t pt-4 mt-4 ${isOpen ? 'animate-slide-in opacity-100' : 'opacity-0'}`}
              style={{
                animationDelay: isOpen ? `${50 + (MENU_ITEMS.length + 1) * 50}ms` : '0ms',
                animationFillMode: 'backwards'
              }}
            >
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
          <div
            className={`border-t p-6 bg-gray-50 ${isOpen ? 'animate-slide-in opacity-100' : 'opacity-0'}`}
            style={{
              animationDelay: isOpen ? `${50 + (MENU_ITEMS.length + 2) * 50}ms` : '0ms',
              animationFillMode: 'backwards'
            }}
          >
            <UserMenu variant="mobile" onAction={onClose} />
          </div>
        </div>
      </div>
    </>
  );
};
