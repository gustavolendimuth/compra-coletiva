'use client';

/**
 * UserDetail Page
 * Página de detalhes do usuário no painel admin
 */

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/api';
import { Card, Button } from '@/components/ui';
import { Avatar } from '@/components/ui/Avatar';

interface UserDetailProps {
  userId?: string;
}

export function UserDetail({ userId: propUserId }: UserDetailProps) {
  const params = useParams();
  const router = useRouter();
  const id = propUserId || (params?.id as string);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'user', id],
    queryFn: () => adminService.getUser(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <p className="text-gray-600">Usuário não encontrado</p>
          <Button onClick={() => router.push('/admin/usuarios')} className="mt-4">
            Voltar para Usuários
          </Button>
        </div>
      </div>
    );
  }

  const user = data.data;

  const roleLabels = {
    ADMIN: 'Administrador',
    CAMPAIGN_CREATOR: 'Criador',
    CUSTOMER: 'Cliente',
  };

  const roleBadgeColors = {
    ADMIN: 'bg-red-100 text-red-800',
    CAMPAIGN_CREATOR: 'bg-blue-100 text-blue-800',
    CUSTOMER: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => router.push('/admin/usuarios')}>
          ← Voltar
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Detalhes do Usuário</h1>
      </div>

      {/* User Info */}
      <Card className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex justify-center md:justify-start">
            <Avatar
              src={user.avatarUrl}
              name={user.name}
              size="2xl"
              className="ring-4 ring-white shadow-lg"
            />
          </div>

          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">{user.name}</h2>
                <p className="text-gray-600">{user.email}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span
                  className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                    roleBadgeColors[user.role]
                  }`}
                >
                  {roleLabels[user.role]}
                </span>
                {user.isBanned ? (
                  <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-800">
                    Banido
                  </span>
                ) : (
                  <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800">
                    Ativo
                  </span>
                )}
                {user.isLegacyUser && (
                  <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-yellow-100 text-yellow-800">
                    Legado
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Cadastrado em</p>
                <p className="font-medium text-gray-900">
                  {new Date(user.createdAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Mensagens enviadas</p>
                <p className="font-medium text-gray-900">{user.messageCount}</p>
              </div>
              <div>
                <p className="text-gray-500">Mensagens respondidas</p>
                <p className="font-medium text-gray-900">{user.answeredCount}</p>
              </div>
              <div>
                <p className="text-gray-500">Score de spam</p>
                <p className={`font-medium ${user.spamScore > 50 ? 'text-red-600' : 'text-green-600'}`}>
                  {user.spamScore}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 md:p-6">
          <p className="text-sm text-gray-500 mb-1">Campanhas Criadas</p>
          <p className="text-2xl md:text-3xl font-bold text-gray-900">{user._count.campaigns}</p>
        </Card>
        <Card className="p-4 md:p-6">
          <p className="text-sm text-gray-500 mb-1">Pedidos Realizados</p>
          <p className="text-2xl md:text-3xl font-bold text-gray-900">{user._count.orders}</p>
        </Card>
        <Card className="p-4 md:p-6">
          <p className="text-sm text-gray-500 mb-1">Mensagens Totais</p>
          <p className="text-2xl md:text-3xl font-bold text-gray-900">{user._count.sentCampaignMessages}</p>
        </Card>
      </div>

      {/* Campanhas */}
      {user.campaigns && user.campaigns.length > 0 && (
        <Card className="p-4 md:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Campanhas Criadas</h3>
          <div className="space-y-3">
            {user.campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{campaign.name}</p>
                  <p className="text-xs text-gray-500">
                    Criado em {new Date(campaign.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    campaign.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-800'
                      : campaign.status === 'CLOSED'
                      ? 'bg-gray-100 text-gray-800'
                      : campaign.status === 'SENT'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {campaign.status === 'ACTIVE'
                    ? 'Ativa'
                    : campaign.status === 'CLOSED'
                    ? 'Fechada'
                    : campaign.status === 'SENT'
                    ? 'Enviada'
                    : 'Arquivada'}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Pedidos */}
      {user.orders && user.orders.length > 0 && (
        <Card className="p-4 md:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pedidos Realizados</h3>
          <div className="space-y-3">
            {user.orders.map((order) => (
              <div
                key={order.id}
                className="flex flex-col md:flex-row md:items-center md:justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 gap-2"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{order.campaign.name}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(order.total)}
                  </span>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      order.isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {order.isPaid ? 'Pago' : 'Pendente'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

export default UserDetail;
