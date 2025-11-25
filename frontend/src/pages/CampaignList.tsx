import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Package, Users, Calendar, Clock } from 'lucide-react';
import { campaignApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Modal from '@/components/Modal';
import DateTimeInput from '@/components/DateTimeInput';
import { SkeletonCard } from '@/components/Skeleton';

export default function CampaignList() {
  const { user, requireAuth } = useAuth();
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

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Campanhas</h1>
          <Button disabled>Nova Campanha</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Check if user can create campaigns
  const canCreateCampaign = user && (user.role === 'ADMIN' || user.role === 'CAMPAIGN_CREATOR');

  const handleNewCampaignClick = () => {
    requireAuth(() => {
      if (!canCreateCampaign) {
        toast.error('Apenas criadores de campanha e administradores podem criar campanhas');
        return;
      }
      setIsModalOpen(true);
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Campanhas</h1>
        <Button onClick={handleNewCampaignClick}>
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
            <Button onClick={handleNewCampaignClick}>
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
                  <span className={`px-2 py-1 text-xs rounded-full ${campaign.status === 'ACTIVE'
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
                  {campaign.deadline && (
                    <div className={`flex items-center gap-2 font-medium ${
                      new Date(campaign.deadline) < new Date()
                        ? 'text-red-600'
                        : new Date(campaign.deadline).getTime() - new Date().getTime() < 24 * 60 * 60 * 1000
                          ? 'text-yellow-600'
                          : 'text-blue-600'
                    }`}>
                      <Clock className="w-4 h-4" />
                      <span>
                        Limite: {new Date(campaign.deadline).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })} às {new Date(campaign.deadline).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false
                        })}
                      </span>
                    </div>
                  )}
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
    </div>
  );
}
