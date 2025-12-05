import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { campaignApi } from '@/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Modal } from '@/components/ui';
import DateTimeInput from '@/components/DateTimeInput';

interface NewCampaignButtonProps {
  onModalOpen?: () => void; // Callback when modal is opened
}

export const NewCampaignButton: React.FC<NewCampaignButtonProps> = ({ onModalOpen }) => {
  const { requireAuth, refreshUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    deadline: string;
    shippingCost: number | '';
  }>({
    name: '',
    description: '',
    deadline: '',
    shippingCost: ''
  });

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: campaignApi.create,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      await refreshUser(); // Refresh user to get updated role
      toast.success('Campanha criada com sucesso!');
      setIsModalOpen(false);
      setFormData({ name: '', description: '', deadline: '', shippingCost: '' });
    },
    onError: () => {
      toast.error('Erro ao criar campanha');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const shippingCost = typeof formData.shippingCost === 'number' ? formData.shippingCost : 0;

    createMutation.mutate({
      name: formData.name,
      description: formData.description,
      deadline: formData.deadline,
      shippingCost
    });
  };

  const handleNewCampaignClick = () => {
    requireAuth(() => {
      setIsModalOpen(true);
      onModalOpen?.(); // Call callback if provided
    });
  };

  return (
    <>
      <Button
        onClick={handleNewCampaignClick}
        className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 text-sm md:text-base"
      >
        <Plus className="w-4 h-4 md:w-5 md:h-5" />
        <span className="hidden md:inline">Nova Campanha</span>
        <span className="md:hidden">Nova</span>
      </Button>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nova Campanha"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome da Campanha *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Ex: Café CEBB - Outubro 2025"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={3}
              placeholder="Descrição opcional da campanha"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Limite (opcional)
            </label>
            <DateTimeInput
              value={formData.deadline}
              onChange={(value) => setFormData({ ...formData, deadline: value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-2">
              A campanha será fechada automaticamente quando atingir esta data. Formato: dd/mm/aaaa HH:mm (24h)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valor do Frete Total
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.shippingCost}
              onChange={(e) => setFormData({ ...formData, shippingCost: e.target.value === '' ? '' : parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="0.00"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={createMutation.isPending} className="flex-1">
              {createMutation.isPending ? 'Criando...' : 'Criar Campanha'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};
