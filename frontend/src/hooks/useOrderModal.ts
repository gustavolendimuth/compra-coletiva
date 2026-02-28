import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { orderApi, Order, Product } from '@/api';
import type { OrderForm } from '@/api/types';
import { useOrderAutosave } from './useOrderAutosave';
import { getApiErrorMessage } from '@/lib/apiError';

interface UseOrderModalOptions {
  orders: Order[] | undefined;
  campaignId: string | undefined;
  user: { id: string; name: string; role?: "ADMIN" | "CAMPAIGN_CREATOR" | "CUSTOMER" } | null;
  canCreateOrdersForOthers?: boolean;
  isActive: boolean;
  requireAuth: (callback: () => void) => void;
  products: Product[];
}

export function useOrderModal({
  orders,
  campaignId,
  user,
  canCreateOrdersForOthers = false,
  isActive,
  requireAuth,
}: UseOrderModalOptions) {
  const queryClient = useQueryClient();

  // Modal states
  const [isEditOrderModalOpen, setIsEditOrderModalOpen] = useState(false);
  const [isViewOrderModalOpen, setIsViewOrderModalOpen] = useState(false);
  const [isPaymentProofModalOpen, setIsPaymentProofModalOpen] = useState(false);
  const [isAdminCustomerModalOpen, setIsAdminCustomerModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [orderForPayment, setOrderForPayment] = useState<Order | null>(null);
  const [adminCustomerForm, setAdminCustomerForm] = useState({
    mode: 'self' as 'self' | 'customer',
    name: '',
    email: '',
    phone: '',
  });
  const [editOrderForm, setEditOrderForm] = useState<OrderForm>({
    campaignId: '',
    items: [],
  });

  // Autosave
  const autosave = useOrderAutosave({
    orderId: editingOrder?.id ?? null,
    items: editOrderForm.items,
    isEnabled: isEditOrderModalOpen && !!editingOrder,
    onSave: (orderId, validItems) => {
      updateOrderWithItemsMutation.mutate({
        orderId,
        data: { items: validItems },
        isAutosave: true,
      });
    },
  }) as ReturnType<typeof useOrderAutosave> & { _markSaved: () => void; _markError: () => void };

  // Mutations
  const createOrderMutation = useMutation({
    mutationFn: orderApi.create,
    onSuccess: (data) => {
      console.log('[createOrderMutation] onSuccess global - pedido criado:', data?.id);
      queryClient.invalidateQueries({ queryKey: ['orders', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['analytics', campaignId] });
    },
    onError: (err) => {
      console.error('[createOrderMutation] onError:', err);
      toast.error('Erro ao criar pedido');
    },
  });

  const updateOrderWithItemsMutation = useMutation({
    mutationFn: ({
      orderId,
      data,
    }: {
      orderId: string;
      data: { items?: Array<{ productId: string; quantity: number }> };
      isAutosave?: boolean;
      silent?: boolean;
    }) => orderApi.updateWithItems(orderId, data),
    onSuccess: async (_result, variables) => {
      console.log('[updateMutation] onSuccess - isAutosave:', variables.isAutosave, 'silent:', variables.silent, 'isEditOrderModalOpen:', isEditOrderModalOpen);
      await queryClient.invalidateQueries({ queryKey: ['orders', campaignId] });
      await queryClient.invalidateQueries({ queryKey: ['analytics', campaignId] });

      if (variables.isAutosave) {
        autosave._markSaved();
        return;
      }

      // Skip modal close when called from handleAddToOrder (which handles its own modal opening)
      if (variables.silent) return;

      // Manual save (form submit) - close modal
      if (isEditOrderModalOpen) {
        console.log('[updateMutation] Fechando modal via onSuccess global');
        toast.success('Pedido atualizado!');
        closeEditOrderModal();
      }
    },
    onError: (_error, variables) => {
      toast.error('Erro ao atualizar pedido');
      if (variables.isAutosave) {
        autosave._markError();
      }
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: orderApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['analytics', campaignId] });
      toast.success('Pedido removido!');
    },
    onError: () => toast.error('Erro ao remover pedido'),
  });

  const updatePaymentMutation = useMutation({
    mutationFn: ({
      orderId,
      isPaid,
      file,
    }: {
      orderId: string;
      isPaid: boolean;
      file?: File;
    }) => orderApi.updatePayment(orderId, isPaid, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['analytics', campaignId] });
      toast.success('Status de pagamento atualizado!');
      setIsPaymentProofModalOpen(false);
      setOrderForPayment(null);
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Erro ao atualizar pagamento'));
    },
  });

  // Helpers
  const closeEditOrderModal = useCallback(() => {
    console.log('[closeEditOrderModal] Chamado - fechando modal');
    setIsEditOrderModalOpen(false);
    setEditingOrder(null);
    setEditOrderForm({ campaignId: '', items: [] });
  }, []);

  const openEditOrderModal = useCallback((order: Order) => {
    setEditingOrder(order);
    setEditOrderForm({
      campaignId: campaignId || '',
      items: order.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    });
    setIsEditOrderModalOpen(true);
  }, [campaignId]);

  // Handlers
  const handleAddToOrder = useCallback(async (product: Product) => {
    requireAuth(async () => {
      const existingOrder = orders?.find((o) => o.userId === user?.id);

      if (existingOrder) {
        const items = existingOrder.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        }));

        const existingItemIndex = items.findIndex(
          (item) => item.productId === product.id
        );
        if (existingItemIndex >= 0) {
          items[existingItemIndex].quantity++;
          toast.success(`Quantidade de "${product.name}" aumentada!`);
        } else {
          items.push({ productId: product.id, quantity: 1 });
          toast.success(`"${product.name}" adicionado ao pedido!`);
        }

        // 1. Atualiza backend PRIMEIRO
        updateOrderWithItemsMutation.mutate({
          orderId: existingOrder.id,
          data: { items },
          isAutosave: false,
          silent: true,
        }, {
          onSuccess: (updatedOrder: Order) => {
            // 2. Abre modal com dados frescos DEPOIS do sucesso
            setEditingOrder(updatedOrder);
            setEditOrderForm({
              campaignId: campaignId || '',
              items: updatedOrder.items.map((i) => ({
                productId: i.productId,
                quantity: i.quantity,
              })),
            });
            setIsEditOrderModalOpen(true);
          }
        });
      } else {
        if (!user?.name) {
          toast.error('Erro: Nome de usuário não encontrado');
          return;
        }

        toast.success(`Pedido criado com "${product.name}"!`);

        const createOrderData = {
          campaignId: campaignId || '',
          items: [{ productId: product.id, quantity: 1 }],
        };

        // 1. Cria pedido no backend PRIMEIRO
        createOrderMutation.mutate(createOrderData, {
          onSuccess: (createdOrder: Order) => {
            // 2. Abre modal com pedido criado DEPOIS do sucesso
            setEditingOrder(createdOrder);
            setEditOrderForm({
              campaignId: campaignId || '',
              items: createdOrder.items.map((i) => ({
                productId: i.productId,
                quantity: i.quantity,
              })),
            });
            setIsEditOrderModalOpen(true);
          }
        });
      }
    });
  }, [orders, user, campaignId, requireAuth, createOrderMutation, updateOrderWithItemsMutation]);

  const handleAddOrder = useCallback(() => {
    console.log('[handleAddOrder] Chamado');
    requireAuth(async () => {
      if (canCreateOrdersForOthers) {
        setAdminCustomerForm({ mode: 'self', name: '', email: '', phone: '' });
        setIsAdminCustomerModalOpen(true);
        return;
      }

      console.log('[handleAddOrder] Auth OK, user:', user?.id);
      const existingOrder = orders?.find((o) => o.userId === user?.id);
      console.log('[handleAddOrder] existingOrder:', existingOrder?.id || 'NENHUM');

      if (existingOrder) {
        console.log('[handleAddOrder] Abrindo modal de edição para pedido existente');
        openEditOrderModal(existingOrder);
      } else {
        if (!user?.name) {
          toast.error('Erro: Nome de usuário não encontrado');
          return;
        }

        const createOrderData = {
          campaignId: campaignId || '',
          items: [],
        };

        console.log('[handleAddOrder] Criando pedido vazio...');
        createOrderMutation.mutate(createOrderData, {
          onSuccess: (newOrder: Order) => {
            console.log('[handleAddOrder] Pedido criado:', newOrder.id, '- abrindo modal');
            setEditingOrder(newOrder);
            setEditOrderForm({
              campaignId: campaignId || '',
              items: [],
            });
            setIsEditOrderModalOpen(true);
          },
        });
      }
    });
  }, [canCreateOrdersForOthers, orders, user, campaignId, requireAuth, openEditOrderModal, createOrderMutation]);

  const handleCreateAdminOrder = useCallback(() => {
    requireAuth(() => {
      if (adminCustomerForm.mode === 'self') {
        const existingOwnOrder = orders?.find((o) => o.userId === user?.id);
        if (existingOwnOrder) {
          setIsAdminCustomerModalOpen(false);
          setAdminCustomerForm({ mode: 'self', name: '', email: '', phone: '' });
          openEditOrderModal(existingOwnOrder);
          return;
        }

        createOrderMutation.mutate(
          {
            campaignId: campaignId || '',
            items: [],
          },
          {
            onSuccess: (newOrder: Order) => {
              setIsAdminCustomerModalOpen(false);
              setAdminCustomerForm({ mode: 'self', name: '', email: '', phone: '' });
              setEditingOrder(newOrder);
              setEditOrderForm({
                campaignId: campaignId || '',
                items: [],
              });
              setIsEditOrderModalOpen(true);
            },
          }
        );
        return;
      }

      const trimmedName = adminCustomerForm.name.trim();
      const trimmedEmail = adminCustomerForm.email.trim().toLowerCase();
      const trimmedPhone = adminCustomerForm.phone.trim();

      if (!trimmedName) {
        toast.error('Nome do cliente é obrigatório');
        return;
      }

      if (!trimmedEmail) {
        toast.error('Email do cliente é obrigatório');
        return;
      }

      createOrderMutation.mutate(
        {
          campaignId: campaignId || '',
          items: [],
          customer: {
            name: trimmedName,
            email: trimmedEmail,
            phone: trimmedPhone || undefined,
          },
        },
        {
          onSuccess: (newOrder: Order) => {
            setIsAdminCustomerModalOpen(false);
            setAdminCustomerForm({ mode: 'self', name: '', email: '', phone: '' });
            setEditingOrder(newOrder);
            setEditOrderForm({
              campaignId: campaignId || '',
              items: [],
            });
            setIsEditOrderModalOpen(true);
          },
        }
      );
    });
  }, [adminCustomerForm.email, adminCustomerForm.mode, adminCustomerForm.name, adminCustomerForm.phone, campaignId, createOrderMutation, openEditOrderModal, orders, requireAuth, user?.id]);

  const handleEditOrder = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    updateOrderWithItemsMutation.mutate({
      orderId: editingOrder.id,
      data: {
        items: editOrderForm.items.filter(
          (item): item is { productId: string; quantity: number } =>
            !!item.productId && typeof item.quantity === 'number' && item.quantity > 0
        ),
      },
      isAutosave: false,
    });
  }, [editingOrder, editOrderForm.items, updateOrderWithItemsMutation]);

  const handleDeleteOrder = useCallback((orderId: string) => {
    deleteOrderMutation.mutate(orderId);
  }, [deleteOrderMutation]);

  const handleOpenEditOrder = useCallback((order: Order) => {
    requireAuth(() => {
      openEditOrderModal(order);
    });
  }, [openEditOrderModal, requireAuth]);

  const handleEditOrderFromView = useCallback(() => {
    if (viewingOrder) {
      setIsViewOrderModalOpen(false);
      openEditOrderModal(viewingOrder);
    }
  }, [viewingOrder, openEditOrderModal]);

  const handleViewOrder = useCallback((order: Order) => {
    requireAuth(() => {
      setViewingOrder(order);
      setIsViewOrderModalOpen(true);
    });
  }, [requireAuth]);

  const handleTogglePayment = useCallback((order: Order) => {
    requireAuth(() => {
      if (!order.isPaid) {
        setOrderForPayment(order);
        setIsPaymentProofModalOpen(true);
      } else {
        updatePaymentMutation.mutate({
          orderId: order.id,
          isPaid: false,
        });
      }
    });
  }, [requireAuth, updatePaymentMutation]);

  const handlePaymentProofSubmit = useCallback((file: File) => {
    if (!orderForPayment) return;
    updatePaymentMutation.mutate({
      orderId: orderForPayment.id,
      isPaid: true,
      file,
    });
  }, [orderForPayment, updatePaymentMutation]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'n' && isActive && user) {
        e.preventDefault();
        handleAddOrder();
      }

      if (e.altKey && e.key === 'p' && isEditOrderModalOpen) {
        e.preventDefault();
        setEditOrderForm((prev) => ({
          ...prev,
          items: [...prev.items, { productId: '', quantity: 1 }],
        }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, user, isEditOrderModalOpen, handleAddOrder]);

  return {
    // Modal state
    isEditOrderModalOpen,
    setIsEditOrderModalOpen,
    editingOrder,
    setEditingOrder,
    editOrderForm,
    setEditOrderForm,
    isViewOrderModalOpen,
    setIsViewOrderModalOpen,
    viewingOrder,
    setViewingOrder,
    isPaymentProofModalOpen,
    setIsPaymentProofModalOpen,
    isAdminCustomerModalOpen,
    setIsAdminCustomerModalOpen,
    orderForPayment,
    setOrderForPayment,
    adminCustomerForm,
    setAdminCustomerForm,

    // Autosave
    isAutosaving: autosave.isAutosaving,
    lastSaved: autosave.lastSaved,

    // Handlers
    handleAddOrder,
    handleAddToOrder,
    handleEditOrder,
    handleDeleteOrder,
    handleOpenEditOrder,
    handleViewOrder,
    handleEditOrderFromView,
    handleCreateAdminOrder,
    handleTogglePayment,
    handlePaymentProofSubmit,
    openEditOrderModal,
    closeEditOrderModal,

    // Mutations
    createOrderMutation,
    updateOrderWithItemsMutation,
    updatePaymentMutation,
  };
}

