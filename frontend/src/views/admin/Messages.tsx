/**
 * Admin Messages Page
 * Página de moderação de mensagens (spam) no painel admin
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/api';
import type { AdminMessage } from '@/api/types';
import toast from 'react-hot-toast';

export function Messages() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [minSpamScore, setMinSpamScore] = useState(50);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'messages', page, minSpamScore],
    queryFn: () =>
      adminService.listMessages({
        page,
        limit: 20,
        minSpamScore,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteMessage(id),
    onSuccess: () => {
      toast.success('Mensagem deletada com sucesso');
      queryClient.invalidateQueries({ queryKey: ['admin', 'messages'] });
    },
    onError: () => {
      toast.error('Erro ao deletar mensagem');
    },
  });

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja deletar esta mensagem?')) {
      deleteMutation.mutate(id);
    }
  };

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
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Mensagens</h1>
        <p className="text-gray-600 mt-1">Moderar mensagens com suspeita de spam</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Score mínimo de spam
            </label>
            <select
              value={minSpamScore}
              onChange={(e) => setMinSpamScore(Number(e.target.value))}
              className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={0}>0 - Todas</option>
              <option value={30}>30 - Baixo</option>
              <option value={50}>50 - Médio</option>
              <option value={70}>70 - Alto</option>
              <option value={90}>90 - Muito alto</option>
            </select>
          </div>
        </div>
      </div>

      {/* Messages List */}
      <div className="space-y-4">
        {!data?.data.messages.length ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-gray-500">
            Nenhuma mensagem encontrada
          </div>
        ) : (
          data.data.messages.map((message: AdminMessage) => (
            <div
              key={message.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">
                          {message.author.name}
                        </span>
                        <span className="text-sm text-gray-500">
                          {message.author.email}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">
                        Campanha: {message.campaign.name}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          message.spamScore >= 70
                            ? 'bg-red-100 text-red-800'
                            : message.spamScore >= 50
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        Spam: {message.spamScore}
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-700 text-sm md:text-base break-words">
                    {message.message}
                  </p>

                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                    <span>
                      {new Date(message.createdAt).toLocaleString('pt-BR')}
                    </span>
                    {message.answer && (
                      <span className="text-green-600 font-medium">Respondida</span>
                    )}
                  </div>
                </div>

                <div className="flex md:flex-col gap-2">
                  <button
                    onClick={() => handleDelete(message.id)}
                    disabled={deleteMutation.isPending}
                    className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Deletar
                  </button>
                </div>
              </div>

              {message.answer && (
                <div className="mt-4 pl-4 border-l-2 border-green-500 bg-green-50 p-3 rounded">
                  <div className="text-xs font-medium text-green-800 mb-1">
                    Resposta:
                  </div>
                  <p className="text-sm text-gray-700">{message.answer}</p>
                </div>
              )}
            </div>
          ))
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

