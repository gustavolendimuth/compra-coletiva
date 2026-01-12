import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

/**
 * Modal Component - Design System Primitive
 *
 * Mobile-first modal that's centered on all screen sizes.
 * On mobile: centered with padding, rounded corners
 * On desktop: centered with max-width constraints
 * Follows design system colors, shadows, and spacing.
 * Handles body scroll locking and keyboard accessibility.
 */
export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  className
}: ModalProps) => {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'md:max-w-sm',
    md: 'md:max-w-2xl',
    lg: 'md:max-w-4xl',
    xl: 'md:max-w-6xl',
    full: 'md:max-w-full md:m-4'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-0">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Content - Centered with max width on mobile, standard on desktop */}
      <div
        className={cn(
          'relative bg-white',
          'w-full md:h-auto', // Full width with padding, auto height
          'rounded-lg shadow-lg', // Rounded corners on all screens
          'md:mx-4', // Margin on desktop
          'max-h-[90vh]', // Max 90% viewport on all screens
          'overflow-y-auto',
          sizeClasses[size],
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header - Sticky on mobile for better UX */}
        <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
          <div className="flex items-center justify-between p-4 md:px-6 md:py-4">
            <h2
              id="modal-title"
              className="text-lg md:text-xl font-semibold text-gray-900"
            >
              {title}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] -mr-2" // Touch-friendly close button
              aria-label="Fechar modal"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 md:p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
