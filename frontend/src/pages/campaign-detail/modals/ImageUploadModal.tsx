import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Modal, ImageUpload, Button, ConfirmModal } from '@/components/ui';
import { campaignService } from '@/api';
import { getImageUrlOrUndefined } from '@/lib/imageUrl';

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignSlug: string;
  currentImageUrl?: string;
}

export function ImageUploadModal({
  isOpen,
  onClose,
  campaignSlug,
  currentImageUrl,
}: ImageUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const queryClient = useQueryClient();

  const fullImageUrl = getImageUrlOrUndefined(currentImageUrl);

  const uploadMutation = useMutation({
    mutationFn: (file: File) => campaignService.uploadImage(campaignSlug, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', campaignSlug] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Imagem enviada com sucesso!');
      handleClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao enviar imagem');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => campaignService.deleteImage(campaignSlug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', campaignSlug] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Imagem removida com sucesso!');
      handleClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao remover imagem');
    },
  });

  const handleImageSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleImageRemove = () => {
    setSelectedFile(null);
  };

  const handleDeleteCurrentImage = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    deleteMutation.mutate();
    setShowDeleteConfirm(false);
  };

  const handleUpload = () => {
    if (!selectedFile) {
      toast.error('Selecione uma imagem');
      return;
    }
    uploadMutation.mutate(selectedFile);
  };

  const handleClose = () => {
    setSelectedFile(null);
    onClose();
  };

  const isLoading = uploadMutation.isPending || deleteMutation.isPending;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Imagem da Campanha">
      <div className="space-y-6">
        <ImageUpload
          currentImageUrl={!selectedFile ? fullImageUrl : undefined}
          onImageSelect={handleImageSelect}
          onImageRemove={handleImageRemove}
          disabled={isLoading}
        />

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isLoading}
            className="flex-1"
          >
            {isLoading && uploadMutation.isPending ? 'Enviando...' : selectedFile ? 'Enviar Imagem' : 'Selecione uma imagem'}
          </Button>

          {fullImageUrl && !selectedFile && (
            <Button
              onClick={handleDeleteCurrentImage}
              variant="danger"
              disabled={isLoading}
              className="flex-1 sm:flex-none"
            >
              {isLoading && deleteMutation.isPending ? 'Removendo...' : 'Remover Imagem'}
            </Button>
          )}

          <Button
            onClick={handleClose}
            variant="secondary"
            disabled={isLoading}
            className="flex-1 sm:flex-none"
          >
            Cancelar
          </Button>
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p>• Formatos aceitos: JPEG, PNG, WebP</p>
          <p>• Tamanho máximo: 5MB</p>
          <p>• Recomendado: proporção 16:9 ou 2:1</p>
        </div>
      </div>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Remover Imagem"
        message={
          <>
            <p>Tem certeza que deseja remover a imagem atual da campanha?</p>
            <p className="mt-2 text-sm text-gray-600">Esta ação não pode ser desfeita.</p>
          </>
        }
        confirmText="Remover"
        cancelText="Cancelar"
        variant="danger"
      />
    </Modal>
  );
}



