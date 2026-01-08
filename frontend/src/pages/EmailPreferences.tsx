/**
 * Email Preferences Page
 * Allows users to manage their email notification preferences
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { emailPreferenceService } from '../api';
import type { UpdateEmailPreferenceDto } from '../api';
import toast from 'react-hot-toast';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export function EmailPreferences() {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  // Fetch preferences
  const { data: preferences, isLoading } = useQuery({
    queryKey: ['email-preferences'],
    queryFn: emailPreferenceService.get,
  });

  // Local state for form
  const [formData, setFormData] = useState<UpdateEmailPreferenceDto>({});

  // Sync form with fetched data
  useState(() => {
    if (preferences) {
      setFormData({
        emailEnabled: preferences.emailEnabled,
        campaignReadyToSend: preferences.campaignReadyToSend,
        campaignStatusChanged: preferences.campaignStatusChanged,
        campaignArchived: preferences.campaignArchived,
        newMessage: preferences.newMessage,
        digestEnabled: preferences.digestEnabled,
        digestFrequency: preferences.digestFrequency,
      });
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: emailPreferenceService.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-preferences'] });
      toast.success('Preferências atualizadas com sucesso!');
      setIsSaving(false);
    },
    onError: () => {
      toast.error('Erro ao atualizar preferências');
      setIsSaving(false);
    },
  });

  // Resubscribe mutation
  const resubscribeMutation = useMutation({
    mutationFn: emailPreferenceService.resubscribe,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['email-preferences'] });
      toast.success(data.message);
      setFormData({
        emailEnabled: data.preferences.emailEnabled,
        campaignReadyToSend: data.preferences.campaignReadyToSend,
        campaignStatusChanged: data.preferences.campaignStatusChanged,
        campaignArchived: data.preferences.campaignArchived,
        newMessage: data.preferences.newMessage,
        digestEnabled: data.preferences.digestEnabled,
        digestFrequency: data.preferences.digestFrequency,
      });
    },
    onError: () => {
      toast.error('Erro ao reativar emails');
    },
  });

  const handleToggle = (field: keyof UpdateEmailPreferenceDto) => {
    setFormData((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleFrequencyChange = (frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY') => {
    setFormData((prev) => ({
      ...prev,
      digestFrequency: frequency,
    }));
  };

  const handleSave = () => {
    setIsSaving(true);
    updateMutation.mutate(formData);
  };

  const handleResubscribe = () => {
    resubscribeMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center py-8">Carregando...</div>
        </div>
      </div>
    );
  }

  const isEmailDisabled = formData.emailEnabled === false;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Preferências de Email
          </h1>
          <p className="mt-2 text-sm md:text-base text-gray-600">
            Gerencie como e quando você recebe notificações por email
          </p>
        </div>

        {/* Global Email Toggle */}
        <Card className="p-4 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">
                Receber Emails
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                {isEmailDisabled
                  ? 'Você não receberá nenhum email de notificação'
                  : 'Receba notificações importantes por email'}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.emailEnabled ?? true}
                onChange={() => handleToggle('emailEnabled')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {isEmailDisabled && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Você desativou todos os emails.{' '}
                <button
                  onClick={handleResubscribe}
                  disabled={resubscribeMutation.isPending}
                  className="font-medium text-blue-600 hover:text-blue-700 underline"
                >
                  Reativar emails
                </button>
              </p>
            </div>
          )}
        </Card>

        {/* Notification Types */}
        <Card className="p-4 md:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Tipos de Notificação
          </h2>

          <div className="space-y-4">
            {/* Campaign Ready to Send */}
            <NotificationToggle
              label="Grupo pronto para enviar"
              description="Quando todos os pedidos de um grupo foram pagos"
              checked={formData.campaignReadyToSend ?? true}
              disabled={isEmailDisabled}
              onChange={() => handleToggle('campaignReadyToSend')}
            />

            {/* Campaign Status Changed */}
            <NotificationToggle
              label="Status do grupo alterado"
              description="Quando o status de um grupo que você participa muda"
              checked={formData.campaignStatusChanged ?? true}
              disabled={isEmailDisabled}
              onChange={() => handleToggle('campaignStatusChanged')}
            />

            {/* Campaign Archived */}
            <NotificationToggle
              label="Grupo arquivado"
              description="Quando um grupo é arquivado"
              checked={formData.campaignArchived ?? true}
              disabled={isEmailDisabled}
              onChange={() => handleToggle('campaignArchived')}
            />

            {/* New Message */}
            <NotificationToggle
              label="Novas mensagens"
              description="Quando você recebe mensagens no chat ou perguntas públicas são respondidas"
              checked={formData.newMessage ?? true}
              disabled={isEmailDisabled}
              onChange={() => handleToggle('newMessage')}
            />
          </div>
        </Card>

        {/* Digest Settings */}
        <Card className="p-4 md:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Resumo Periódico
          </h2>

          <NotificationToggle
            label="Receber resumo de atividades"
            description="Receba um resumo consolidado das suas atividades"
            checked={formData.digestEnabled ?? false}
            disabled={isEmailDisabled}
            onChange={() => handleToggle('digestEnabled')}
          />

          {formData.digestEnabled && (
            <div className="mt-4 pl-4 md:pl-6 space-y-2">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Frequência do resumo:
              </p>
              <div className="space-y-2">
                <FrequencyOption
                  label="Diário"
                  value="DAILY"
                  selected={formData.digestFrequency === 'DAILY'}
                  onChange={() => handleFrequencyChange('DAILY')}
                />
                <FrequencyOption
                  label="Semanal"
                  value="WEEKLY"
                  selected={formData.digestFrequency === 'WEEKLY'}
                  onChange={() => handleFrequencyChange('WEEKLY')}
                />
                <FrequencyOption
                  label="Mensal"
                  value="MONTHLY"
                  selected={formData.digestFrequency === 'MONTHLY'}
                  onChange={() => handleFrequencyChange('MONTHLY')}
                />
              </div>
            </div>
          )}
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <Button
            onClick={handleSave}
            disabled={isSaving || updateMutation.isPending}
            className="w-full md:w-auto"
          >
            {isSaving ? 'Salvando...' : 'Salvar Preferências'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Helper Components
interface NotificationToggleProps {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
}

function NotificationToggle({
  label,
  description,
  checked,
  disabled,
  onChange,
}: NotificationToggleProps) {
  return (
    <div
      className={`flex items-start justify-between gap-4 py-3 ${
        disabled ? 'opacity-50' : ''
      }`}
    >
      <div className="flex-1">
        <p className="text-sm md:text-base font-medium text-gray-900">{label}</p>
        <p className="text-xs md:text-sm text-gray-600 mt-0.5">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 disabled:cursor-not-allowed"></div>
      </label>
    </div>
  );
}

interface FrequencyOptionProps {
  label: string;
  value: string;
  selected: boolean;
  onChange: () => void;
}

function FrequencyOption({ label, value, selected, onChange }: FrequencyOptionProps) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="radio"
        value={value}
        checked={selected}
        onChange={onChange}
        className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}
