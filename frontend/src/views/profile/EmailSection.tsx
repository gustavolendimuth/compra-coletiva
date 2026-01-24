/**
 * EmailSection Component
 * Formulário para alteração de email
 */

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Card, Input, Button } from '@/components/ui';
import { profileService } from '@/api';

interface EmailSectionProps {
  currentEmail: string;
  hasPassword: boolean;
}

export function EmailSection({ currentEmail, hasPassword }: EmailSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);

  const changeMutation = useMutation({
    mutationFn: profileService.requestEmailChange,
    onSuccess: () => {
      setVerificationSent(true);
      toast.success('Email de verificação enviado!');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Erro ao solicitar troca';
      toast.error(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (newEmail === currentEmail) {
      toast.error('O novo email é igual ao atual');
      return;
    }

    changeMutation.mutate({ newEmail, password });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setNewEmail('');
    setPassword('');
    setVerificationSent(false);
  };

  return (
    <Card className="p-4 md:p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Email</h2>

      {verificationSent ? (
        <div className="text-center py-4">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-700 mb-2">
            Enviamos um email de verificação para <strong>{newEmail}</strong>
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Clique no link no email para confirmar a alteração. O link expira em 24 horas.
          </p>
          <Button variant="secondary" onClick={handleCancel}>
            Fechar
          </Button>
        </div>
      ) : isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            label="Novo email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="seu.novo@email.com"
            required
          />

          {hasPassword && (
            <Input
              type="password"
              label="Senha atual (para confirmar)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          )}

          <p className="text-sm text-gray-500">
            Um email de verificação será enviado para o novo endereço.
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={changeMutation.isPending}>
              {changeMutation.isPending ? 'Enviando...' : 'Enviar Verificação'}
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-700">{currentEmail}</p>
          <Button variant="secondary" onClick={() => setIsEditing(true)}>
            Alterar
          </Button>
        </div>
      )}
    </Card>
  );
}

export default EmailSection;
