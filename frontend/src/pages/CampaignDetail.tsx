import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { authStorage } from '@/lib/authStorage';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import {
  ArrowLeft,
  Plus,
  Package,
  ShoppingBag,
  TrendingUp,
  Edit,
  Trash2,
  CircleDollarSign,
  Search,
  Truck,
  Lock,
  Unlock,
  Send,
  AlertCircle,
  Calendar,
  Clock,
  FileText,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  X
} from 'lucide-react';
import {
  campaignApi,
  productApi,
  orderApi,
  analyticsApi,
  Order,
  Product
} from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import Button from '@/components/Button';
import IconButton from '@/components/IconButton';
import Card from '@/components/Card';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import DateTimeInput from '@/components/DateTimeInput';
import { SkeletonDetailHeader, SkeletonProductCard } from '@/components/Skeleton';
import OrderChat from '@/components/OrderChat';
import OrderCard from '@/components/campaign/OrderCard';

// Helper function para normalizar strings (remover acentos)
const normalizeString = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

// Helper function para obter o nome de exibição do cliente
// Com usuários virtuais, cada pedido legado tem seu próprio usuário virtual
// Então podemos sempre usar customer.name
const getCustomerDisplayName = (order: Order): string => {
  return order.customer.name;
};

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, requireAuth } = useAuth();
  const queryClient = useQueryClient();

  // Ativa atualizações em tempo real para esta campanha
  useRealtimeUpdates({ campaignId: id || '', enabled: !!id });

  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'shipping'>('overview');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isEditOrderModalOpen, setIsEditOrderModalOpen] = useState(false);
  const [isViewOrderModalOpen, setIsViewOrderModalOpen] = useState(false);
  const [isShippingModalOpen, setIsShippingModalOpen] = useState(false);
  const [isEditDeadlineModalOpen, setIsEditDeadlineModalOpen] = useState(false);
  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState(false);
  const [isReopenConfirmOpen, setIsReopenConfirmOpen] = useState(false);
  const [isSentConfirmOpen, setIsSentConfirmOpen] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderSortField, setOrderSortField] = useState<'customerName' | 'subtotal' | 'shippingFee' | 'total' | 'isPaid'>('customerName');
  const [orderSortDirection, setOrderSortDirection] = useState<'asc' | 'desc'>('asc');
  const [productSortField, setProductSortField] = useState<'name' | 'price' | 'weight'>('name');
  const [productSortDirection, setProductSortDirection] = useState<'asc' | 'desc'>('asc');
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deadlineForm, setDeadlineForm] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');

  const [productForm, setProductForm] = useState<{
    name: string;
    price: number | '';
    weight: number | '';
  }>({
    name: '',
    price: '',
    weight: ''
  });

  const [editProductForm, setEditProductForm] = useState<{
    name: string;
    price: number | '';
    weight: number | '';
  }>({
    name: '',
    price: '',
    weight: ''
  });

  const [orderForm, setOrderForm] = useState<{
    items: Array<{ productId: string; quantity: number | '' }>;
  }>({
    items: [{ productId: '', quantity: 1 }]
  });

  const [editOrderForm, setEditOrderForm] = useState<{
    items: Array<{ productId: string; quantity: number | '' }>;
  }>({
    items: [{ productId: '', quantity: 1 }]
  });

  const [shippingCost, setShippingCost] = useState<number | ''>(0);

  const { data: campaign } = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => campaignApi.getById(id!),
    enabled: !!id
  });

  const { data: products } = useQuery({
    queryKey: ['products', id],
    queryFn: () => productApi.getByCampaign(id!),
    enabled: !!id
  });

  const { data: orders } = useQuery({
    queryKey: ['orders', id],
    queryFn: () => orderApi.getByCampaign(id!),
    enabled: !!id
  });

  const { data: analytics } = useQuery({
    queryKey: ['analytics', id],
    queryFn: () => analyticsApi.getByCampaign(id!),
    enabled: !!id && activeTab === 'overview'
  });

  // Check if user can edit campaign (admin or creator)
  const canEditCampaign = user && campaign && (
    user.role === 'ADMIN' || campaign.creatorId === user.id
  );

  const createProductMutation = useMutation({
    mutationFn: productApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', id] });
      toast.success('Produto adicionado!');
      setIsProductModalOpen(false);
      setProductForm({ name: '', price: '', weight: '' });
    },
    onError: () => toast.error('Erro ao adicionar produto')
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ productId, data }: { productId: string; data: Partial<Product> }) =>
      productApi.update(productId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', id] });
      queryClient.invalidateQueries({ queryKey: ['orders', id] });
      queryClient.invalidateQueries({ queryKey: ['analytics', id] });
      toast.success('Produto atualizado!');
      setIsEditProductModalOpen(false);
      setEditingProduct(null);
    },
    onError: () => toast.error('Erro ao atualizar produto')
  });

  const deleteProductMutation = useMutation({
    mutationFn: productApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', id] });
      toast.success('Produto removido!');
    },
    onError: () => toast.error('Erro ao remover produto')
  });

  const createOrderMutation = useMutation({
    mutationFn: orderApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', id] });
      queryClient.invalidateQueries({ queryKey: ['analytics', id] });

      // Não fecha o modal nem reseta o form no auto-save
      // Não mostra toast para não poluir a interface
    },
    onError: () => toast.error('Erro ao criar pedido')
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ orderId, data }: { orderId: string; data: Partial<Order> }) =>
      orderApi.update(orderId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', id] });
      queryClient.invalidateQueries({ queryKey: ['analytics', id] });
      toast.success('Pedido atualizado!');
    },
    onError: () => toast.error('Erro ao atualizar pedido')
  });

  const updateOrderWithItemsMutation = useMutation({
    mutationFn: ({ orderId, data }: {
      orderId: string;
      data: { items?: Array<{ productId: string; quantity: number }> }
    }) => orderApi.updateWithItems(orderId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', id] });
      queryClient.invalidateQueries({ queryKey: ['analytics', id] });

      // Não fecha o modal nem reseta o form no auto-save
      // Não mostra toast para não poluir a interface
    },
    onError: () => toast.error('Erro ao atualizar pedido')
  });

  const deleteOrderMutation = useMutation({
    mutationFn: orderApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', id] });
      queryClient.invalidateQueries({ queryKey: ['analytics', id] });
      toast.success('Pedido removido!');
    },
    onError: () => toast.error('Erro ao remover pedido')
  });

  const updateShippingMutation = useMutation({
    mutationFn: (cost: number) => campaignApi.update(id!, { shippingCost: cost }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      queryClient.invalidateQueries({ queryKey: ['orders', id] });
      queryClient.invalidateQueries({ queryKey: ['analytics', id] });
      toast.success('Frete atualizado!');
      setIsShippingModalOpen(false);
    },
    onError: () => toast.error('Erro ao atualizar frete')
  });

  const updateDeadlineMutation = useMutation({
    mutationFn: (deadline: string | null) => campaignApi.update(id!, { deadline: deadline || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      toast.success('Data limite atualizada!');
      setIsEditDeadlineModalOpen(false);
    },
    onError: () => toast.error('Erro ao atualizar data limite')
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: 'ACTIVE' | 'CLOSED' | 'SENT' | 'ARCHIVED') =>
      campaignApi.updateStatus(id!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      toast.success('Status atualizado!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao atualizar status');
    }
  });

  const updateCampaignMutation = useMutation({
    mutationFn: (data: { name?: string; description?: string }) =>
      campaignApi.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      toast.success('Campanha atualizada!');
    },
    onError: () => toast.error('Erro ao atualizar campanha')
  });

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const price = typeof productForm.price === 'number' ? productForm.price : 0;
    const weight = typeof productForm.weight === 'number' ? productForm.weight : 0;

    createProductMutation.mutate({
      name: productForm.name,
      price,
      weight,
      campaignId: id!
    });
  };

  const handleEditProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const price = typeof editProductForm.price === 'number' ? editProductForm.price : 0;
    const weight = typeof editProductForm.weight === 'number' ? editProductForm.weight : 0;

    updateProductMutation.mutate({
      productId: editingProduct.id,
      data: {
        name: editProductForm.name,
        price,
        weight
      }
    });
  };

  const handleCloseOrderModal = () => {
    setIsOrderModalOpen(false);
    // Não reseta nada para permitir acumulação de produtos e persistência do nome
  };

  // Helper function para pré-carregar pedido existente do usuário
  const loadExistingOrder = () => {
    if (!user || !orders) return;

    // Busca pedido existente do usuário nesta campanha
    const existingOrder = orders.find(order => order.userId === user.id);

    if (existingOrder && existingOrder.items.length > 0) {
      // Pré-carrega os itens do pedido existente
      setOrderForm({
        items: existingOrder.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        }))
      });
    } else {
      // Sem pedido existente, inicia com um item vazio
      setOrderForm({
        items: [{ productId: '', quantity: 1 }]
      });
    }
  };

  const handleCreateOrder = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const validItems = orderForm.items
      .filter((item): item is { productId: string; quantity: number } =>
        item.productId !== '' && typeof item.quantity === 'number' && item.quantity > 0
      );
    if (validItems.length === 0) {
      return; // Não mostra erro no auto-save
    }
    createOrderMutation.mutate({
      campaignId: id!,
      items: validItems
    });
  };

  // Auto-save para novo pedido (salva imediatamente quando houver alterações)
  useEffect(() => {
    // Não salva se o modal não estiver aberto
    if (!isOrderModalOpen) return;

    // Verifica se há itens válidos antes de tentar salvar
    const validItems = orderForm.items.filter(
      (item) => item.productId !== '' && typeof item.quantity === 'number' && item.quantity > 0
    );

    // Só auto-salva se houver pelo menos um item válido
    if (validItems.length === 0) return;

    // Salva imediatamente
    handleCreateOrder();
  }, [orderForm.items]);

  // Check for and execute pending action after OAuth login
  useEffect(() => {
    // Only check once when component mounts and user is authenticated
    if (!user) return;

    const pendingActionData = authStorage.getPendingActionData();

    if (pendingActionData) {
      // Clear the stored data immediately
      authStorage.clearPendingActionData();
      authStorage.clearPendingActionFlag();

      console.log('Executing pending action:', pendingActionData);

      // Execute the appropriate action based on type
      if (pendingActionData.type === 'UPDATE_ORDER_PAYMENT') {
        const { orderId, isPaid } = pendingActionData.payload;

        // Small delay to ensure component is fully mounted and mutations are ready
        setTimeout(() => {
          // Double-check user is still authenticated before executing
          if (!user) {
            console.warn('Usuário não mais autenticado, pulando ação pendente');
            return;
          }

          console.log('Calling updateOrderMutation with:', { orderId, isPaid });
          updateOrderMutation.mutate({
            orderId,
            data: { isPaid }
          });
        }, 500);
      } else if (pendingActionData.type === 'EDIT_ORDER') {
        const { orderId, campaignId } = pendingActionData.payload;

        // Small delay to ensure component is fully mounted
        setTimeout(() => {
          // Validate user is still authenticated
          if (!user) {
            console.warn('User no longer authenticated, skipping pending action');
            return;
          }

          // Validate we're on the correct campaign page
          if (campaignId !== id) {
            console.warn('Campaign ID mismatch, skipping pending action');
            toast.error('Você foi redirecionado para uma campanha diferente');
            return;
          }

          // Find the order from fresh query data (not stale persisted data)
          const order = orders?.find(o => o.id === orderId);

          if (!order) {
            console.warn('Order not found:', orderId);
            toast.error('Pedido não encontrado. Ele pode ter sido removido.');
            return;
          }

          // Validate campaign is still active
          if (campaign?.status !== 'ACTIVE') {
            toast.error('A campanha não está mais ativa. Não é possível editar pedidos.');
            return;
          }

          // Revalidate permissions with fresh data
          const canEdit = order.userId === user.id || canEditCampaign;

          if (!canEdit) {
            toast.error('Você não tem permissão para editar este pedido.');
            return;
          }

          // All validations passed - open the edit modal
          openEditOrderModal(order);
        }, 500);
      }
    }
  }, [user, orders, campaign, id, canEditCampaign]);

  const handleUpdateShipping = (e: React.FormEvent) => {
    e.preventDefault();
    const cost = typeof shippingCost === 'number' ? shippingCost : 0;
    updateShippingMutation.mutate(cost);
  };

  const handleUpdateDeadline = (e: React.FormEvent) => {
    e.preventDefault();
    updateDeadlineMutation.mutate(deadlineForm || null);
  };

  const openEditOrderModal = (order: Order) => {
    // Close view modal if open
    setIsViewOrderModalOpen(false);
    setViewingOrder(null);

    // Set editing state with order data
    setEditingOrder(order);
    setEditOrderForm({
      items: order.items.map(item => ({
        productId: item.product.id,
        quantity: item.quantity
      }))
    });

    // Open edit modal
    setIsEditOrderModalOpen(true);
  };

  const handleEditOrder = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingOrder) return;

    const validItems = editOrderForm.items
      .filter((item): item is { productId: string; quantity: number } =>
        item.productId !== '' && typeof item.quantity === 'number' && item.quantity > 0
      );
    if (validItems.length === 0) {
      return; // Não mostra erro no auto-save
    }

    updateOrderWithItemsMutation.mutate({
      orderId: editingOrder.id,
      data: {
        items: validItems
      }
    });
  };

  // Auto-save para edição de pedido (salva imediatamente quando houver alterações)
  useEffect(() => {
    // Não salva se o modal não estiver aberto ou não houver pedido sendo editado
    if (!editingOrder || !isEditOrderModalOpen) return;

    // Verifica se há itens válidos antes de tentar salvar
    const validItems = editOrderForm.items.filter(
      (item) => item.productId !== '' && typeof item.quantity === 'number' && item.quantity > 0
    );

    // Só auto-salva se houver pelo menos um item válido
    if (validItems.length === 0) return;

    // Salva imediatamente
    handleEditOrder();
  }, [editOrderForm.items]);

  // Handler para alternar ordenação de pedidos
  const handleSort = (field: typeof orderSortField) => {
    if (orderSortField === field) {
      // Se já está ordenando por este campo, inverte a direção
      setOrderSortDirection(orderSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Se é um novo campo, ordena ascendente
      setOrderSortField(field);
      setOrderSortDirection('asc');
    }
  };

  // Renderiza ícone de ordenação de pedidos
  const renderSortIcon = (field: typeof orderSortField) => {
    if (orderSortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return orderSortDirection === 'asc'
      ? <ArrowUp className="w-4 h-4 text-primary-600" />
      : <ArrowDown className="w-4 h-4 text-primary-600" />;
  };

  // Handler para alternar ordenação de produtos
  const handleProductSort = (field: typeof productSortField) => {
    if (productSortField === field) {
      // Se já está ordenando por este campo, inverte a direção
      setProductSortDirection(productSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Se é um novo campo, ordena ascendente
      setProductSortField(field);
      setProductSortDirection('asc');
    }
  };

  // Renderiza ícone de ordenação de produtos
  const renderProductSortIcon = (field: typeof productSortField) => {
    if (productSortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return productSortDirection === 'asc'
      ? <ArrowUp className="w-4 h-4 text-primary-600" />
      : <ArrowDown className="w-4 h-4 text-primary-600" />;
  };

  // Filtra e ordena pedidos
  const filteredOrders = orders
    ?.filter(order =>
      normalizeString(getCustomerDisplayName(order)).includes(normalizeString(orderSearch))
    )
    .sort((a, b) => {
      let comparison = 0;

      switch (orderSortField) {
        case 'customerName':
          comparison = getCustomerDisplayName(a).localeCompare(getCustomerDisplayName(b));
          break;
        case 'subtotal':
          comparison = a.subtotal - b.subtotal;
          break;
        case 'shippingFee':
          comparison = a.shippingFee - b.shippingFee;
          break;
        case 'total':
          comparison = a.total - b.total;
          break;
        case 'isPaid':
          comparison = (a.isPaid === b.isPaid) ? 0 : a.isPaid ? -1 : 1;
          break;
      }

      return orderSortDirection === 'asc' ? comparison : -comparison;
    });

  // Ordena produtos para exibição na aba de produtos
  const sortedProducts = products?.slice().sort((a, b) => {
    let comparison = 0;

    switch (productSortField) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'price':
        comparison = a.price - b.price;
        break;
      case 'weight':
        comparison = a.weight - b.weight;
        break;
    }

    return productSortDirection === 'asc' ? comparison : -comparison;
  });

  // Produtos ordenados alfabeticamente para dropdowns
  const alphabeticalProducts = products?.slice().sort((a, b) => a.name.localeCompare(b.name));

  // Handlers para edição inline do nome
  const handleNameClick = () => {
    if (!canEditCampaign) {
      toast.error('Apenas o criador da campanha pode editar o nome');
      return;
    }
    setEditedName(campaign?.name || '');
    setIsEditingName(true);
  };

  const handleNameSave = () => {
    if (editedName.trim() && editedName !== campaign?.name) {
      updateCampaignMutation.mutate({ name: editedName.trim() });
    }
    setIsEditingName(false);
  };

  const handleNameCancel = () => {
    setIsEditingName(false);
    setEditedName('');
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNameSave();
    } else if (e.key === 'Escape') {
      handleNameCancel();
    }
  };

  // Handlers para edição inline da descrição
  const handleDescriptionClick = () => {
    if (!canEditCampaign) {
      toast.error('Apenas o criador da campanha pode editar a descrição');
      return;
    }
    setEditedDescription(campaign?.description || '');
    setIsEditingDescription(true);
  };

  const handleDescriptionSave = () => {
    if (editedDescription.trim() !== campaign?.description) {
      updateCampaignMutation.mutate({ description: editedDescription.trim() || undefined });
    }
    setIsEditingDescription(false);
  };

  const handleDescriptionCancel = () => {
    setIsEditingDescription(false);
    setEditedDescription('');
  };

  const handleDescriptionKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleDescriptionSave();
    } else if (e.key === 'Escape') {
      handleDescriptionCancel();
    }
  };

  // Move campaign status checks before the early return
  const isActive = campaign?.status === 'ACTIVE';
  const isClosed = campaign?.status === 'CLOSED';
  const isSent = campaign?.status === 'SENT';

  // Atalhos de teclado - Must be called before early returns
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC - Fechar modal/diálogo aberto
      if (e.key === 'Escape') {
        if (isOrderModalOpen) {
          handleCloseOrderModal();
        } else if (isEditOrderModalOpen) {
          setIsEditOrderModalOpen(false);
          setEditingOrder(null);
        } else if (isViewOrderModalOpen) {
          setIsViewOrderModalOpen(false);
          setViewingOrder(null);
        } else if (isProductModalOpen) {
          setIsProductModalOpen(false);
        } else if (isEditProductModalOpen) {
          setIsEditProductModalOpen(false);
          setEditingProduct(null);
        } else if (isShippingModalOpen) {
          setIsShippingModalOpen(false);
        } else if (isEditDeadlineModalOpen) {
          setIsEditDeadlineModalOpen(false);
        } else if (isCloseConfirmOpen) {
          setIsCloseConfirmOpen(false);
        } else if (isReopenConfirmOpen) {
          setIsReopenConfirmOpen(false);
        } else if (isSentConfirmOpen) {
          setIsSentConfirmOpen(false);
        }
        return;
      }

      // Alt+N - Abrir modal de adicionar pedido (somente se campanha estiver ativa)
      if (e.altKey && e.key === 'n' && isActive && !isOrderModalOpen && !isEditOrderModalOpen) {
        e.preventDefault();
        loadExistingOrder();
        setIsOrderModalOpen(true);
      }

      // Alt+P - Adicionar produto no formulário de pedido (quando modal está aberto)
      if (e.altKey && e.key === 'p' && (isOrderModalOpen || isEditOrderModalOpen)) {
        e.preventDefault();
        if (isOrderModalOpen) {
          setOrderForm({
            ...orderForm,
            items: [...orderForm.items, { productId: '', quantity: 1 }]
          });
        } else if (isEditOrderModalOpen) {
          setEditOrderForm({
            ...editOrderForm,
            items: [...editOrderForm.items, { productId: '', quantity: 1 }]
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, isOrderModalOpen, isEditOrderModalOpen, isViewOrderModalOpen, isProductModalOpen, isEditProductModalOpen, isShippingModalOpen, isEditDeadlineModalOpen, isCloseConfirmOpen, isReopenConfirmOpen, isSentConfirmOpen, orderForm, editOrderForm]);

  if (!campaign) {
    return (
      <div>
        <div className="mb-4 md:mb-6">
          <Link to="/campaigns" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-3 md:mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Link>
          <SkeletonDetailHeader />
        </div>

        {/* Desktop tabs skeleton */}
        <div className="hidden md:flex gap-1 mb-6 border-b">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="px-6 py-2 border-b-2 border-transparent">
              <div className="h-5 w-24 bg-gray-200 animate-pulse rounded" />
            </div>
          ))}
        </div>

        {/* Mobile tabs skeleton */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
          <div className="flex">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center justify-center flex-1 py-2 px-1">
                <div className="w-5 h-5 bg-gray-200 animate-pulse rounded mb-0.5" />
                <div className="h-3 w-10 bg-gray-200 animate-pulse rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Content skeleton */}
        <div className="space-y-6 pb-20 md:pb-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonProductCard key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 md:mb-6">
        <Link to="/campaigns" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-3 md:mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Link>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div className="flex-1">
            {/* Edição inline do nome */}
            {isEditingName ? (
              <div className="mb-2">
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onBlur={handleNameSave}
                  onKeyDown={handleNameKeyDown}
                  autoFocus
                  className="text-3xl font-bold text-gray-900 w-full px-2 py-1 border-2 border-primary-500 rounded focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Pressione Enter para salvar, Esc para cancelar</p>
              </div>
            ) : (
              <h1
                className="text-3xl font-bold text-gray-900 mb-2 cursor-pointer hover:text-primary-600 transition-colors inline-block"
                onClick={handleNameClick}
                title="Clique para editar"
              >
                {campaign.name}
              </h1>
            )}

            {/* Edição inline da descrição */}
            {isEditingDescription ? (
              <div className="mb-2">
                <textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  onBlur={handleDescriptionSave}
                  onKeyDown={handleDescriptionKeyDown}
                  autoFocus
                  rows={3}
                  className="text-gray-600 w-full px-2 py-1 border-2 border-primary-500 rounded focus:outline-none resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">Pressione Enter para salvar, Shift+Enter para nova linha, Esc para cancelar</p>
              </div>
            ) : (
              <>
                {campaign.description ? (
                  <p
                    className="text-gray-600 mb-2 cursor-pointer hover:text-primary-600 transition-colors"
                    onClick={handleDescriptionClick}
                    title="Clique para editar"
                  >
                    {campaign.description}
                  </p>
                ) : (
                  <p
                    className="text-gray-400 mb-2 cursor-pointer hover:text-primary-400 transition-colors italic"
                    onClick={handleDescriptionClick}
                    title="Clique para adicionar descrição"
                  >
                    Clique para adicionar descrição
                  </p>
                )}
              </>
            )}
            {campaign.deadline && (
              <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg font-medium mt-4 ${new Date(campaign.deadline) < new Date()
                ? 'bg-red-100 text-red-800 border border-red-300'
                : new Date(campaign.deadline).getTime() - new Date().getTime() < 24 * 60 * 60 * 1000
                  ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                  : 'bg-blue-100 text-blue-800 border border-blue-300'
                }`}>
                <Clock className="w-4 h-4" />
                <span className="text-sm">
                  Data limite: {new Date(campaign.deadline).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })} às {new Date(campaign.deadline).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  })}
                </span>
                {canEditCampaign && (
                  <IconButton
                    size="sm"
                    variant="ghost"
                    icon={<Edit className="w-3 h-3" />}
                    onClick={() => {
                      setIsEditDeadlineModalOpen(true);
                      if (campaign.deadline) {
                        const dt = new Date(campaign.deadline);
                        // Create ISO string in local timezone
                        const year = dt.getFullYear();
                        const month = (dt.getMonth() + 1).toString().padStart(2, '0');
                        const day = dt.getDate().toString().padStart(2, '0');
                        const hours = dt.getHours().toString().padStart(2, '0');
                        const minutes = dt.getMinutes().toString().padStart(2, '0');
                        const seconds = dt.getSeconds().toString().padStart(2, '0');
                        setDeadlineForm(`${year}-${month}-${day}T${hours}:${minutes}:${seconds}`);
                      } else {
                        setDeadlineForm('');
                      }
                    }}
                    title="Editar data limite"
                    className="!p-1"
                  />
                )}
              </div>
            )}
            {!campaign.deadline && isActive && canEditCampaign && (
              <IconButton
                size="sm"
                variant="secondary"
                icon={<Calendar className="w-4 h-4" />}
                onClick={() => {
                  setIsEditDeadlineModalOpen(true);
                  setDeadlineForm('');
                }}
                className="mt-4"
              >
                Adicionar data limite
              </IconButton>
            )}
          </div>

          {/* Botões de Ação da Campanha */}
          <div className="flex flex-wrap gap-2">
            {orders && orders.length > 0 && canEditCampaign && (
              <IconButton
                size="sm"
                variant="secondary"
                icon={<FileText className="w-4 h-4" />}
                onClick={async () => {
                  try {
                    await campaignApi.downloadSupplierInvoice(id!);
                    toast.success('Fatura gerada com sucesso!');
                  } catch (error) {
                    toast.error('Erro ao gerar fatura');
                  }
                }}
                className="text-xs sm:text-sm whitespace-nowrap"
              >
                Gerar Fatura
              </IconButton>
            )}

            {isActive && canEditCampaign && (
              <IconButton
                size="sm"
                icon={<Lock className="w-4 h-4" />}
                onClick={() => setIsCloseConfirmOpen(true)}
                variant="warning"
                className="text-xs sm:text-sm whitespace-nowrap"
              >
                Fechar Campanha
              </IconButton>
            )}

            {isClosed && canEditCampaign && (
              <>
                <IconButton
                  size="sm"
                  icon={<Unlock className="w-4 h-4" />}
                  onClick={() => setIsReopenConfirmOpen(true)}
                  variant="warning"
                  className="text-xs sm:text-sm whitespace-nowrap"
                >
                  Reabrir
                </IconButton>
                <IconButton
                  size="sm"
                  icon={<Send className="w-4 h-4" />}
                  onClick={() => setIsSentConfirmOpen(true)}
                  className="text-xs sm:text-sm whitespace-nowrap"
                >
                  Marcar como Enviado
                </IconButton>
              </>
            )}

            {isSent && canEditCampaign && (
              <IconButton
                size="sm"
                icon={<Unlock className="w-4 h-4" />}
                onClick={() => setIsReopenConfirmOpen(true)}
                variant="warning"
                className="text-xs sm:text-sm whitespace-nowrap"
              >
                Reabrir Campanha
              </IconButton>
            )}
          </div>
        </div>

        {/* Banner de Alerta */}
        {!isActive && (
          <div className={`rounded-lg p-4 mb-4 flex items-start gap-3 ${isClosed ? 'bg-yellow-50 border border-yellow-200' : 'bg-blue-50 border border-blue-200'
            }`}>
            <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isClosed ? 'text-yellow-600' : 'text-blue-600'
              }`} />
            <div>
              <h3 className={`font-semibold mb-1 ${isClosed ? 'text-yellow-900' : 'text-blue-900'
                }`}>
                {isClosed ? 'Campanha Fechada' : 'Campanha Enviada'}
              </h3>
              <p className={`text-sm ${isClosed ? 'text-yellow-800' : 'text-blue-800'
                }`}>
                {isClosed
                  ? 'Esta campanha está fechada. Não é possível adicionar ou alterar produtos e pedidos.'
                  : 'Esta campanha foi marcada como enviada. Não é possível adicionar ou alterar produtos e pedidos.'
                }
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Desktop: Tab navigation at top */}
      <div className="hidden md:flex gap-1 mb-6 border-b">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center justify-center gap-2 px-3 py-2 font-medium transition-colors flex-1 md:flex-initial rounded-t-lg ${activeTab === 'overview'
            ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border-b-2 border-transparent'
            }`}
        >
          <TrendingUp className="w-4 h-4 flex-shrink-0" />
          <span>Visão Geral</span>
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center justify-center gap-2 px-3 py-2 font-medium transition-colors flex-1 md:flex-initial rounded-t-lg ${activeTab === 'orders'
            ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border-b-2 border-transparent'
            }`}
        >
          <ShoppingBag className="w-4 h-4 flex-shrink-0" />
          <span>Pedidos</span>
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center justify-center gap-2 px-3 py-2 font-medium transition-colors flex-1 md:flex-initial rounded-t-lg ${activeTab === 'products'
            ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border-b-2 border-transparent'
            }`}
        >
          <Package className="w-4 h-4 flex-shrink-0" />
          <span>Produtos</span>
        </button>
        <button
          onClick={() => setActiveTab('shipping')}
          className={`flex items-center justify-center gap-2 px-3 py-2 font-medium transition-colors flex-1 md:flex-initial rounded-t-lg ${activeTab === 'shipping'
            ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border-b-2 border-transparent'
            }`}
        >
          <Truck className="w-4 h-4 flex-shrink-0" />
          <span>Frete</span>
        </button>
      </div>

      {/* Mobile: Fixed bottom navigation bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-primary-600 border-t-2 border-primary-700 shadow-lg z-50">
        <div className="flex">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex flex-col items-center justify-center flex-1 py-2 px-1 transition-colors ${activeTab === 'overview'
              ? 'text-yellow-300 font-bold border-b-4 border-yellow-300'
              : 'text-white hover:text-yellow-200'
              }`}
          >
            <TrendingUp className="w-5 h-5 flex-shrink-0 mb-0.5" />
            <span className="text-xs font-medium">Geral</span>
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex flex-col items-center justify-center flex-1 py-2 px-1 transition-colors ${activeTab === 'orders'
              ? 'text-yellow-300 font-bold border-b-4 border-yellow-300'
              : 'text-white hover:text-yellow-200'
              }`}
          >
            <ShoppingBag className="w-5 h-5 flex-shrink-0 mb-0.5" />
            <span className="text-xs font-medium">Pedidos</span>
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`flex flex-col items-center justify-center flex-1 py-2 px-1 transition-colors ${activeTab === 'products'
              ? 'text-yellow-300 font-bold border-b-4 border-yellow-300'
              : 'text-white hover:text-yellow-200'
              }`}
          >
            <Package className="w-5 h-5 flex-shrink-0 mb-0.5" />
            <span className="text-xs font-medium">Produtos</span>
          </button>
          <button
            onClick={() => setActiveTab('shipping')}
            className={`flex flex-col items-center justify-center flex-1 py-2 px-1 transition-colors ${activeTab === 'shipping'
              ? 'text-yellow-300 font-bold border-b-4 border-yellow-300'
              : 'text-white hover:text-yellow-200'
              }`}
          >
            <Truck className="w-5 h-5 flex-shrink-0 mb-0.5" />
            <span className="text-xs font-medium">Frete</span>
          </button>
        </div>
      </div>

      {activeTab === 'overview' && analytics && (
        <div className="space-y-6 pb-20 md:pb-0">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-4 md:mt-6">
            <h2 className="text-2xl font-bold">Visão Geral</h2>

            {/* Botões de Ação Principais */}
            {isActive && (
              <div className="flex gap-2 justify-center md:justify-end flex-wrap">
                {canEditCampaign && (
                  <IconButton
                    size="sm"
                    icon={<Package className="w-4 h-4" />}
                    onClick={() => setIsProductModalOpen(true)}
                    className="text-xs sm:text-sm"
                  >
                    Adicionar Produto
                  </IconButton>
                )}
                <IconButton
                  size="sm"
                  icon={<ShoppingBag className="w-4 h-4" />}
                  onClick={() => requireAuth(() => {
                    loadExistingOrder();
                    setIsOrderModalOpen(true);
                  })}
                  className="text-xs sm:text-sm"
                  title="Adicionar Pedido (Alt+N)"
                >
                  Adicionar Pedido
                </IconButton>
              </div>
            )}
          </div>

          {/* Produtos em Destaque */}
          {products && products.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Produtos Disponíveis</h3>
                <button
                  onClick={() => setActiveTab('products')}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                >
                  Ver todos
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {products.slice().sort((a, b) => a.name.localeCompare(b.name)).map((product) => {
                  return (
                    <div
                      key={product.id}
                      className="bg-white border border-gray-200 rounded-lg p-3 hover:border-primary-400 hover:shadow-md transition-all duration-200 flex flex-col"
                    >
                      {/* Ícone */}
                      <div className="bg-primary-100 p-2 rounded-lg mb-2 w-fit">
                        <Package className="w-5 h-5 text-primary-600" />
                      </div>

                      {/* Nome do Produto */}
                      <h4 className="font-semibold text-gray-900 mb-1 line-clamp-2 text-sm md:text-base leading-tight min-h-[2.25rem] md:min-h-[3rem]">
                        {product.name}
                      </h4>

                      {/* Preço */}
                      <div className="mt-auto mb-2">
                        <span className="text-lg font-bold text-primary-600">
                          {formatCurrency(product.price)}
                        </span>
                      </div>

                      {/* Botão de Ação */}
                      {isActive && (
                        <button
                          onClick={() => requireAuth(() => {
                            if (!user || !orders) {
                              setIsOrderModalOpen(true);
                              return;
                            }

                            // Busca pedido existente do usuário nesta campanha
                            const existingOrder = orders.find(order => order.userId === user.id);

                            if (existingOrder && existingOrder.items.length > 0) {
                              // Pré-carrega os itens do pedido existente
                              const existingItems = existingOrder.items.map(item => ({
                                productId: item.productId,
                                quantity: item.quantity
                              }));

                              // Verifica se o produto clicado já está no pedido
                              const existingItemIndex = existingItems.findIndex(item => item.productId === product.id);

                              if (existingItemIndex >= 0) {
                                // Produto já existe - incrementa a quantidade em +1
                                const updatedItems = [...existingItems];
                                updatedItems[existingItemIndex] = {
                                  ...updatedItems[existingItemIndex],
                                  quantity: updatedItems[existingItemIndex].quantity + 1
                                };
                                setOrderForm({ items: updatedItems });
                              } else {
                                // Produto novo - adiciona aos itens existentes com quantidade 1
                                setOrderForm({
                                  items: [...existingItems, { productId: product.id, quantity: 1 }]
                                });
                              }
                            } else {
                              // Sem pedido existente, inicia com este produto
                              setOrderForm({
                                items: [{ productId: product.id, quantity: 1 }]
                              });
                            }

                            setIsOrderModalOpen(true);
                          })}
                          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-1.5 px-3 rounded-lg transition-colors duration-200 text-sm"
                        >
                          Pedir
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Resumo Financeiro */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo Financeiro</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card>
                <div className="text-sm text-gray-500 mb-1">Total de Pessoas</div>
                <div className="text-2xl md:text-3xl font-bold text-gray-900">{analytics.byCustomer.length}</div>
              </Card>
              <Card>
                <div className="text-sm text-gray-500 mb-1">Total de Itens</div>
                <div className="text-2xl md:text-3xl font-bold text-gray-900">{analytics.totalQuantity}</div>
              </Card>
              <Card>
                <div className="text-sm text-gray-500 mb-1">Total sem Frete</div>
                <div className="text-xl md:text-3xl font-bold text-gray-900">
                  {formatCurrency(analytics.totalWithoutShipping)}
                </div>
              </Card>
              <Card>
                <div className="text-sm text-gray-500 mb-1">Total com Frete</div>
                <div className="text-xl md:text-3xl font-bold text-gray-900">
                  {formatCurrency(analytics.totalWithShipping)}
                </div>
              </Card>
              <Card>
                <div className="text-sm text-gray-500 mb-1">Total Pago</div>
                <div className="text-xl md:text-3xl font-bold text-green-600">
                  {formatCurrency(analytics.totalPaid)}
                </div>
              </Card>
              <Card>
                <div className="text-sm text-gray-500 mb-1">Total Não Pago</div>
                <div className="text-xl md:text-3xl font-bold text-red-600">
                  {formatCurrency(analytics.totalUnpaid)}
                </div>
              </Card>
            </div>
          </div>

          {/* Detalhes por Produto e Cliente */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalhamento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:items-start">
              <Card className="h-fit">
                <h4 className="font-semibold mb-4 text-gray-800">Por Pessoa</h4>
                <div className="space-y-3">
                  {[...analytics.byCustomer]
                    .sort((a, b) => (a.customerName || '').localeCompare(b.customerName || ''))
                    .map((item, index) => {
                      // Encontrar o pedido correspondente à pessoa
                      const order = orders?.find(o => getCustomerDisplayName(o) === item.customerName);

                      return (
                        <div key={index} className="flex flex-col gap-2 pb-3 border-b last:border-b-0 last:pb-0">
                          {/* Linha 1: Nome e Botões de Ações */}
                          <div className="flex justify-between items-center gap-3">
                            <span className="text-gray-900 font-medium flex-1 min-w-0">{item.customerName}</span>

                            <div className="flex items-center gap-2">
                              {order && (
                                <>
                                  <IconButton
                                    size="sm"
                                    variant="secondary"
                                    icon={<Eye className="w-5 h-5" />}
                                    onClick={() => {
                                      setViewingOrder(order);
                                      setIsViewOrderModalOpen(true);
                                    }}
                                    title="Visualizar pedido"
                                  />
                                  <IconButton
                                    size="sm"
                                    variant={item.isPaid ? 'success' : 'secondary'}
                                    icon={<CircleDollarSign className="w-5 h-5" />}
                                    onClick={() =>
                                      requireAuth(
                                        () =>
                                          updateOrderMutation.mutate({
                                            orderId: order.id,
                                            data: { isPaid: !item.isPaid }
                                          }),
                                        {
                                          type: 'UPDATE_ORDER_PAYMENT',
                                          payload: { orderId: order.id, isPaid: !item.isPaid }
                                        }
                                      )
                                    }
                                    title={item.isPaid ? 'Marcar como não pago' : 'Marcar como pago'}
                                  />
                                </>
                              )}
                            </div>
                          </div>

                          {/* Linha 2: Status e Valor */}
                          <div className="flex items-center justify-between gap-3">
                            <span className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${item.isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>
                              {item.isPaid ? 'Pago' : 'Pendente'}
                            </span>

                            <span className="font-semibold text-gray-900 whitespace-nowrap">
                              {formatCurrency(item.total)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </Card>

              <Card className="h-fit">
                <h4 className="font-semibold mb-4 text-gray-800">Por Produto</h4>
                <div className="space-y-2">
                  {analytics.byProduct.map((item) => (
                    <div key={item.productId} className="flex justify-between items-center gap-3">
                      <span className="text-gray-600 truncate flex-1 min-w-0">{item.productName}</span>
                      <span className="font-medium text-gray-900 whitespace-nowrap flex-shrink-0">
                        {item.quantity} <span className="hidden sm:inline">unidades</span><span className="sm:hidden">un.</span>
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'products' && (
        <div className="pb-20 md:pb-0">
          <div className="flex justify-between items-center mb-4 gap-2">
            <h2 className="text-2xl font-bold">Produtos</h2>
            {isActive && canEditCampaign && (
              <IconButton
                size="sm"
                icon={<Package className="w-4 h-4" />}
                onClick={() => setIsProductModalOpen(true)}
                className="text-xs sm:text-sm whitespace-nowrap"
              >
                Adicionar Produto
              </IconButton>
            )}
          </div>

          {products && products.length === 0 ? (
            <Card>
              <div className="text-center py-8">
                <p className="text-gray-500">Nenhum produto cadastrado</p>
              </div>
            </Card>
          ) : (
            <>
              {/* Mobile: Sorting Controls */}
              <div className="md:hidden mb-3">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  <button
                    onClick={() => handleProductSort('name')}
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${productSortField === 'name'
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    <span>Nome</span>
                    {renderProductSortIcon('name')}
                  </button>
                  <button
                    onClick={() => handleProductSort('price')}
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${productSortField === 'price'
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    <span>Preço</span>
                    {renderProductSortIcon('price')}
                  </button>
                  <button
                    onClick={() => handleProductSort('weight')}
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${productSortField === 'weight'
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    <span>Peso</span>
                    {renderProductSortIcon('weight')}
                  </button>
                </div>
              </div>

              {/* Mobile: Cards */}
              <div className="space-y-2 md:hidden">
                {sortedProducts?.map((product) => (
                  <Card key={product.id}>
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-gray-900">{product.name}</h3>
                        {isActive && canEditCampaign && (
                          <div className="flex gap-1 flex-shrink-0">
                            <IconButton
                              size="sm"
                              variant="secondary"
                              icon={<Edit className="w-4 h-4" />}
                              onClick={() => {
                                setEditingProduct(product);
                                setEditProductForm({
                                  name: product.name,
                                  price: product.price,
                                  weight: product.weight
                                });
                                setIsEditProductModalOpen(true);
                              }}
                              title="Editar produto"
                            />
                            <IconButton
                              size="sm"
                              variant="danger"
                              icon={<Trash2 className="w-4 h-4" />}
                              onClick={() => {
                                if (confirm('Tem certeza que deseja remover este produto?')) {
                                  deleteProductMutation.mutate(product.id);
                                }
                              }}
                              title="Remover produto"
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Preço: </span>
                          <span className="font-medium text-gray-900">{formatCurrency(product.price)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Peso: </span>
                          <span className="font-medium text-gray-900">{product.weight}g</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Desktop: Table */}
              <Card className="hidden md:block">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr>
                        <th
                          className="px-4 py-3 text-left text-sm font-medium text-gray-900 cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => handleProductSort('name')}
                        >
                          <div className="flex items-center gap-2">
                            <span>Produto</span>
                            {renderProductSortIcon('name')}
                          </div>
                        </th>
                        <th
                          className="px-4 py-3 text-left text-sm font-medium text-gray-900 cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => handleProductSort('price')}
                        >
                          <div className="flex items-center gap-2">
                            <span>Preço</span>
                            {renderProductSortIcon('price')}
                          </div>
                        </th>
                        <th
                          className="px-4 py-3 text-left text-sm font-medium text-gray-900 cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => handleProductSort('weight')}
                        >
                          <div className="flex items-center gap-2">
                            <span>Peso</span>
                            {renderProductSortIcon('weight')}
                          </div>
                        </th>
                        {isActive && canEditCampaign && (
                          <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Ações</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {sortedProducts?.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{product.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(product.price)}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{product.weight}g</td>
                          {isActive && canEditCampaign && (
                            <td className="px-4 py-3 text-sm text-right whitespace-nowrap">
                              <div className="flex gap-1 justify-end">
                                <IconButton
                                  size="sm"
                                  variant="secondary"
                                  icon={<Edit className="w-4 h-4" />}
                                  onClick={() => {
                                    setEditingProduct(product);
                                    setEditProductForm({
                                      name: product.name,
                                      price: product.price,
                                      weight: product.weight
                                    });
                                    setIsEditProductModalOpen(true);
                                  }}
                                  title="Editar produto"
                                />
                                <IconButton
                                  size="sm"
                                  variant="danger"
                                  icon={<Trash2 className="w-4 h-4" />}
                                  onClick={() => {
                                    if (confirm('Tem certeza que deseja remover este produto?')) {
                                      deleteProductMutation.mutate(product.id);
                                    }
                                  }}
                                  title="Remover produto"
                                />
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="pb-20 md:pb-0">
          <div className="mb-4 space-y-3">
            <div className="flex justify-between items-center gap-2">
              <h2 className="text-2xl font-bold">Pedidos</h2>
              {isActive && (
                <IconButton
                  size="sm"
                  icon={<ShoppingBag className="w-4 h-4" />}
                  onClick={() => requireAuth(() => {
                    loadExistingOrder();
                    setIsOrderModalOpen(true);
                  })}
                  className="text-xs sm:text-sm whitespace-nowrap"
                  title="Adicionar Pedido (Alt+N)"
                >
                  Adicionar Pedido
                </IconButton>
              )}
            </div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por pessoa..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              />
              {orderSearch && (
                <button
                  type="button"
                  onClick={() => setOrderSearch('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Limpar busca"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {filteredOrders && filteredOrders.length === 0 ? (
            <Card>
              <div className="text-center py-8">
                <p className="text-gray-500">
                  {orderSearch ? 'Nenhum pedido encontrado' : 'Nenhum pedido criado'}
                </p>
              </div>
            </Card>
          ) : (
            <>
              {/* Mobile: Sorting Controls */}
              <div className="md:hidden mb-3">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  <button
                    onClick={() => handleSort('customerName')}
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${orderSortField === 'customerName'
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    <span>Pessoa</span>
                    {renderSortIcon('customerName')}
                  </button>
                  <button
                    onClick={() => handleSort('total')}
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${orderSortField === 'total'
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    <span>Total</span>
                    {renderSortIcon('total')}
                  </button>
                  <button
                    onClick={() => handleSort('isPaid')}
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${orderSortField === 'isPaid'
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    <span>Status</span>
                    {renderSortIcon('isPaid')}
                  </button>
                </div>
              </div>

              {/* Mobile: Cards */}
              <div className="space-y-2 md:hidden">
                {filteredOrders?.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    customerName={getCustomerDisplayName(order)}
                    canEditCampaign={!!canEditCampaign}
                    isActive={isActive}
                    currentUserId={user?.id}
                    onView={() => {
                      setViewingOrder(order);
                      setIsViewOrderModalOpen(true);
                    }}
                    onTogglePayment={() =>
                      requireAuth(
                        () =>
                          updateOrderMutation.mutate({
                            orderId: order.id,
                            data: { isPaid: !order.isPaid }
                          }),
                        {
                          type: 'UPDATE_ORDER_PAYMENT',
                          payload: { orderId: order.id, isPaid: !order.isPaid }
                        }
                      )
                    }
                    onEdit={() =>
                      requireAuth(() => {
                        setEditingOrder(order);
                        setEditOrderForm({
                          items: order.items.map(item => ({
                            productId: item.product.id,
                            quantity: item.quantity
                          }))
                        });
                        setIsEditOrderModalOpen(true);
                      })
                    }
                    onDelete={() => {
                      if (confirm('Tem certeza que deseja remover este pedido?')) {
                        deleteOrderMutation.mutate(order.id);
                      }
                    }}
                  />
                ))}
              </div>

              {/* Desktop: Table */}
              <Card className="hidden md:block">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr>
                        <th
                          className="px-4 py-3 text-left text-sm font-medium text-gray-900 cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => handleSort('isPaid')}
                        >
                          <div className="flex items-center gap-2">
                            <span>Status</span>
                            {renderSortIcon('isPaid')}
                          </div>
                        </th>
                        <th
                          className="px-4 py-3 text-left text-sm font-medium text-gray-900 cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => handleSort('customerName')}
                        >
                          <div className="flex items-center gap-2">
                            <span>Pessoa</span>
                            {renderSortIcon('customerName')}
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Produtos</th>
                        <th
                          className="px-4 py-3 text-right text-sm font-medium text-gray-900 cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => handleSort('subtotal')}
                        >
                          <div className="flex items-center justify-end gap-2">
                            <span>Subtotal</span>
                            {renderSortIcon('subtotal')}
                          </div>
                        </th>
                        <th
                          className="px-4 py-3 text-right text-sm font-medium text-gray-900 cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => handleSort('shippingFee')}
                        >
                          <div className="flex items-center justify-end gap-2">
                            <span>Frete</span>
                            {renderSortIcon('shippingFee')}
                          </div>
                        </th>
                        <th
                          className="px-4 py-3 text-right text-sm font-medium text-gray-900 cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => handleSort('total')}
                        >
                          <div className="flex items-center justify-end gap-2">
                            <span>Total</span>
                            {renderSortIcon('total')}
                          </div>
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredOrders?.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${order.isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>
                              {order.isPaid ? 'Pago' : 'Pendente'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{getCustomerDisplayName(order)}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {order.items.map(item => `${item.quantity}x ${item.product.name}`).join(', ')}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">{formatCurrency(order.subtotal)}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">{formatCurrency(order.shippingFee)}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">{formatCurrency(order.total)}</td>
                          <td className="px-4 py-3 text-sm text-right whitespace-nowrap">
                            <div className="flex gap-1 justify-end">
                              <IconButton
                                size="sm"
                                variant="secondary"
                                icon={<Eye className="w-5 h-5" />}
                                onClick={() => {
                                  setViewingOrder(order);
                                  setIsViewOrderModalOpen(true);
                                }}
                                title="Visualizar pedido"
                              />
                              {canEditCampaign && (
                                <IconButton
                                  size="sm"
                                  variant={order.isPaid ? 'success' : 'secondary'}
                                  icon={<CircleDollarSign className="w-5 h-5" />}
                                  onClick={() =>
                                    requireAuth(
                                      () =>
                                        updateOrderMutation.mutate({
                                          orderId: order.id,
                                          data: { isPaid: !order.isPaid }
                                        }),
                                      {
                                        type: 'UPDATE_ORDER_PAYMENT',
                                        payload: { orderId: order.id, isPaid: !order.isPaid }
                                      }
                                    )
                                  }
                                  title={order.isPaid ? 'Marcar como não pago' : 'Marcar como pago'}
                                />
                              )}
                              {isActive && (user?.id === order.userId || canEditCampaign) && (
                                <IconButton
                                  size="sm"
                                  variant="secondary"
                                  icon={<Edit className="w-4 h-4" />}
                                  onClick={() =>
                                    requireAuth(
                                      () => openEditOrderModal(order),
                                      {
                                        type: 'EDIT_ORDER',
                                        payload: {
                                          orderId: order.id,
                                          campaignId: id!
                                        }
                                      }
                                    )
                                  }
                                  title="Editar pedido"
                                />
                              )}
                              {isActive && canEditCampaign && (
                                <IconButton
                                  size="sm"
                                  variant="danger"
                                  icon={<Trash2 className="w-4 h-4" />}
                                  onClick={() => {
                                    if (confirm('Tem certeza que deseja remover este pedido?')) {
                                      deleteOrderMutation.mutate(order.id);
                                    }
                                  }}
                                  title="Remover pedido"
                                />
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}
        </div>
      )}

      {activeTab === 'shipping' && (
        <div className="pb-20 md:pb-0">
          <div className="max-w-2xl mx-auto">
            <Card>
              <div className="text-center mb-6">
                <Truck className="w-16 h-16 mx-auto text-primary-600 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Frete Total da Campanha</h2>
                <p className="text-gray-600">
                  O frete será distribuído proporcionalmente ao peso de cada pedido
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 mb-6 text-center">
                <div className="text-sm text-gray-500 mb-2">Valor Total do Frete</div>
                <div className="text-4xl font-bold text-gray-900 mb-4">
                  {formatCurrency(campaign.shippingCost)}
                </div>
                {isActive && canEditCampaign && (
                  <IconButton
                    icon={<Edit className="w-4 h-4" />}
                    onClick={() => {
                      setShippingCost(campaign.shippingCost);
                      setIsShippingModalOpen(true);
                    }}
                  >
                    Editar Frete
                  </IconButton>
                )}
              </div>

              <div className="space-y-4">
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Como funciona a distribuição?</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start">
                      <span className="inline-block w-1.5 h-1.5 bg-primary-600 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                      <span>O frete é calculado com base no peso total de cada pedido</span>
                    </li>
                    <li className="flex items-start">
                      <span className="inline-block w-1.5 h-1.5 bg-primary-600 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                      <span>Pedidos mais pesados pagam proporcionalmente mais frete</span>
                    </li>
                    <li className="flex items-start">
                      <span className="inline-block w-1.5 h-1.5 bg-primary-600 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                      <span>A distribuição é recalculada automaticamente quando há mudanças nos pedidos</span>
                    </li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}


      {/* Modal: Adicionar Produto */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title="Adicionar Produto"
      >
        <form onSubmit={handleCreateProduct} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Produto *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={productForm.name}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preço (R$) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={productForm.price}
              onChange={(e) => setProductForm({ ...productForm, price: e.target.value === '' ? '' : parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Peso (gramas) *
            </label>
            <input
              type="number"
              step="1"
              min="0"
              required
              value={productForm.weight}
              onChange={(e) => setProductForm({ ...productForm, weight: e.target.value === '' ? '' : parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={createProductMutation.isPending} className="flex-1 whitespace-nowrap">
              {createProductMutation.isPending ? 'Adicionando...' : 'Adicionar'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsProductModalOpen(false)}
              className="whitespace-nowrap"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Editar Produto */}
      <Modal
        isOpen={isEditProductModalOpen}
        onClose={() => {
          setIsEditProductModalOpen(false);
          setEditingProduct(null);
        }}
        title="Editar Produto"
      >
        <form onSubmit={handleEditProduct} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Produto *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={editProductForm.name}
              onChange={(e) => setEditProductForm({ ...editProductForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preço (R$) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={editProductForm.price}
              onChange={(e) => setEditProductForm({ ...editProductForm, price: e.target.value === '' ? '' : parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Peso (gramas) *
            </label>
            <input
              type="number"
              step="1"
              min="0"
              required
              value={editProductForm.weight}
              onChange={(e) => setEditProductForm({ ...editProductForm, weight: e.target.value === '' ? '' : parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={updateProductMutation.isPending} className="flex-1 whitespace-nowrap">
              {updateProductMutation.isPending ? 'Atualizando...' : 'Atualizar'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsEditProductModalOpen(false);
                setEditingProduct(null);
              }}
              className="whitespace-nowrap"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Novo Pedido */}
      <Modal
        isOpen={isOrderModalOpen}
        onClose={handleCloseOrderModal}
        title="Novo Pedido"
      >
        <div className="space-y-4">
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Atalho:</strong> Alt+P para adicionar produto
            </p>
            {createOrderMutation.isPending && (
              <p className="text-sm text-blue-600 mt-2 flex items-center gap-2">
                <span className="animate-spin">⏳</span> Salvando automaticamente...
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Produtos *
            </label>
            {orderForm.items.map((item, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <select
                  required
                  value={item.productId}
                  onChange={(e) => {
                    const newItems = [...orderForm.items];
                    newItems[index].productId = e.target.value;
                    setOrderForm({ ...orderForm, items: newItems });
                  }}
                  className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Selecione um produto</option>
                  {alphabeticalProducts?.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - {formatCurrency(product.price)}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  required
                  value={item.quantity}
                  onChange={(e) => {
                    const newItems = [...orderForm.items];
                    newItems[index].quantity = e.target.value === '' ? '' : parseInt(e.target.value);
                    setOrderForm({ ...orderForm, items: newItems });
                  }}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Qtd"
                />
                {orderForm.items.length > 1 && (
                  <IconButton
                    type="button"
                    variant="danger"
                    size="sm"
                    icon={<Trash2 className="w-4 h-4" />}
                    onClick={() => {
                      const newItems = orderForm.items.filter((_, i) => i !== index);
                      setOrderForm({ ...orderForm, items: newItems });
                    }}
                  />
                )}
              </div>
            ))}
            <IconButton
              type="button"
              variant="secondary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => {
                setOrderForm({
                  ...orderForm,
                  items: [...orderForm.items, { productId: '', quantity: 1 }]
                });
              }}
            >
              Adicionar Produto
            </IconButton>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseOrderModal}
              className="w-full whitespace-nowrap"
            >
              Fechar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Editar Frete */}
      <Modal
        isOpen={isShippingModalOpen}
        onClose={() => setIsShippingModalOpen(false)}
        title="Editar Frete Total"
      >
        <form onSubmit={handleUpdateShipping} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valor do Frete Total (R$)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              autoFocus
              value={shippingCost}
              onChange={(e) => setShippingCost(e.target.value === '' ? '' : parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-2">
              O frete será distribuído proporcionalmente ao peso de cada pedido.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={updateShippingMutation.isPending} className="flex-1 whitespace-nowrap">
              {updateShippingMutation.isPending ? 'Atualizando...' : 'Atualizar Frete'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsShippingModalOpen(false)}
              className="whitespace-nowrap"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Editar Pedido */}
      <Modal
        isOpen={isEditOrderModalOpen}
        onClose={() => {
          setIsEditOrderModalOpen(false);
          setEditingOrder(null);
        }}
        title="Editar Pedido"
      >
        <div className="space-y-4">
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Atalho:</strong> Alt+P para adicionar produto
            </p>
            {updateOrderWithItemsMutation.isPending && (
              <p className="text-sm text-blue-600 mt-2 flex items-center gap-2">
                <span className="animate-spin">⏳</span> Salvando automaticamente...
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Produtos *
            </label>
            {editOrderForm.items.map((item, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <select
                  required
                  value={item.productId}
                  onChange={(e) => {
                    const newItems = [...editOrderForm.items];
                    newItems[index].productId = e.target.value;
                    setEditOrderForm({ ...editOrderForm, items: newItems });
                  }}
                  className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Selecione um produto</option>
                  {alphabeticalProducts?.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - {formatCurrency(product.price)}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  required
                  value={item.quantity}
                  onChange={(e) => {
                    const newItems = [...editOrderForm.items];
                    newItems[index].quantity = e.target.value === '' ? '' : parseInt(e.target.value);
                    setEditOrderForm({ ...editOrderForm, items: newItems });
                  }}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Qtd"
                />
                {editOrderForm.items.length > 1 && (
                  <IconButton
                    type="button"
                    variant="danger"
                    size="sm"
                    icon={<Trash2 className="w-4 h-4" />}
                    onClick={() => {
                      const newItems = editOrderForm.items.filter((_, i) => i !== index);
                      setEditOrderForm({ ...editOrderForm, items: newItems });
                    }}
                  />
                )}
              </div>
            ))}
            <IconButton
              type="button"
              variant="secondary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => {
                setEditOrderForm({
                  ...editOrderForm,
                  items: [...editOrderForm.items, { productId: '', quantity: 1 }]
                });
              }}
            >
              Adicionar Produto
            </IconButton>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsEditOrderModalOpen(false);
                setEditingOrder(null);
              }}
              className="w-full whitespace-nowrap"
            >
              Fechar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Editar Data Limite */}
      <Modal
        isOpen={isEditDeadlineModalOpen}
        onClose={() => setIsEditDeadlineModalOpen(false)}
        title="Configurar Data Limite"
      >
        <form onSubmit={handleUpdateDeadline} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data e Hora Limite
            </label>
            <DateTimeInput
              value={deadlineForm}
              onChange={(value) => setDeadlineForm(value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              autoFocus
            />
            <p className="text-sm text-gray-500 mt-2">
              A campanha será fechada automaticamente quando atingir esta data. Formato: dd/mm/aaaa HH:mm (24h)
              {campaign?.deadline && ' Deixe em branco para remover a data limite.'}
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={updateDeadlineMutation.isPending} className="flex-1 whitespace-nowrap">
              {updateDeadlineMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
            {campaign?.deadline && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setDeadlineForm('');
                  updateDeadlineMutation.mutate(null);
                }}
                disabled={updateDeadlineMutation.isPending}
                className="whitespace-nowrap"
              >
                Remover
              </Button>
            )}
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsEditDeadlineModalOpen(false)}
              className="whitespace-nowrap"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Visualizar/Editar Pedido */}
      <Modal
        isOpen={isViewOrderModalOpen}
        onClose={() => {
          setIsViewOrderModalOpen(false);
          setViewingOrder(null);
        }}
        title="Detalhes do Pedido"
      >
        {viewingOrder && (
          <div className="space-y-4">
            {/* Informações do Pedido */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div>
                <span className="text-sm text-gray-500">Cliente</span>
                <p className="font-semibold text-gray-900">{viewingOrder.customerName}</p>
              </div>

              <div>
                <span className="text-sm text-gray-500">Status de Pagamento</span>
                <p className={`font-medium ${viewingOrder.isPaid ? 'text-green-600' : 'text-red-600'}`}>
                  {viewingOrder.isPaid ? 'Pago' : 'Pendente'}
                </p>
              </div>
            </div>

            {/* Produtos do Pedido */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Produtos</h4>
              <div className="border rounded-lg divide-y">
                {viewingOrder.items.map((item, index) => (
                  <div key={index} className="p-3 flex justify-between items-center">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.product.name}</p>
                      <p className="text-sm text-gray-500">
                        {item.quantity}x {formatCurrency(item.unitPrice)}
                      </p>
                    </div>
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(item.subtotal)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Resumo Financeiro */}
            <div className="bg-primary-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900">{formatCurrency(viewingOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Frete</span>
                <span className="font-medium text-gray-900">{formatCurrency(viewingOrder.shippingFee)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-primary-200">
                <span className="text-gray-900">Total</span>
                <span className="text-primary-600">{formatCurrency(viewingOrder.total)}</span>
              </div>
            </div>

            {/* Chat */}
            <div>
              <OrderChat orderId={viewingOrder.id} />
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-3 pt-4">
              {isActive && (user?.id === viewingOrder.userId || canEditCampaign) && (
                <Button
                  onClick={() =>
                    requireAuth(
                      () => openEditOrderModal(viewingOrder),
                      {
                        type: 'EDIT_ORDER',
                        payload: {
                          orderId: viewingOrder.id,
                          campaignId: id!
                        }
                      }
                    )
                  }
                  className="flex-1 gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Editar Pedido
                </Button>
              )}
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsViewOrderModalOpen(false);
                  setViewingOrder(null);
                }}
                className="flex-1"
              >
                Fechar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Diálogo de Confirmação: Fechar Campanha */}
      <ConfirmDialog
        isOpen={isCloseConfirmOpen}
        onClose={() => setIsCloseConfirmOpen(false)}
        onConfirm={() => updateStatusMutation.mutate('CLOSED')}
        title="Fechar Campanha"
        message="Tem certeza que deseja fechar esta campanha? Ninguém poderá adicionar ou alterar pedidos/produtos enquanto a campanha estiver fechada."
        confirmText="Fechar Campanha"
        cancelText="Cancelar"
        variant="warning"
      />

      {/* Diálogo de Confirmação: Reabrir Campanha */}
      <ConfirmDialog
        isOpen={isReopenConfirmOpen}
        onClose={() => setIsReopenConfirmOpen(false)}
        onConfirm={async () => {
          try {
            // Primeiro reseta a data limite
            await campaignApi.update(id!, { deadline: undefined });
            // Depois reabre a campanha
            await campaignApi.updateStatus(id!, 'ACTIVE');
            queryClient.invalidateQueries({ queryKey: ['campaign', id] });
            toast.success('Campanha reaberta e data limite resetada!');
            setIsReopenConfirmOpen(false);
          } catch (error: any) {
            toast.error(error.response?.data?.message || 'Erro ao reabrir campanha');
          }
        }}
        title="Reabrir Campanha"
        message="Deseja reabrir esta campanha? Será possível adicionar e alterar pedidos e produtos novamente. A data limite será resetada."
        confirmText="Reabrir"
        cancelText="Cancelar"
        variant="info"
      />

      {/* Diálogo de Confirmação: Marcar como Enviado */}
      <ConfirmDialog
        isOpen={isSentConfirmOpen}
        onClose={() => setIsSentConfirmOpen(false)}
        onConfirm={() => updateStatusMutation.mutate('SENT')}
        title="Marcar como Enviado"
        message="Deseja marcar esta campanha como enviada? Esta ação indica que os produtos foram despachados."
        confirmText="Marcar como Enviado"
        cancelText="Cancelar"
        variant="info"
      />
    </div>
  );
}
