'use client';

/**
 * RecentActivity Component
 * Feed de atividades recentes
 */

import Link from 'next/link';
import { Card } from '@/components/ui';

interface RecentUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface RecentCampaign {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  creator: {
    id: string;
    name: string;
    email: string;
  };
}

interface RecentOrder {
  id: string;
  total: number;
  isPaid: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  campaign: {
    id: string;
    name: string;
  };
}

interface RecentActivityProps {
  recentUsers: RecentUser[];
  recentCampaigns: RecentCampaign[];
  recentOrders: RecentOrder[];
}

export function RecentActivity({ recentUsers, recentCampaigns, recentOrders }: RecentActivityProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const statusColors = {
    ACTIVE: 'bg-green-100 text-green-800',
    CLOSED: 'bg-gray-100 text-gray-800',
    SENT: 'bg-blue-100 text-blue-800',
    ARCHIVED: 'bg-red-100 text-red-800',
  };

  const roleLabels = {
    ADMIN: 'Admin',
    CAMPAIGN_CREATOR: 'Criador',
    CUSTOMER: 'Cliente',
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Usuários Recentes */}
      <Card className="p-4 md:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Usuários Recentes</h3>
        <div className="space-y-3">
          {recentUsers.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum usuário recente</p>
          ) : (
            recentUsers.map((user) => (
              <Link
                key={user.id}
                href={`/admin/usuarios/${user.id}`}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-medium text-blue-600">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400">{roleLabels[user.role as keyof typeof roleLabels]}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-400">{formatDate(user.createdAt)}</span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </Card>

      {/* Campanhas Recentes */}
      <Card className="p-4 md:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Campanhas Recentes</h3>
        <div className="space-y-3">
          {recentCampaigns.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhuma campanha recente</p>
          ) : (
            recentCampaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="p-3 rounded-lg border border-gray-100"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm font-medium text-gray-900 flex-1">{campaign.name}</p>
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[campaign.status as keyof typeof statusColors]
                      }`}
                  >
                    {campaign.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Criado por <span className="font-medium">{campaign.creator.name}</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">{formatDate(campaign.createdAt)}</p>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Pedidos Recentes */}
      <Card className="p-4 md:p-6 lg:col-span-2">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pedidos Recentes</h3>
        <div className="space-y-3">
          {recentOrders.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum pedido recente</p>
          ) : (
            recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-gray-100"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-medium text-gray-900 flex-1 truncate">
                      {order.campaign.name}
                    </p>
                    <span className="text-sm font-bold text-gray-900 flex-shrink-0">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(order.total)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Pedido de <span className="font-medium">{order.user.name}</span>
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-full ${order.isPaid
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                        }`}
                    >
                      {order.isPaid ? 'Pago' : 'Pendente'}
                    </span>
                    <span className="text-xs text-gray-400">{formatDate(order.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
