/**
 * Admin Campaigns Page
 * Página de gerenciamento de campanhas no painel admin
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/api';
import type { Campaign, ListCampaignsParams } from '@/api/types';

export function Campaigns() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ListCampaignsParams['status'] | ''>('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'campaigns', page, search, status],
    queryFn: () =>
      adminService.listCampaigns({
        page,
        limit: 20,
        ...(search && { search }),
        ...(status && { status }),
      }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Campanhas</h1>
        <p className="text-gray-600 mt-1">Gerenciar todas as campanhas da plataforma</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nome ou descrição"
              className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ListCampaignsParams['status'] | '')}
              className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos</option>
              <option value="ACTIVE">Ativa</option>
              <option value="CLOSED">Fechada</option>
              <option value="SENT">Enviada</option>
              <option value="ARCHIVED">Arquivada</option>
            </select>
          </div>
        </div>
      </div>

      {/* Campaign List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {!data?.data.campaigns.length ? (
          <div className="p-8 text-center text-gray-500">
            Nenhuma campanha encontrada
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campanha
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Criador
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produtos
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pedidos
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.data.campaigns.map((campaign: Campaign & { creator: { name: string; email: string } }) => (
                  <tr key={campaign.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {campaign.name}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-600">{campaign.creator.name}</div>
                      <div className="text-xs text-gray-400">{campaign.creator.email}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          campaign.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800'
                            : campaign.status === 'CLOSED'
                            ? 'bg-yellow-100 text-yellow-800'
                            : campaign.status === 'SENT'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
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
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {campaign._count?.products ?? 0}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {campaign._count?.orders ?? 0}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-400">
                      {new Date(campaign.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && data.data.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          <span className="px-4 py-2 text-sm text-gray-700">
            Página {page} de {data.data.totalPages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === data.data.totalPages}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}

