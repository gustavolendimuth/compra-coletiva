/**
 * ProfileForm Component
 * Formulário para edição de nome e telefone
 */

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Card, Input, PhoneInput, Button } from '@/components/ui';
import { profileService } from '@/api';
import type { StoredUser } from '@/api/types';
import { getApiErrorMessage } from '@/lib/apiError';

interface ProfileFormProps {
  user: StoredUser;
  onUpdate: (user: StoredUser) => void;
}

export function ProfileForm({ user, onUpdate }: ProfileFormProps) {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || '');
  const [hideNameInCampaigns, setHideNameInCampaigns] = useState(
    user.hideNameInCampaigns ?? false
  );
  const [isEditing, setIsEditing] = useState(false);

  const updateMutation = useMutation({
    mutationFn: profileService.update,
    onSuccess: (data) => {
      onUpdate(data.user as StoredUser);
      toast.success('Perfil atualizado!');
      setIsEditing(false);
    },
    onError: (error: unknown) => {
      const message = getApiErrorMessage(error, 'Erro ao atualizar');
      toast.error(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updates: { name?: string; phone?: string; hideNameInCampaigns?: boolean } = {};

    if (name !== user.name) {
      updates.name = name;
    }
    if (phone !== (user.phone || '')) {
      updates.phone = phone;
    }
    if (hideNameInCampaigns !== (user.hideNameInCampaigns ?? false)) {
      updates.hideNameInCampaigns = hideNameInCampaigns;
    }

    if (Object.keys(updates).length === 0) {
      setIsEditing(false);
      return;
    }

    updateMutation.mutate(updates);
  };

  const handleCancel = () => {
    setName(user.name);
    setPhone(user.phone || '');
    setHideNameInCampaigns(user.hideNameInCampaigns ?? false);
    setIsEditing(false);
  };

  return (
    <Card className="p-4 md:p-6">
      <h2 className="text-lg font-semibold text-sky-900 mb-4">Dados Pessoais</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nome completo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={!isEditing}
          required
        />

        <PhoneInput
          label="Telefone/WhatsApp"
          value={phone}
          onChange={setPhone}
          disabled={!isEditing}
        />

        <label className="flex items-start gap-2 text-sm text-sky-700">
          <input
            type="checkbox"
            checked={hideNameInCampaigns}
            onChange={(e) => setHideNameInCampaigns(e.target.checked)}
            disabled={!isEditing}
            className="mt-0.5 rounded border-sky-300 text-sky-600 focus:ring-sky-500"
          />
          <span>
            Mascarar meu nome nas campanhas com apelido divertido.
          </span>
        </label>

        <div className="flex justify-end gap-2 pt-2">
          {isEditing ? (
            <>
              <Button type="button" variant="secondary" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </>
          ) : (
            <Button type="button" onClick={() => setIsEditing(true)}>
              Editar
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}

export default ProfileForm;

