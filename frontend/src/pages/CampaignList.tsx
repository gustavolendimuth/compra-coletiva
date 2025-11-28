import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Package, Users, Calendar, Clock } from 'lucide-react';
import { campaignApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import Card from '@/components/Card';
import { SkeletonCard } from '@/components/Skeleton';

export default function CampaignList() {
  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: campaignApi.getAll
  });

  if (isLoading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Campanhas</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Campanhas</h1>

      {campaigns && campaigns.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma campanha criada
            </h3>
            <p className="text-gray-500">
              Use o botão "Nova Campanha" na barra superior para criar sua primeira campanha de compra coletiva
            </p>
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
    </div>
  );
}
