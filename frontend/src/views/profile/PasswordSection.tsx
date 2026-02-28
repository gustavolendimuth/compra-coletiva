/**
 * PasswordSection Component
 * Formulário para alteração de senha
 */

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Card, Input, Button } from '@/components/ui';
import { profileService } from '@/api';
import { getApiErrorMessage } from '@/lib/apiError';

interface PasswordSectionProps {
  hasPassword: boolean;
}

export function PasswordSection({ hasPassword }: PasswordSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const updateMutation = useMutation({
    mutationFn: profileService.update,
    onSuccess: () => {
      toast.success('Senha alterada com sucesso!');
      handleCancel();
    },
    onError: (error: unknown) => {
      const message = getApiErrorMessage(error, 'Erro ao alterar senha');
      toast.error(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    updateMutation.mutate({
      currentPassword,
      newPassword,
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  if (!hasPassword) {
    return (
      <Card className="p-4 md:p-6">
        <h2 className="text-lg font-semibold text-sky-900 mb-2">Senha</h2>
        <p className="text-sm text-sky-600">
          Sua conta foi criada via Google. Você não possui uma senha local.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4 md:p-6">
      <h2 className="text-lg font-semibold text-sky-900 mb-4">Alterar Senha</h2>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            label="Senha atual"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />

          <Input
            type="password"
            label="Nova senha"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            helperText="Mínimo 6 caracteres"
            required
          />

          <Input
            type="password"
            label="Confirmar nova senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={confirmPassword && newPassword !== confirmPassword ? 'As senhas não coincidem' : undefined}
            required
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Alterando...' : 'Alterar Senha'}
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex justify-between items-center">
          <p className="text-sm text-sky-600">••••••••</p>
          <Button variant="secondary" onClick={() => setIsEditing(true)}>
            Alterar
          </Button>
        </div>
      )}
    </Card>
  );
}

export default PasswordSection;

