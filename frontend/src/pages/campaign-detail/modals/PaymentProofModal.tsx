import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { ImageUpload } from '@/components/ui/ImageUpload';
import Button from '@/components/ui/Button';
import { Order } from '@/api/types';
import { getImageUrlOrUndefined } from '@/lib/imageUrl';

interface PaymentProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onSubmit: (file: File) => void;
  isPending: boolean;
}

/**
 * PaymentProofModal Component
 *
 * Modal for uploading PIX payment proof when marking order as paid.
 * Mobile-first design with image upload component.
 *
 * @example
 * <PaymentProofModal
 *   isOpen={isOpen}
 *   onClose={onClose}
 *   order={selectedOrder}
 *   onSubmit={handleUpload}
 *   isPending={mutation.isPending}
 * />
 */
export function PaymentProofModal({
  isOpen,
  onClose,
  order,
  onSubmit,
  isPending,
}: PaymentProofModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleImageSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleImageRemove = () => {
    setSelectedFile(null);
  };

  const handleSubmit = () => {
    if (!selectedFile) {
      return;
    }
    onSubmit(selectedFile);
  };

  const handleClose = () => {
    setSelectedFile(null);
    onClose();
  };

  const currentProofUrl = order?.paymentProofUrl
    ? getImageUrlOrUndefined(order.paymentProofUrl)
    : undefined;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Comprovante de Pagamento PIX"
      size="md"
    >
      <div className="space-y-4 p-4 md:p-6">
        {/* Order Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Cliente:</strong> {order?.customer.name || order?.customerName}
          </p>
          <p className="text-sm text-blue-800 mt-1">
            <strong>Total:</strong> R$ {order?.total.toFixed(2)}
          </p>
        </div>

        {/* Upload Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Comprovante PIX *
          </label>
          <ImageUpload
            currentImageUrl={!selectedFile ? currentProofUrl : undefined}
            onImageSelect={handleImageSelect}
            onImageRemove={handleImageRemove}
            maxSizeMB={5}
            disabled={isPending}
          />
        </div>

        {/* Instructions */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Formatos aceitos: JPEG, PNG, WebP</p>
          <p>• Tamanho máximo: 5MB</p>
          <p>• Faça upload da captura de tela do comprovante PIX</p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            onClick={handleSubmit}
            disabled={!selectedFile || isPending}
            className="flex-1 w-full sm:w-auto"
          >
            {isPending ? 'Enviando...' : 'Marcar como Pago'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isPending}
            className="flex-1 w-full sm:w-auto"
          >
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
