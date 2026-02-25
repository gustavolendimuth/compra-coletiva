import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Portal } from './Portal';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  className
}: ModalProps) => {
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
    <Portal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-sky-950/40 backdrop-blur-sm animate-fade-in"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal container — overflow-hidden keeps scrollbar inside rounded corners */}
        <div
          className={cn(
            'relative flex flex-col',
            'w-full max-h-[90vh]',
            'bg-white rounded-3xl',
            'shadow-2xl shadow-sky-300/20',
            'overflow-hidden',
            'animate-fade-in',
            sizeClasses[size],
            className
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button — always floats top-right, layout-independent */}
          <button
            onClick={onClose}
            aria-label="Fechar modal"
            className="absolute top-3.5 right-3.5 z-20 w-8 h-8 flex items-center justify-center rounded-xl text-sky-400 hover:text-sky-700 hover:bg-sky-50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Title header — only when a non-empty title is passed */}
          {title && (
            <div className="flex-shrink-0 px-5 py-4 pr-12 md:px-6 md:py-5 border-b border-sky-100">
              <h2
                id="modal-title"
                className="text-lg md:text-xl font-display font-bold text-sky-900"
              >
                {title}
              </h2>
            </div>
          )}

          {/* Scrollable body — scrollbar confined inside rounded-3xl */}
          <div className="flex-1 overflow-y-auto p-5 md:p-6 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-sky-200 [&::-webkit-scrollbar-thumb:hover]:bg-sky-300">
            {children}
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default Modal;
