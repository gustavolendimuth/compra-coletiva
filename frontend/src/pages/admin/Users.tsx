/**
 * Users Page
 * Página de gestão de usuários
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adminService, type AdminUser } from '@/api';
import { Card, Button, Input } from '@/components/ui';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

export function Users() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [banModalOpen, setBanModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', page, search],
    queryFn: () =>
      adminService.listUsers({
        page,
        limit: 20,
        search: search || undefined,
      }),
  });

  const banMutation = useMutation({
    mutationFn: (userId: string) => adminService.banUser(userId),
    onSuccess: () => {
      toast.success('Usuário banido com sucesso');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setBanModalOpen(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erro ao banir usuário');
    },
  });

  const unbanMutation = useMutation({
    mutationFn: (userId: string) => adminService.unbanUser(userId),
    onSuccess: () => {
      toast.success('Usuário desbanido com sucesso');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erro ao desbanir usuário');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => adminService.deleteUser(userId),
    onSuccess: () => {
      toast.success('Usuário deletado com sucesso');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setDeleteModalOpen(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erro ao deletar usuário');
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const roleLabels = {
    ADMIN: 'Admin',
    CAMPAIGN_CREATOR: 'Criador',
    CUSTOMER: 'Cliente',
  };

  const roleBadgeColors = {
    ADMIN: 'bg-red-100 text-red-800',
    CAMPAIGN_CREATOR: 'bg-blue-100 text-blue-800',
    CUSTOMER: 'bg-gray-100 text-gray-800',
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Usuários</h1>
          <p className="text-gray-600 mt-1">
            {data?.data.total} usuários cadastrados
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            type="text"
            placeholder="Buscar usuários..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-64"
          />
          <Button type="submit">Buscar</Button>
        </form>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Usuário
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Campanhas
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Pedidos
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data?.data.users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        roleBadgeColors[user.role]
                      }`}
                    >
                      {roleLabels[user.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {user.isBanned ? (
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                        Banido
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        Ativo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {user._count.campaigns}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {user._count.orders}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => navigate(`/admin/users/${user.id}`)}
                      >
                        Ver
                      </Button>
                      {user.isBanned ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => unbanMutation.mutate(user.id)}
                          disabled={unbanMutation.isPending}
                        >
                          Desbanir
                        </Button>
                      ) : user.role !== 'ADMIN' ? (
                        <>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setSelectedUser(user);
                              setBanModalOpen(true);
                            }}
                          >
                            Banir
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => {
                              setSelectedUser(user);
                              setDeleteModalOpen(true);
                            }}
                          >
                            Deletar
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {data && data.data.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Página {data.data.page} de {data.data.totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Anterior
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= data.data.totalPages}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Ban Modal */}
      <ConfirmModal
        isOpen={banModalOpen}
        onClose={() => {
          setBanModalOpen(false);
          setSelectedUser(null);
        }}
        onConfirm={() => {
          if (selectedUser) {
            banMutation.mutate(selectedUser.id);
          }
        }}
        title="Banir Usuário"
        message={`Tem certeza que deseja banir ${selectedUser?.name}? O usuário não poderá mais acessar a plataforma.`}
        confirmText="Banir"
        cancelText="Cancelar"
        variant="danger"
        isLoading={banMutation.isPending}
      />

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedUser(null);
        }}
        onConfirm={() => {
          if (selectedUser) {
            deleteMutation.mutate(selectedUser.id);
          }
        }}
        title="Deletar Usuário"
        message={`Tem certeza que deseja deletar ${selectedUser?.name}? Esta ação não pode ser desfeita. Os dados do usuário serão anonimizados.`}
        confirmText="Deletar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

export default Users;
