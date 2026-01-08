/**
 * DeleteAccountSection Component
 * Seção para exclusão de conta
 */

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Card, Input, Button, ConfirmModal, Textarea } from '@/components/ui';
import { profileService } from '@/api';
import { useAuth } from '@/contexts/AuthContext';

interface DeleteAccountSectionProps {
  hasPassword: boolean;
}

export function DeleteAccountSection({ hasPassword }: DeleteAccountSectionProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [password, setPassword] = useState('');
  const [reason, setReason] = useState('');
  const [confirmText, setConfirmText] = useState('');

  const deleteMutation = useMutation({
    mutationFn: profileService.deleteAccount,
    onSuccess: async () => {
      toast.success('Conta excluída com sucesso');
      await logout();
      navigate('/');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Erro ao excluir conta';
      toast.error(message);
    },
  });

  const handleDelete = () => {
    if (confirmText !== 'EXCLUIR') {
      toast.error('Digite EXCLUIR para confirmar');
      return;
    }

    deleteMutation.mutate({
      password: hasPassword ? password : undefined,
      reason: reason || undefined,
    });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setPassword('');
    setReason('');
    setConfirmText('');
  };

  return (
    <>
      <Card className="p-4 md:p-6 border-red-200 bg-red-50">
        <h2 className="text-lg font-semibold text-red-700 mb-2">Zona de Perigo</h2>
        <p className="text-sm text-gray-600 mb-4">
          Ao excluir sua conta, todos os seus dados pessoais serão anonimizados.
          Seus pedidos serão mantidos para fins de histórico, mas não estarão mais vinculados a você.
        </p>
        <Button variant="danger" onClick={() => setShowModal(true)}>
          Excluir Minha Conta
        </Button>
      </Card>

      <ConfirmModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onConfirm={handleDelete}
        title="Excluir Conta"
        message=""
        confirmText="Excluir Permanentemente"
        cancelText="Cancelar"
        variant="danger"
        isLoading={deleteMutation.isPending}
      >
        <div className="space-y-4 mt-4">
          <div className="p-3 bg-red-100 rounded-lg">
            <p className="text-sm text-red-700">
              <strong>Esta ação é irreversível.</strong> Sua conta será permanentemente excluída e seus dados pessoais serão anonimizados.
            </p>
          </div>

          <Textarea
            label="Motivo (opcional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Conte-nos por que você está saindo..."
            rows={3}
          />

          {hasPassword && (
            <Input
              type="password"
              label="Confirme sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          )}

          <Input
            label="Digite EXCLUIR para confirmar"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="EXCLUIR"
            required
          />
        </div>
      </ConfirmModal>
    </>
  );
}

export default DeleteAccountSection;
