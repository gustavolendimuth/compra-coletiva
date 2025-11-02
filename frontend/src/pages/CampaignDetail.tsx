import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
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

// Helper function para normalizar strings (remover acentos)
const normalizeString = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
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
    customerName: string;
    items: Array<{ productId: string; quantity: number | '' }>;
  }>({
    customerName: '',
    items: [{ productId: '', quantity: 1 }]
  });

  const [editOrderForm, setEditOrderForm] = useState<{
    customerName: string;
    items: Array<{ productId: string; quantity: number | '' }>;
  }>({
    customerName: '',
    items: [{ productId: '', quantity: 1 }]
  });

  const [shippingCost, setShippingCost] = useState<number | ''>(0);

  // Estados para autocomplete de nomes
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [showEditSuggestions, setShowEditSuggestions] = useState(false);
  const [selectedEditSuggestionIndex, setSelectedEditSuggestionIndex] = useState(-1);

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
      toast.success('Pedido criado!');
      setIsOrderModalOpen(false);
      setOrderForm({ customerName: '', items: [{ productId: '', quantity: 1 }] });
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
      data: { customerName?: string; items?: Array<{ productId: string; quantity: number }> }
    }) => orderApi.updateWithItems(orderId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', id] });
      queryClient.invalidateQueries({ queryKey: ['analytics', id] });
      toast.success('Pedido atualizado!');
      setIsEditOrderModalOpen(false);
      setEditingOrder(null);
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
      toast.success('Grupo atualizado!');
    },
    onError: () => toast.error('Erro ao atualizar grupo')
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

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar se já existe um pedido com o mesmo nome
    const existingOrder = orders?.find(
      order => order.customerName.toLowerCase().trim() === orderForm.customerName.toLowerCase().trim()
    );

    if (existingOrder) {
      toast.error(
        'Já existe um pedido para esta pessoa. Por favor, edite o pedido existente ao invés de criar um novo.',
        { duration: 5000 }
      );
      return;
    }

    const validItems = orderForm.items
      .filter((item): item is { productId: string; quantity: number } =>
        item.productId !== '' && typeof item.quantity === 'number' && item.quantity > 0
      );
    if (validItems.length === 0) {
      toast.error('Adicione pelo menos um produto ao pedido');
      return;
    }
    createOrderMutation.mutate({
      campaignId: id!,
      customerName: orderForm.customerName,
      items: validItems
    });
  };

  const handleUpdateShipping = (e: React.FormEvent) => {
    e.preventDefault();
    const cost = typeof shippingCost === 'number' ? shippingCost : 0;
    updateShippingMutation.mutate(cost);
  };

  const handleUpdateDeadline = (e: React.FormEvent) => {
    e.preventDefault();
    updateDeadlineMutation.mutate(deadlineForm || null);
  };

  const handleEditOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;

    // Validar se já existe outro pedido com o mesmo nome
    const existingOrder = orders?.find(
      order =>
        order.id !== editingOrder.id &&
        order.customerName.toLowerCase().trim() === editOrderForm.customerName.toLowerCase().trim()
    );

    if (existingOrder) {
      toast.error(
        'Já existe outro pedido para esta pessoa. Por favor, escolha um nome diferente ou edite o pedido existente.',
        { duration: 5000 }
      );
      return;
    }

    const validItems = editOrderForm.items
      .filter((item): item is { productId: string; quantity: number } =>
        item.productId !== '' && typeof item.quantity === 'number' && item.quantity > 0
      );
    if (validItems.length === 0) {
      toast.error('Adicione pelo menos um produto ao pedido');
      return;
    }

    updateOrderWithItemsMutation.mutate({
      orderId: editingOrder.id,
      data: {
        customerName: editOrderForm.customerName,
        items: validItems
      }
    });
  };

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
      normalizeString(order.customerName).includes(normalizeString(orderSearch))
    )
    .sort((a, b) => {
      let comparison = 0;

      switch (orderSortField) {
        case 'customerName':
          comparison = a.customerName.localeCompare(b.customerName);
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

      // Alt+N - Abrir modal de adicionar pedido (somente se grupo estiver ativo)
      if (e.altKey && e.key === 'n' && isActive && !isOrderModalOpen && !isEditOrderModalOpen) {
        e.preventDefault();
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
        <div className="mb-6">
          <Link to="/campaigns" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4">
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
                <div className="w-6 h-6 bg-gray-200 animate-pulse rounded mb-1" />
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
      <div className="mb-6">
        <Link to="/campaigns" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4">
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
              <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg font-medium ${new Date(campaign.deadline) < new Date()
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
              </div>
            )}
            {!campaign.deadline && isActive && (
              <IconButton
                size="sm"
                variant="secondary"
                icon={<Calendar className="w-4 h-4" />}
                onClick={() => {
                  setIsEditDeadlineModalOpen(true);
                  setDeadlineForm('');
                }}
              >
                Adicionar data limite
              </IconButton>
            )}
          </div>

          {/* Botões de Ação do Grupo */}
          <div className="flex flex-wrap gap-2">
            {orders && orders.length > 0 && (
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

            {isActive && (
              <IconButton
                size="sm"
                icon={<Lock className="w-4 h-4" />}
                onClick={() => setIsCloseConfirmOpen(true)}
                variant="warning"
                className="text-xs sm:text-sm whitespace-nowrap"
              >
                Fechar Grupo
              </IconButton>
            )}

            {isClosed && (
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

            {isSent && (
              <IconButton
                size="sm"
                icon={<Unlock className="w-4 h-4" />}
                onClick={() => setIsReopenConfirmOpen(true)}
                variant="warning"
                className="text-xs sm:text-sm whitespace-nowrap"
              >
                Reabrir Grupo
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
                {isClosed ? 'Grupo Fechado' : 'Grupo Enviado'}
              </h3>
              <p className={`text-sm ${isClosed ? 'text-yellow-800' : 'text-blue-800'
                }`}>
                {isClosed
                  ? 'Este grupo está fechado. Não é possível adicionar ou alterar produtos e pedidos.'
                  : 'Este grupo foi marcado como enviado. Não é possível adicionar ou alterar produtos e pedidos.'
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
            className={`flex flex-col items-center justify-center flex-1 py-3 px-1 transition-colors ${activeTab === 'overview'
              ? 'text-yellow-300 font-bold border-b-4 border-yellow-300'
              : 'text-white hover:text-yellow-200'
              }`}
          >
            <TrendingUp className="w-6 h-6 flex-shrink-0 mb-1" />
            <span className="text-xs font-medium">Geral</span>
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex flex-col items-center justify-center flex-1 py-3 px-1 transition-colors ${activeTab === 'orders'
              ? 'text-yellow-300 font-bold border-b-4 border-yellow-300'
              : 'text-white hover:text-yellow-200'
              }`}
          >
            <ShoppingBag className="w-6 h-6 flex-shrink-0 mb-1" />
            <span className="text-xs font-medium">Pedidos</span>
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`flex flex-col items-center justify-center flex-1 py-3 px-1 transition-colors ${activeTab === 'products'
              ? 'text-yellow-300 font-bold border-b-4 border-yellow-300'
              : 'text-white hover:text-yellow-200'
              }`}
          >
            <Package className="w-6 h-6 flex-shrink-0 mb-1" />
            <span className="text-xs font-medium">Produtos</span>
          </button>
          <button
            onClick={() => setActiveTab('shipping')}
            className={`flex flex-col items-center justify-center flex-1 py-3 px-1 transition-colors ${activeTab === 'shipping'
              ? 'text-yellow-300 font-bold border-b-4 border-yellow-300'
              : 'text-white hover:text-yellow-200'
              }`}
          >
            <Truck className="w-6 h-6 flex-shrink-0 mb-1" />
            <span className="text-xs font-medium">Frete</span>
          </button>
        </div>
      </div>

      {activeTab === 'overview' && analytics && (
        <div className="space-y-6 pb-20 md:pb-0">
          <div className="flex justify-between items-center mb-4 gap-2">
            <h2 className="text-2xl font-bold">Visão Geral</h2>
          </div>

          {/* Botões de Ação Principais */}
          {isActive && (
            <div className="flex gap-2 justify-center flex-wrap">
              <IconButton
                size="sm"
                icon={<Package className="w-4 h-4" />}
                onClick={() => setIsProductModalOpen(true)}
                className="text-xs sm:text-sm"
              >
                Adicionar Produto
              </IconButton>
              <IconButton
                size="sm"
                icon={<ShoppingBag className="w-4 h-4" />}
                onClick={() => setIsOrderModalOpen(true)}
                className="text-xs sm:text-sm"
                title="Adicionar Pedido (Alt+N)"
              >
                Adicionar Pedido
              </IconButton>
            </div>
          )}

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
                          onClick={() => {
                            // Verifica se o produto já está na lista
                            const productExists = orderForm.items.some(item => item.productId === product.id);

                            if (!productExists) {
                              // Adiciona o produto à lista existente, removendo campos vazios
                              setOrderForm({
                                ...orderForm,
                                items: [...orderForm.items.filter(item => item.productId !== ''), { productId: product.id, quantity: 1 }]
                              });
                            }

                            setIsOrderModalOpen(true);
                          }}
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <div className="text-sm text-gray-500 mb-1">Total de Pessoas</div>
                <div className="text-3xl font-bold text-gray-900">{analytics.byCustomer.length}</div>
              </Card>
              <Card>
                <div className="text-sm text-gray-500 mb-1">Total de Itens</div>
                <div className="text-3xl font-bold text-gray-900">{analytics.totalQuantity}</div>
              </Card>
              <Card>
                <div className="text-sm text-gray-500 mb-1">Total sem Frete</div>
                <div className="text-3xl font-bold text-gray-900">
                  {formatCurrency(analytics.totalWithoutShipping)}
                </div>
              </Card>
              <Card>
                <div className="text-sm text-gray-500 mb-1">Total com Frete</div>
                <div className="text-3xl font-bold text-gray-900">
                  {formatCurrency(analytics.totalWithShipping)}
                </div>
              </Card>
              <Card>
                <div className="text-sm text-gray-500 mb-1">Total Pago</div>
                <div className="text-3xl font-bold text-green-600">
                  {formatCurrency(analytics.totalPaid)}
                </div>
              </Card>
              <Card>
                <div className="text-sm text-gray-500 mb-1">Total Não Pago</div>
                <div className="text-3xl font-bold text-red-600">
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
                  .sort((a, b) => a.customerName.localeCompare(b.customerName))
                  .map((item, index) => {
                    // Encontrar o pedido correspondente à pessoa
                    const order = orders?.find(o => o.customerName === item.customerName);

                    return (
                      <div key={index} className="flex flex-col gap-2 md:flex-row md:justify-between md:items-center pb-3 border-b last:border-b-0 last:pb-0">
                        {/* Linha 1: Nome e Total */}
                        <div className="flex justify-between items-center gap-3 md:flex-1">
                          <span className="text-gray-900 font-medium flex-1 min-w-0">{item.customerName}</span>
                          <span className="font-semibold text-gray-900 whitespace-nowrap">
                            {formatCurrency(item.total)}
                          </span>
                        </div>

                        {/* Linha 2: Status e Ações */}
                        <div className="flex items-center justify-between gap-3 md:justify-end">
                          <span className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${item.isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                            {item.isPaid ? 'Pago' : 'Pendente'}
                          </span>

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
                                    updateOrderMutation.mutate({
                                      orderId: order.id,
                                      data: { isPaid: !item.isPaid }
                                    })
                                  }
                                  title={item.isPaid ? 'Marcar como não pago' : 'Marcar como pago'}
                                />
                              </>
                            )}
                          </div>
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
            {isActive && (
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
                        {isActive && (
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
                        {isActive && (
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
                          {isActive && (
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
                  onClick={() => setIsOrderModalOpen(true)}
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
                  <Card key={order.id} className="py-3">
                    <div className="flex flex-col gap-3">
                      {/* Linha 1: Nome, status e ações */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap flex-shrink-0 ${order.isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                            {order.isPaid ? 'Pago' : 'Pendente'}
                          </span>
                          <h3 className="font-semibold text-gray-900 truncate">{order.customerName}</h3>
                        </div>

                        {/* Ações */}
                        <div className="flex gap-1 flex-shrink-0">
                          <IconButton
                            size="sm"
                            variant={order.isPaid ? 'success' : 'secondary'}
                            icon={<CircleDollarSign className="w-5 h-5" />}
                            onClick={() =>
                              updateOrderMutation.mutate({
                                orderId: order.id,
                                data: { isPaid: !order.isPaid }
                              })
                            }
                            title={order.isPaid ? 'Marcar como não pago' : 'Marcar como pago'}
                          />
                          {isActive && (
                            <>
                              <IconButton
                                size="sm"
                                variant="secondary"
                                icon={<Edit className="w-4 h-4" />}
                                onClick={() => {
                                  setEditingOrder(order);
                                  setEditOrderForm({
                                    customerName: order.customerName,
                                    items: order.items.map(item => ({
                                      productId: item.product.id,
                                      quantity: item.quantity
                                    }))
                                  });
                                  setIsEditOrderModalOpen(true);
                                }}
                                title="Editar pedido"
                              />
                              <IconButton
                                size="sm"
                                variant="danger"
                                icon={<Trash2 className="w-4 h-4" />}
                                onClick={() => {
                                  if (confirm('Tem certeza que deseja remover este pedido?')) {
                                    deleteOrderMutation.mutate(order.id);
                                  }
                                }}
                              />
                            </>
                          )}
                        </div>
                      </div>

                      {/* Linha 2: Produtos (sempre visível, sem truncar) */}
                      <p className="text-xs text-gray-500">
                        {order.items.map(item => `${item.quantity}x ${item.product.name}`).join(', ')}
                      </p>

                      {/* Linha 3: Valores */}
                      <div className="flex items-center gap-3 text-sm justify-between sm:justify-start">
                        <div className="text-center sm:text-left">
                          <div className="text-gray-500 text-xs">Subtotal</div>
                          <div className="font-medium text-gray-900">{formatCurrency(order.subtotal)}</div>
                        </div>
                        <div className="text-center sm:text-left">
                          <div className="text-gray-500 text-xs">Frete</div>
                          <div className="font-medium text-gray-900">{formatCurrency(order.shippingFee)}</div>
                        </div>
                        <div className="text-center sm:text-left">
                          <div className="text-gray-500 text-xs">Total</div>
                          <div className="font-semibold text-gray-900">{formatCurrency(order.total)}</div>
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
                          <td className="px-4 py-3 text-sm text-gray-900">{order.customerName}</td>
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
                                variant={order.isPaid ? 'success' : 'secondary'}
                                icon={<CircleDollarSign className="w-5 h-5" />}
                                onClick={() =>
                                  updateOrderMutation.mutate({
                                    orderId: order.id,
                                    data: { isPaid: !order.isPaid }
                                  })
                                }
                                title={order.isPaid ? 'Marcar como não pago' : 'Marcar como pago'}
                              />
                              {isActive && (
                                <>
                                  <IconButton
                                    size="sm"
                                    variant="secondary"
                                    icon={<Edit className="w-4 h-4" />}
                                    onClick={() => {
                                      setEditingOrder(order);
                                      setEditOrderForm({
                                        customerName: order.customerName,
                                        items: order.items.map(item => ({
                                          productId: item.product.id,
                                          quantity: item.quantity
                                        }))
                                      });
                                      setIsEditOrderModalOpen(true);
                                    }}
                                    title="Editar pedido"
                                  />
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
                                </>
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
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Frete Total do Grupo</h2>
                <p className="text-gray-600">
                  O frete será distribuído proporcionalmente ao peso de cada pedido
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 mb-6 text-center">
                <div className="text-sm text-gray-500 mb-2">Valor Total do Frete</div>
                <div className="text-4xl font-bold text-gray-900 mb-4">
                  {formatCurrency(campaign.shippingCost)}
                </div>
                {isActive && (
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
        <form onSubmit={handleCreateOrder} className="space-y-4">
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Atalho:</strong> Alt+P para adicionar produto
            </p>
          </div>
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome e Sobrenome *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={orderForm.customerName}
              onChange={(e) => {
                setOrderForm({ ...orderForm, customerName: e.target.value });
                setShowSuggestions(true);
                setSelectedSuggestionIndex(-1);
              }}
              onKeyDown={(e) => {
                const normalizedInput = normalizeString(orderForm.customerName);
                const suggestions = orders
                  ?.map((order) => order.customerName)
                  .filter((name, index, self) => self.indexOf(name) === index)
                  .filter((name) => normalizeString(name).includes(normalizedInput))
                  .sort() || [];

                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setSelectedSuggestionIndex((prev) =>
                    prev < suggestions.length - 1 ? prev + 1 : prev
                  );
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : -1));
                } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
                  e.preventDefault();
                  setOrderForm({ ...orderForm, customerName: suggestions[selectedSuggestionIndex] });
                  setShowSuggestions(false);
                  setSelectedSuggestionIndex(-1);
                } else if (e.key === 'Escape') {
                  setShowSuggestions(false);
                  setSelectedSuggestionIndex(-1);
                }
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => {
                // Delay para permitir clique nas sugestões
                setTimeout(() => {
                  setShowSuggestions(false);
                  setSelectedSuggestionIndex(-1);
                }, 200);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              autoComplete="off"
            />
            {showSuggestions && orderForm.customerName.trim() && (() => {
              const normalizedInput = normalizeString(orderForm.customerName);
              const suggestions = orders
                ?.map((order) => order.customerName)
                .filter((name, index, self) => self.indexOf(name) === index)
                .filter((name) => normalizeString(name).includes(normalizedInput))
                .sort() || [];

              return suggestions.length > 0 ? (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {suggestions.map((name, index) => (
                    <div
                      key={name}
                      onClick={() => {
                        setOrderForm({ ...orderForm, customerName: name });
                        setShowSuggestions(false);
                        setSelectedSuggestionIndex(-1);
                      }}
                      className={`px-3 py-2 cursor-pointer transition-colors ${
                        index === selectedSuggestionIndex
                          ? 'bg-primary-50 text-primary-700'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      {name}
                    </div>
                  ))}
                </div>
              ) : null;
            })()}
            {orderForm.customerName.trim() && orders?.some(
              order => order.customerName.toLowerCase().trim() === orderForm.customerName.toLowerCase().trim()
            ) && (
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Pedido já existe para esta pessoa</p>
                  <p className="mt-1">Por favor, edite o pedido existente ao invés de criar um novo.</p>
                </div>
              </div>
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
            <Button type="submit" disabled={createOrderMutation.isPending} className="flex-1 whitespace-nowrap">
              {createOrderMutation.isPending ? 'Criando...' : 'Criar Pedido'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseOrderModal}
              className="whitespace-nowrap"
            >
              Cancelar
            </Button>
          </div>
        </form>
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
              required
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
        <form onSubmit={handleEditOrder} className="space-y-4">
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Atalho:</strong> Alt+P para adicionar produto
            </p>
          </div>
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome e Sobrenome *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={editOrderForm.customerName}
              onChange={(e) => {
                setEditOrderForm({ ...editOrderForm, customerName: e.target.value });
                setShowEditSuggestions(true);
                setSelectedEditSuggestionIndex(-1);
              }}
              onKeyDown={(e) => {
                const normalizedInput = normalizeString(editOrderForm.customerName);
                const suggestions = orders
                  ?.filter((order) => order.id !== editingOrder?.id)
                  .map((order) => order.customerName)
                  .filter((name, index, self) => self.indexOf(name) === index)
                  .filter((name) => normalizeString(name).includes(normalizedInput))
                  .sort() || [];

                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setSelectedEditSuggestionIndex((prev) =>
                    prev < suggestions.length - 1 ? prev + 1 : prev
                  );
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setSelectedEditSuggestionIndex((prev) => (prev > 0 ? prev - 1 : -1));
                } else if (e.key === 'Enter' && selectedEditSuggestionIndex >= 0) {
                  e.preventDefault();
                  setEditOrderForm({ ...editOrderForm, customerName: suggestions[selectedEditSuggestionIndex] });
                  setShowEditSuggestions(false);
                  setSelectedEditSuggestionIndex(-1);
                } else if (e.key === 'Escape') {
                  setShowEditSuggestions(false);
                  setSelectedEditSuggestionIndex(-1);
                }
              }}
              onFocus={() => setShowEditSuggestions(true)}
              onBlur={() => {
                // Delay para permitir clique nas sugestões
                setTimeout(() => {
                  setShowEditSuggestions(false);
                  setSelectedEditSuggestionIndex(-1);
                }, 200);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              autoComplete="off"
            />
            {showEditSuggestions && editOrderForm.customerName.trim() && (() => {
              const normalizedInput = normalizeString(editOrderForm.customerName);
              const suggestions = orders
                ?.filter((order) => order.id !== editingOrder?.id)
                .map((order) => order.customerName)
                .filter((name, index, self) => self.indexOf(name) === index)
                .filter((name) => normalizeString(name).includes(normalizedInput))
                .sort() || [];

              return suggestions.length > 0 ? (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {suggestions.map((name, index) => (
                    <div
                      key={name}
                      onClick={() => {
                        setEditOrderForm({ ...editOrderForm, customerName: name });
                        setShowEditSuggestions(false);
                        setSelectedEditSuggestionIndex(-1);
                      }}
                      className={`px-3 py-2 cursor-pointer transition-colors ${
                        index === selectedEditSuggestionIndex
                          ? 'bg-primary-50 text-primary-700'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      {name}
                    </div>
                  ))}
                </div>
              ) : null;
            })()}
            {editOrderForm.customerName.trim() && editingOrder && orders?.some(
              order =>
                order.id !== editingOrder.id &&
                order.customerName.toLowerCase().trim() === editOrderForm.customerName.toLowerCase().trim()
            ) && (
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Pedido já existe para esta pessoa</p>
                  <p className="mt-1">Já existe outro pedido com este nome. Por favor, escolha um nome diferente.</p>
                </div>
              </div>
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
            <Button type="submit" disabled={updateOrderWithItemsMutation.isPending} className="flex-1 whitespace-nowrap">
              {updateOrderWithItemsMutation.isPending ? 'Atualizando...' : 'Atualizar Pedido'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsEditOrderModalOpen(false);
                setEditingOrder(null);
              }}
              className="whitespace-nowrap"
            >
              Cancelar
            </Button>
          </div>
        </form>
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
              O grupo será fechado automaticamente quando atingir esta data. Formato: dd/mm/aaaa HH:mm (24h)
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

            {/* Botões de Ação */}
            <div className="flex gap-3 pt-4">
              {isActive && (
                <Button
                  onClick={() => {
                    setEditingOrder(viewingOrder);
                    setEditOrderForm({
                      customerName: viewingOrder.customerName,
                      items: viewingOrder.items.map(item => ({
                        productId: item.product.id,
                        quantity: item.quantity
                      }))
                    });
                    setIsViewOrderModalOpen(false);
                    setViewingOrder(null);
                    setIsEditOrderModalOpen(true);
                  }}
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
        title="Fechar Grupo"
        message="Tem certeza que deseja fechar este grupo? Ninguém poderá adicionar ou alterar pedidos/produtos enquanto o grupo estiver fechado."
        confirmText="Fechar Grupo"
        cancelText="Cancelar"
        variant="warning"
      />

      {/* Diálogo de Confirmação: Reabrir Grupo */}
      <ConfirmDialog
        isOpen={isReopenConfirmOpen}
        onClose={() => setIsReopenConfirmOpen(false)}
        onConfirm={() => updateStatusMutation.mutate('ACTIVE')}
        title="Reabrir Grupo"
        message="Deseja reabrir este grupo? Será possível adicionar e alterar pedidos e produtos novamente."
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
        message="Deseja marcar este grupo como enviado? Esta ação indica que os produtos foram despachados."
        confirmText="Marcar como Enviado"
        cancelText="Cancelar"
        variant="info"
      />
    </div>
  );
}
