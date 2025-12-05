import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { campaignApi, productApi, orderApi, analyticsApi, Order, Product } from '@/api';
import { useAuth } from '@/contexts/AuthContext';

interface ProductForm {
  campaignId: string;
  name: string;
  price: number;
  weight: number;
  imageUrl?: string;
}

interface OrderForm {
  campaignId: string;
  customerName: string;
  items: Array<{ productId: string; quantity: number }>;
}

type SortField = 'customerName' | 'subtotal' | 'shippingFee' | 'total' | 'isPaid';
type SortDirection = 'asc' | 'desc';
type ProductSortField = 'name' | 'price' | 'weight';

export function useCampaignDetail() {
  const { id: campaignId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Modal states
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

  // Editing states
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form states
  const [productForm, setProductForm] = useState<ProductForm>({
    campaignId: campaignId || '',
    name: '',
    price: 0,
    weight: 0,
    imageUrl: ''
  });

  const [editProductForm, setEditProductForm] = useState({
    name: '',
    price: 0,
    weight: 0,
    imageUrl: ''
  });

  const [orderForm, setOrderForm] = useState<OrderForm>({
    campaignId: campaignId || '',
    customerName: '',
    items: []
  });

  const [editOrderForm, setEditOrderForm] = useState<OrderForm>({
    campaignId: campaignId || '',
    customerName: '',
    items: []
  });

  const [shippingCost, setShippingCost] = useState(0);
  const [deadlineForm, setDeadlineForm] = useState('');

  // Campaign inline edit states
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');

  // Search & Sort states
  const [orderSearch, setOrderSearch] = useState('');
  const [orderSortField, setOrderSortField] = useState<SortField>('customerName');
  const [orderSortDirection, setOrderSortDirection] = useState<SortDirection>('asc');
  const [productSortField, setProductSortField] = useState<ProductSortField>('name');
  const [productSortDirection, setProductSortDirection] = useState<SortDirection>('asc');

  // Queries
  const { data: campaign } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: () => campaignApi.getById(campaignId!),
    enabled: !!campaignId
  });

  const { data: products } = useQuery({
    queryKey: ['products', campaignId],
    queryFn: () => productApi.getByCampaign(campaignId!),
    enabled: !!campaignId
  });

  const { data: orders } = useQuery({
    queryKey: ['orders', campaignId],
    queryFn: () => orderApi.getByCampaign(campaignId!),
    enabled: !!campaignId
  });

  const { data: analytics } = useQuery({
    queryKey: ['analytics', campaignId],
    queryFn: () => analyticsApi.getByCampaign(campaignId!),
    enabled: !!campaignId
  });

  // Computed states
  const isActive = campaign?.status === 'ACTIVE';
  const isClosed = campaign?.status === 'CLOSED';
  const isSent = campaign?.status === 'SENT';
  const canEditCampaign = campaign?.creatorId === user?.id;

  // Sorted & filtered data
  const sortedProducts = useMemo(() => {
    if (!products) return [];
    return [...products].sort((a, b) => {
      const aVal = a[productSortField];
      const bVal = b[productSortField];
      const modifier = productSortDirection === 'asc' ? 1 : -1;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return aVal.localeCompare(bVal) * modifier;
      }
      return ((aVal as number) - (bVal as number)) * modifier;
    });
  }, [products, productSortField, productSortDirection]);

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    let filtered = orders;
    if (orderSearch) {
      filtered = filtered.filter(order =>
        order.customerName?.toLowerCase().includes(orderSearch.toLowerCase())
      );
    }
    return [...filtered].sort((a, b) => {
      const aVal = a[orderSortField];
      const bVal = b[orderSortField];
      const modifier = orderSortDirection === 'asc' ? 1 : -1;
      if (typeof aVal === 'boolean') {
        return (aVal === bVal ? 0 : aVal ? -1 : 1) * modifier;
      }
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return aVal.localeCompare(bVal) * modifier;
      }
      return ((aVal as number) - (bVal as number)) * modifier;
    });
  }, [orders, orderSearch, orderSortField, orderSortDirection]);

  const alphabeticalProducts = useMemo(() => {
    if (!products) return [];
    return [...products].sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  // Mutations
  const createProductMutation = useMutation({
    mutationFn: productApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', campaignId] });
      toast.success('Produto adicionado!');
      setIsProductModalOpen(false);
      setProductForm({ campaignId: campaignId || '', name: '', price: 0, weight: 0, imageUrl: '' });
    },
    onError: () => toast.error('Erro ao adicionar produto')
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ productId, data }: { productId: string; data: Partial<Product> }) =>
      productApi.update(productId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['orders', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['analytics', campaignId] });
      toast.success('Produto atualizado!');
      setIsEditProductModalOpen(false);
      setEditingProduct(null);
    },
    onError: () => toast.error('Erro ao atualizar produto')
  });

  const deleteProductMutation = useMutation({
    mutationFn: productApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', campaignId] });
      toast.success('Produto removido!');
    },
    onError: () => toast.error('Erro ao remover produto')
  });

  const createOrderMutation = useMutation({
    mutationFn: orderApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['analytics', campaignId] });
      toast.success('Pedido criado!');
      setIsOrderModalOpen(false);
      setOrderForm({ campaignId: campaignId || '', customerName: '', items: [] });
    },
    onError: () => toast.error('Erro ao criar pedido')
  });

  const updateOrderWithItemsMutation = useMutation({
    mutationFn: ({ orderId, data }: {
      orderId: string;
      data: { items?: Array<{ productId: string; quantity: number }> }
    }) => orderApi.updateWithItems(orderId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['analytics', campaignId] });
      toast.success('Pedido atualizado!');
      setIsEditOrderModalOpen(false);
      setEditingOrder(null);
    },
    onError: () => toast.error('Erro ao atualizar pedido')
  });

  const deleteOrderMutation = useMutation({
    mutationFn: orderApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['analytics', campaignId] });
      toast.success('Pedido removido!');
    },
    onError: () => toast.error('Erro ao remover pedido')
  });

  const updateShippingMutation = useMutation({
    mutationFn: (cost: number) => campaignApi.update(campaignId!, { shippingCost: cost }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['orders', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['analytics', campaignId] });
      toast.success('Frete atualizado!');
      setIsShippingModalOpen(false);
    },
    onError: () => toast.error('Erro ao atualizar frete')
  });

  const updateDeadlineMutation = useMutation({
    mutationFn: (deadline: string | null) => campaignApi.update(campaignId!, { deadline: deadline || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
      toast.success('Data limite atualizada!');
      setIsEditDeadlineModalOpen(false);
    },
    onError: () => toast.error('Erro ao atualizar data limite')
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: 'ACTIVE' | 'CLOSED' | 'SENT' | 'ARCHIVED') =>
      campaignApi.updateStatus(campaignId!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
      toast.success('Status atualizado!');
      setIsCloseConfirmOpen(false);
      setIsReopenConfirmOpen(false);
      setIsSentConfirmOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao atualizar status');
    }
  });

  const updateCampaignMutation = useMutation({
    mutationFn: (data: { name?: string; description?: string }) =>
      campaignApi.update(campaignId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
      toast.success('Campanha atualizada!');
    },
    onError: () => toast.error('Erro ao atualizar campanha')
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ orderId, data }: { orderId: string; data: Partial<Order> }) =>
      orderApi.update(orderId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['analytics', campaignId] });
      toast.success('Pedido atualizado!');
    },
    onError: () => toast.error('Erro ao atualizar pedido')
  });

  // Handlers
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    createProductMutation.mutate(productForm);
  };

  const handleEditProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    updateProductMutation.mutate({
      productId: editingProduct.id,
      data: editProductForm
    });
  };

  const openEditProductModal = (product: Product) => {
    setEditingProduct(product);
    setEditProductForm({
      name: product.name,
      price: product.price,
      weight: product.weight,
      imageUrl: ''
    });
    setIsEditProductModalOpen(true);
  };

  const handleDeleteProduct = (productId: string) => {
    if (window.confirm('Tem certeza que deseja remover este produto?')) {
      deleteProductMutation.mutate(productId);
    }
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    createOrderMutation.mutate(orderForm);
  };

  const handleCloseOrderModal = () => {
    setIsOrderModalOpen(false);
    setOrderForm({ campaignId: campaignId || '', customerName: '', items: [] });
  };

  const loadExistingOrder = () => {
    const existingOrder = orders?.find(o => o.userId === user?.id);
    if (existingOrder) {
      setOrderForm({
        campaignId: campaignId || '',
        customerName: existingOrder.customerName || existingOrder.customer.name,
        items: existingOrder.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        }))
      });
    }
  };

  const handleEditOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    updateOrderWithItemsMutation.mutate({
      orderId: editingOrder.id,
      data: {
        items: editOrderForm.items
      }
    });
  };

  const openEditOrderModal = (order: Order) => {
    setEditingOrder(order);
    setEditOrderForm({
      campaignId: campaignId || '',
      customerName: order.customerName || '',
      items: order.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      }))
    });
    setIsEditOrderModalOpen(true);
  };

  const handleDeleteOrder = (orderId: string) => {
    if (window.confirm('Tem certeza que deseja remover este pedido?')) {
      deleteOrderMutation.mutate(orderId);
    }
  };

  const handleUpdateShipping = (e: React.FormEvent) => {
    e.preventDefault();
    updateShippingMutation.mutate(shippingCost);
  };

  const handleUpdateDeadline = (e: React.FormEvent) => {
    e.preventDefault();
    updateDeadlineMutation.mutate(deadlineForm || null);
  };

  const handleUpdateStatus = (status: 'ACTIVE' | 'CLOSED' | 'SENT' | 'ARCHIVED') => {
    updateStatusMutation.mutate(status);
  };

  const handleUpdateCampaign = (data: { name?: string; description?: string }) => {
    updateCampaignMutation.mutate(data);
  };

  const handleNameClick = () => {
    if (canEditCampaign && campaign) {
      setEditedName(campaign.name);
      setIsEditingName(true);
    }
  };

  const handleNameSave = () => {
    if (editedName.trim() && editedName !== campaign?.name) {
      handleUpdateCampaign({ name: editedName.trim() });
    }
    setIsEditingName(false);
  };

  const handleNameCancel = () => {
    setIsEditingName(false);
    setEditedName('');
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      handleNameCancel();
    }
  };

  const handleDescriptionClick = () => {
    if (canEditCampaign && campaign) {
      setEditedDescription(campaign.description || '');
      setIsEditingDescription(true);
    }
  };

  const handleDescriptionSave = () => {
    if (editedDescription !== campaign?.description) {
      handleUpdateCampaign({ description: editedDescription });
    }
    setIsEditingDescription(false);
  };

  const handleDescriptionCancel = () => {
    setIsEditingDescription(false);
    setEditedDescription('');
  };

  const handleDescriptionKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleDescriptionCancel();
    }
  };

  const handleSort = (field: SortField) => {
    if (orderSortField === field) {
      setOrderSortDirection(orderSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setOrderSortField(field);
      setOrderSortDirection('asc');
    }
  };

  const handleProductSort = (field: ProductSortField) => {
    if (productSortField === field) {
      setProductSortDirection(productSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setProductSortField(field);
      setProductSortDirection('asc');
    }
  };

  const handleTogglePayment = (order: Order) => {
    updateOrderMutation.mutate({ orderId: order.id, data: { isPaid: !order.isPaid } });
  };

  const handleAddToOrder = (product: Product) => {
    const existingOrder = orders?.find(o => o.userId === user?.id);
    if (existingOrder) {
      const items = existingOrder.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      }));

      const existingItemIndex = items.findIndex(item => item.productId === product.id);
      if (existingItemIndex >= 0) {
        items[existingItemIndex].quantity++;
      } else {
        items.push({ productId: product.id, quantity: 1 });
      }

      updateOrderWithItemsMutation.mutate({
        orderId: existingOrder.id,
        data: { items }
      });
    }
  };

  const handleEditOrderFromView = () => {
    if (viewingOrder) {
      setIsViewOrderModalOpen(false);
      openEditOrderModal(viewingOrder);
    }
  };

  const handleReopenCampaign = () => {
    const hasOrders = orders && orders.length > 0;
    const newStatus = hasOrders ? 'CLOSED' : 'ACTIVE';
    handleUpdateStatus(newStatus);
  };

  const handleOpenEditDeadline = () => {
    setIsEditDeadlineModalOpen(true);
    if (campaign?.deadline) {
      const dt = new Date(campaign.deadline);
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
  };

  return {
    // Data
    campaign,
    products,
    orders,
    analytics,
    sortedProducts,
    filteredOrders,
    alphabeticalProducts,

    // Computed state
    isActive,
    isClosed,
    isSent,
    canEditCampaign,

    // Product Modal State
    isProductModalOpen,
    setIsProductModalOpen,
    productForm,
    setProductForm,
    isEditProductModalOpen,
    setIsEditProductModalOpen,
    editingProduct,
    editProductForm,
    setEditProductForm,

    // Order Modal State
    isOrderModalOpen,
    setIsOrderModalOpen,
    orderForm,
    setOrderForm,
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

    // Shipping Modal State
    isShippingModalOpen,
    setIsShippingModalOpen,
    shippingCost,
    setShippingCost,

    // Deadline Modal State
    isEditDeadlineModalOpen,
    setIsEditDeadlineModalOpen,
    deadlineForm,
    setDeadlineForm,

    // Confirm Dialog State
    isCloseConfirmOpen,
    setIsCloseConfirmOpen,
    isReopenConfirmOpen,
    setIsReopenConfirmOpen,
    isSentConfirmOpen,
    setIsSentConfirmOpen,

    // Campaign Inline Edit State
    isEditingName,
    setIsEditingName,
    editedName,
    setEditedName,
    isEditingDescription,
    setIsEditingDescription,
    editedDescription,
    setEditedDescription,

    // Search & Sort
    orderSearch,
    setOrderSearch,
    orderSortField,
    orderSortDirection,
    productSortField,
    productSortDirection,

    // Handlers
    handleCreateProduct,
    handleEditProduct,
    openEditProductModal,
    handleDeleteProduct,
    handleCreateOrder,
    handleCloseOrderModal,
    loadExistingOrder,
    handleEditOrder,
    openEditOrderModal,
    handleDeleteOrder,
    handleUpdateShipping,
    handleUpdateDeadline,
    handleUpdateStatus,
    handleUpdateCampaign,
    handleNameClick,
    handleNameSave,
    handleNameCancel,
    handleNameKeyDown,
    handleDescriptionClick,
    handleDescriptionSave,
    handleDescriptionCancel,
    handleDescriptionKeyDown,
    handleSort,
    handleProductSort,
    handleAddToOrder,
    handleTogglePayment,
    handleEditOrderFromView,
    handleReopenCampaign,
    handleOpenEditDeadline,

    // Mutations
    createProductMutation,
    updateProductMutation,
    updateShippingMutation,
    updateDeadlineMutation,
    updateStatusMutation,
    createOrderMutation,
    updateOrderWithItemsMutation,
  };
}
