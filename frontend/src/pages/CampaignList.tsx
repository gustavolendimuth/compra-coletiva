import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Package, Users, Calendar } from 'lucide-react';
import { campaignApi } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Modal from '@/components/Modal';

export default function CampaignList() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shippingCost: 0
  });

  const queryClient = useQueryClient();

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: campaignApi.getAll
  });

  const createMutation = useMutation({
    mutationFn: campaignApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campanha criada com sucesso!');
      setIsModalOpen(false);
      setFormData({ name: '', description: '', shippingCost: 0 });
    },
    onError: () => {
      toast.error('Erro ao criar campanha');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Campanhas</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-5 h-5 mr-2" />
          Nova Campanha
        </Button>
      </div>

      {campaigns && campaigns.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma campanha criada
            </h3>
            <p className="text-gray-500 mb-4">
              Comece criando sua primeira campanha de compra coletiva
            </p>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-5 h-5 mr-2" />
              Criar Campanha
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns?.map((campaign) => (
            <Link key={campaign.id} to={`/campaigns/${campaign.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {campaign.name}
                  </h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    campaign.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-700'
                      : campaign.status === 'CLOSED'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {campaign.status === 'ACTIVE' ? 'Ativa' :
                     campaign.status === 'CLOSED' ? 'Fechada' : 'Arquivada'}
                  </span>
                </div>

                {campaign.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {campaign.description}
                  </p>
                )}

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    <span>{campaign._count?.products || 0} produtos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>{campaign._count?.orders || 0} pedidos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Criada em {formatDate(campaign.createdAt)}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="text-sm font-medium text-gray-900">
                    Frete: {formatCurrency(campaign.shippingCost)}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valor do Frete Total
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.shippingCost}
              onChange={(e) => setFormData({ ...formData, shippingCost: parseFloat(e.target.value) || 0 })}
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
    </div>
  );
}
