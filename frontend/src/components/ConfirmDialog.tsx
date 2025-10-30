import { AlertCircle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'warning' | 'danger' | 'info';
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'warning'
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const variantStyles = {
    warning: {
      icon: 'text-orange-600',
      bg: 'bg-orange-50',
      border: 'border-orange-200'
    },
    danger: {
      icon: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200'
    },
    info: {
      icon: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200'
    }
  };

  const styles = variantStyles[variant];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <div className={`rounded-lg p-4 flex items-start gap-3 border ${styles.bg} ${styles.border}`}>
          <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${styles.icon}`} />
          <p className="text-sm text-gray-700">{message}</p>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            onClick={handleConfirm}
            variant={variant === 'danger' ? 'danger' : 'primary'}
            className="flex-1"
          >
            {confirmText}
          </Button>
          <Button
            onClick={onClose}
            variant="secondary"
            className="flex-1"
          >
            {cancelText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
