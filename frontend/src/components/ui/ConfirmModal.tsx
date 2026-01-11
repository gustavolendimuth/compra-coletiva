import { ReactNode } from 'react';
import Button from './Button';
import Modal from './Modal';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
  isLoading?: boolean;
  children?: ReactNode;
}

/**
 * ConfirmModal Component - Reusable confirmation dialog
 *
 * Mobile-first confirmation modal that replaces native browser confirm().
 * Follows design system colors and patterns.
 */
export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  isLoading = false,
  children,
}: ConfirmModalProps) => {
  const handleConfirm = () => {
    onConfirm();
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        {/* Message */}
        {message && (
          <div className="text-gray-700 text-base">
            {typeof message === 'string' ? <p>{message}</p> : message}
          </div>
        )}

        {/* Children content (optional) */}
        {children}

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end">
          <Button
            variant="secondary"
            onClick={onClose}
            className="w-full sm:w-auto min-h-[44px]"
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant}
            onClick={handleConfirm}
            className="w-full sm:w-auto min-h-[44px]"
            disabled={isLoading}
          >
            {isLoading ? 'Processando...' : confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
