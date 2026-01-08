/**
 * Admin Audit Page
 * Página de logs de auditoria no painel admin
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/api';

export function Audit() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const [targetType, setTargetType] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'audit', page, action, targetType],
    queryFn: () =>
      adminService.listAuditLogs({
        page,
        limit: 20,
        ...(action && { action: action as any }),
        ...(targetType && { targetType: targetType as any }),
      }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const getActionColor = (action: string) => {
    if (action.includes('DELETE') || action.includes('BAN')) {
      return 'bg-red-100 text-red-800';
    }
    if (action.includes('CREATE') || action.includes('REGISTER')) {
      return 'bg-green-100 text-green-800';
    }
    if (action.includes('EDIT') || action.includes('UPDATE')) {
      return 'bg-blue-100 text-blue-800';
    }
    if (action.includes('VIEW') || action.includes('LIST')) {
      return 'bg-gray-100 text-gray-800';
    }
    return 'bg-yellow-100 text-yellow-800';
  };

  const formatAction = (action: string) => {
    return action
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Auditoria</h1>
        <p className="text-gray-600 mt-1">Logs de todas as ações administrativas</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ação
            </label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todas</option>
              <option value="USER_VIEW">Visualizar Usuário</option>
              <option value="USER_EDIT">Editar Usuário</option>
              <option value="USER_DELETE">Deletar Usuário</option>
              <option value="USER_BAN">Banir Usuário</option>
              <option value="CAMPAIGN_VIEW">Visualizar Campanha</option>
              <option value="CAMPAIGN_EDIT">Editar Campanha</option>
              <option value="CAMPAIGN_DELETE">Deletar Campanha</option>
              <option value="MESSAGE_DELETE">Deletar Mensagem</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo
            </label>
            <select
              value={targetType}
              onChange={(e) => setTargetType(e.target.value)}
              className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos</option>
              <option value="USER">Usuário</option>
              <option value="CAMPAIGN">Campanha</option>
              <option value="MESSAGE">Mensagem</option>
              <option value="SYSTEM">Sistema</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Logs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {!data?.data.logs.length ? (
          <div className="p-8 text-center text-gray-500">
            Nenhum log encontrado
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Admin
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ação
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.data.logs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {log.admin.name}
                      </div>
                      <div className="text-xs text-gray-400">{log.admin.email}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(
                          log.action
                        )}`}
                      >
                        {formatAction(log.action)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {log.targetType}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-400 font-mono">
                      {log.ipAddress || '-'}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-400">
                      {new Date(log.createdAt).toLocaleString('pt-BR')}
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
