import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  campaignApi,
  productApi,
  orderApi,
  analyticsApi,
  Order,
  Product,
} from '@/api';
import { useAuth } from '@/contexts/AuthContext';
import { removeMask, applyPixMask } from '@/lib/pixMasks';

interface ProductForm {
  campaignId: string;
  name: string;
  price: string;
  weight: string;
  imageUrl?: string;
}

interface OrderForm {
  campaignId: string;
  items: Array<{ productId: string; quantity: number }>;
}

type SortField =
  | 'customerName'
  | 'subtotal'
  | 'shippingFee'
  | 'total'
  | 'isPaid';
type SortDirection = 'asc' | 'desc';
type ProductSortField = 'name' | 'price' | 'weight';

export function useCampaignDetailBySlug(slug: string) {
  const { user, requireAuth } = useAuth();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();

  // Modal states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false);
  const [isEditOrderModalOpen, setIsEditOrderModalOpen] = useState(false);
  const [isViewOrderModalOpen, setIsViewOrderModalOpen] = useState(false);
  const [isShippingModalOpen, setIsShippingModalOpen] = useState(false);
  const [isEditDeadlineModalOpen, setIsEditDeadlineModalOpen] = useState(false);
  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState(false);
  const [isReopenConfirmOpen, setIsReopenConfirmOpen] = useState(false);
  const [isSentConfirmOpen, setIsSentConfirmOpen] = useState(false);
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const [isImageUploadModalOpen, setIsImageUploadModalOpen] = useState(false);
  const [isPixModalOpen, setIsPixModalOpen] = useState(false);
  const [isPaymentProofModalOpen, setIsPaymentProofModalOpen] = useState(false);

  // Editing states
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [orderForPayment, setOrderForPayment] = useState<Order | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Flag para indicar se a mutação foi disparada pelo botão "Pedir"
  const isAddingFromButtonRef = useRef(false);

  // Ref para rastrear a primeira renderização do modal de edição
  const isFirstEditRenderRef = useRef(true);

  // Ref para o timer de debounce do autosave
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Ref para indicar se está fazendo autosave
  const isAutosavingRef = useRef(false);

  // Estados para indicador visual de autosave
  const [isAutosaving, setIsAutosaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Form states
  const [productForm, setProductForm] = useState<ProductForm>({
    campaignId: '',
    name: '',
    price: '',
    weight: '',
    imageUrl: '',
  });

  const [editProductForm, setEditProductForm] = useState({
    name: '',
    price: '',
    weight: '',
    imageUrl: '',
  });

  const [editOrderForm, setEditOrderForm] = useState<OrderForm>({
    campaignId: '',
    items: [],
  });

  const [shippingCost, setShippingCost] = useState('');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [pixType, setPixType] = useState<'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM'>('CPF');

  // Order search and sorting
  const [orderSearch, setOrderSearch] = useState('');
  const [orderSortField, setOrderSortField] = useState<SortField>('customerName');
  const [orderSortDirection, setOrderSortDirection] = useState<SortDirection>('asc');

  // Product sorting
  const [productSortField, setProductSortField] = useState<ProductSortField>('name');
  const [productSortDirection, setProductSortDirection] = useState<SortDirection>('asc');

  // Questions tab state
  const [shouldOpenQuestionsTab, setShouldOpenQuestionsTab] = useState(false);

  // Check for openQuestions query param
  useEffect(() => {
    if (searchParams?.get('openQuestions') === 'true') {
      setShouldOpenQuestionsTab(true);
    }
  }, [searchParams]);

  // Queries
  const { data: campaign } = useQuery({
    queryKey: ['campaign', slug],
    queryFn: () => campaignApi.getBySlug(slug!),
    enabled: !!slug,
  });

  const { data: products } = useQuery({
    queryKey: ['products', campaign?.id],
    queryFn: () => productApi.getByCampaign(campaign!.id),
    enabled: !!campaign?.id,
  });

  const { data: orders } = useQuery({
    queryKey: ['orders', campaign?.id],
    queryFn: () => orderApi.getByCampaign(campaign!.id),
    enabled: !!campaign?.id,
  });

  const { data: analytics } = useQuery({
    queryKey: ['analytics', campaign?.id],
    queryFn: () => analyticsApi.getByCampaign(campaign!.id),
    enabled: !!campaign?.id,
  });

  // Derived state
  const isActive = campaign?.status === 'ACTIVE';
  const canEditCampaign = user?.id === campaign?.creatorId;

  // Initialize form when campaign loads
  useEffect(() => {
    if (campaign) {
      setProductForm((prev) => ({ ...prev, campaignId: campaign.id }));
      setEditOrderForm((prev) => ({ ...prev, campaignId: campaign.id }));
      setShippingCost(String(campaign.shippingCost || 0));
      if (campaign.deadline) {
        const date = new Date(campaign.deadline);
        setDeadlineDate(date.toISOString().slice(0, 16));
      }
      if (campaign.pixKey) {
        setPixKey(applyPixMask(campaign.pixKey, campaign.pixType as any));
        setPixType(campaign.pixType as any);
      }
    }
  }, [campaign]);

  // Filtered and sorted orders
  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    let filtered = [...orders];
    if (orderSearch) {
      const searchLower = orderSearch.toLowerCase();
      filtered = filtered.filter((order) =>
        order.customer.name?.toLowerCase().includes(searchLower)
      );
    }
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (orderSortField) {
        case 'customerName':
          comparison = (a.customer.name || '').localeCompare(b.customer.name || '');
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
          comparison = (a.isPaid ? 1 : 0) - (b.isPaid ? 1 : 0);
          break;
      }
      return orderSortDirection === 'asc' ? comparison : -comparison;
    });
    return filtered;
  }, [orders, orderSearch, orderSortField, orderSortDirection]);

  // Sorted products
  const sortedProducts = useMemo(() => {
    if (!products) return [];
    const sorted = [...products];
    sorted.sort((a, b) => {
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
    return sorted;
  }, [products, productSortField, productSortDirection]);

  // Mutations
  const createProductMutation = useMutation({
    mutationFn: productApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', campaign?.id] });
      queryClient.invalidateQueries({ queryKey: ['campaign', slug] });
      setIsProductModalOpen(false);
      setProductForm({
        campaignId: campaign?.id || '',
        name: '',
        price: '',
        weight: '',
        imageUrl: '',
      });
      toast.success('Produto criado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao criar produto');
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      productApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', campaign?.id] });
      queryClient.invalidateQueries({ queryKey: ['orders', campaign?.id] });
      queryClient.invalidateQueries({ queryKey: ['analytics', campaign?.id] });

      if (isAutosavingRef.current) {
        setIsAutosaving(false);
        setLastSaved(new Date());
      } else {
        setIsEditProductModalOpen(false);
        setEditingProduct(null);
        toast.success('Produto atualizado com sucesso!');
      }
    },
    onError: (error: any) => {
      setIsAutosaving(false);
      toast.error(error.response?.data?.message || 'Erro ao atualizar produto');
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: productApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', campaign?.id] });
      queryClient.invalidateQueries({ queryKey: ['orders', campaign?.id] });
      queryClient.invalidateQueries({ queryKey: ['analytics', campaign?.id] });
      toast.success('Produto excluído com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao excluir produto');
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: orderApi.create,
    onSuccess: (newOrder) => {
      queryClient.invalidateQueries({ queryKey: ['orders', campaign?.id] });
      queryClient.invalidateQueries({ queryKey: ['analytics', campaign?.id] });

      if (isAddingFromButtonRef.current) {
        isAddingFromButtonRef.current = false;
        toast.success('Pedido adicionado ao carrinho!');
      } else {
        setIsEditOrderModalOpen(false);
        setEditOrderForm({
          campaignId: campaign?.id || '',
          items: [],
        });
        toast.success('Pedido criado com sucesso!');
      }
    },
    onError: (error: any) => {
      isAddingFromButtonRef.current = false;
      toast.error(error.response?.data?.message || 'Erro ao criar pedido');
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      orderApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', campaign?.id] });
      queryClient.invalidateQueries({ queryKey: ['analytics', campaign?.id] });

      if (isAutosavingRef.current) {
        setIsAutosaving(false);
        setLastSaved(new Date());
      } else {
        setIsEditOrderModalOpen(false);
        setEditingOrder(null);
        toast.success('Pedido atualizado com sucesso!');
      }
    },
    onError: (error: any) => {
      setIsAutosaving(false);
      toast.error(error.response?.data?.message || 'Erro ao atualizar pedido');
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: orderApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', campaign?.id] });
      queryClient.invalidateQueries({ queryKey: ['analytics', campaign?.id] });
      toast.success('Pedido excluído com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao excluir pedido');
    },
  });

  const togglePaymentMutation = useMutation({
    mutationFn: ({ id, isPaid }: { id: string; isPaid: boolean }) =>
      orderApi.updatePayment(id, isPaid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', campaign?.id] });
      queryClient.invalidateQueries({ queryKey: ['analytics', campaign?.id] });
      queryClient.invalidateQueries({ queryKey: ['campaign', slug] });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Erro ao atualizar status de pagamento'
      );
    },
  });

  const updateCampaignMutation = useMutation({
    mutationFn: (data: any) => campaignApi.update(campaign!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', slug] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setIsShippingModalOpen(false);
      setIsEditDeadlineModalOpen(false);
      setIsPixModalOpen(false);
      toast.success('Campanha atualizada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao atualizar campanha');
    },
  });

  const cloneCampaignMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      campaignApi.clone(campaign!.id, data),
    onSuccess: (newCampaign) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setIsCloneModalOpen(false);
      toast.success('Campanha clonada com sucesso!');
      // Navigate to the new campaign
      window.location.href = `/campanhas/${newCampaign.slug}`;
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao clonar campanha');
    },
  });

  // Handler functions
  const handleCreateProduct = () => {
    createProductMutation.mutate({
      campaignId: campaign!.id,
      name: productForm.name,
      price: parseFloat(productForm.price),
      weight: parseFloat(productForm.weight),
    });
  };

  const handleUpdateProduct = (isAutosave = false) => {
    if (!editingProduct) return;

    if (isAutosave) {
      isAutosavingRef.current = true;
      setIsAutosaving(true);
    } else {
      isAutosavingRef.current = false;
    }

    updateProductMutation.mutate({
      id: editingProduct.id,
      data: {
        name: editProductForm.name,
        price: parseFloat(editProductForm.price),
        weight: parseFloat(editProductForm.weight),
        imageUrl: editProductForm.imageUrl || undefined,
      },
    });
  };

  const handleDeleteProduct = (productId: string) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      deleteProductMutation.mutate(productId);
    }
  };

  const handleAddOrder = () => {
    requireAuth(() => {
      setEditingOrder(null);
      setEditOrderForm({
        campaignId: campaign!.id,
        items: [],
      });
      setIsEditOrderModalOpen(true);
    });
  };

  const handleAddToOrder = (product: Product) => {
    requireAuth(() => {
      isAddingFromButtonRef.current = true;
      createOrderMutation.mutate({
        campaignId: campaign!.id,
        items: [{ productId: product.id, quantity: 1 }],
      });
    });
  };

  const handleCreateOrder = () => {
    createOrderMutation.mutate({
      campaignId: campaign!.id,
      items: editOrderForm.items,
    });
  };

  const handleUpdateOrder = (isAutosave = false) => {
    if (!editingOrder) return;

    if (isAutosave) {
      isAutosavingRef.current = true;
      setIsAutosaving(true);
    } else {
      isAutosavingRef.current = false;
    }

    updateOrderMutation.mutate({
      id: editingOrder.id,
      data: {
        items: editOrderForm.items,
      },
    });
  };

  const handleDeleteOrder = (orderId: string) => {
    if (confirm('Tem certeza que deseja excluir este pedido?')) {
      deleteOrderMutation.mutate(orderId);
    }
  };

  const handleTogglePayment = (order: Order) => {
    if (order.isPaid) {
      togglePaymentMutation.mutate({ id: order.id, isPaid: false });
    } else {
      setOrderForPayment(order);
      setIsPaymentProofModalOpen(true);
    }
  };

  const handleConfirmPayment = () => {
    if (!orderForPayment) return;
    togglePaymentMutation.mutate({ id: orderForPayment.id, isPaid: true });
    setIsPaymentProofModalOpen(false);
    setOrderForPayment(null);
    toast.success('Pagamento confirmado!');
  };

  const handleUpdateShipping = () => {
    updateCampaignMutation.mutate({
      shippingCost: parseFloat(shippingCost),
    });
  };

  const handleUpdateDeadline = () => {
    updateCampaignMutation.mutate({
      deadline: deadlineDate ? new Date(deadlineDate).toISOString() : null,
    });
  };

  const handleUpdatePix = () => {
    const cleanPixKey = removeMask(pixKey, pixType);
    updateCampaignMutation.mutate({
      pixKey: cleanPixKey,
      pixType,
    });
  };

  const handleUpdateCampaign = (data: any) => {
    updateCampaignMutation.mutate(data);
  };

  const handleCloseCampaign = () => {
    updateCampaignMutation.mutate({ status: 'CLOSED' });
    setIsCloseConfirmOpen(false);
  };

  const handleReopenCampaign = () => {
    updateCampaignMutation.mutate({ status: 'ACTIVE' });
    setIsReopenConfirmOpen(false);
  };

  const handleMarkAsSent = () => {
    updateCampaignMutation.mutate({ status: 'SENT' });
    setIsSentConfirmOpen(false);
  };

  const handleCloneCampaign = () => {
    if (!campaign) return;
    cloneCampaignMutation.mutate({
      name: `${campaign.name} (Cópia)`,
      description: campaign.description || undefined,
    });
  };

  const handleSort = (field: SortField) => {
    if (field === orderSortField) {
      setOrderSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setOrderSortField(field);
      setOrderSortDirection('asc');
    }
  };

  const handleProductSort = (field: ProductSortField) => {
    if (field === productSortField) {
      setProductSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setProductSortField(field);
      setProductSortDirection('asc');
    }
  };

  const openEditProductModal = (product: Product) => {
    setEditingProduct(product);
    setEditProductForm({
      name: product.name,
      price: String(product.price),
      weight: String(product.weight),
      imageUrl: '',
    });
    isFirstEditRenderRef.current = true;
    setIsEditProductModalOpen(true);
  };

  const openEditOrderModal = (order: Order) => {
    setEditingOrder(order);
    setEditOrderForm({
      campaignId: campaign!.id,
      items: order.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    });
    isFirstEditRenderRef.current = true;
    setIsEditOrderModalOpen(true);
  };

  const handleOpenEditDeadline = () => {
    if (campaign?.deadline) {
      const date = new Date(campaign.deadline);
      setDeadlineDate(date.toISOString().slice(0, 16));
    } else {
      setDeadlineDate('');
    }
    setIsEditDeadlineModalOpen(true);
  };

  const handleOpenPixModal = () => {
    if (campaign?.pixKey) {
      setPixKey(applyPixMask(campaign.pixKey, campaign.pixType as any));
      setPixType(campaign.pixType as any);
    } else {
      setPixKey('');
      setPixType('CPF');
    }
    setIsPixModalOpen(true);
  };

  const handleOpenCloneModal = () => {
    setIsCloneModalOpen(true);
  };

  // Autosave effect for edit product
  useEffect(() => {
    if (!isEditProductModalOpen || !editingProduct) return;
    if (isFirstEditRenderRef.current) {
      isFirstEditRenderRef.current = false;
      return;
    }

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(() => {
      handleUpdateProduct(true);
    }, 1000);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [editProductForm]);

  // Autosave effect for edit order
  useEffect(() => {
    if (!isEditOrderModalOpen || !editingOrder) return;
    if (isFirstEditRenderRef.current) {
      isFirstEditRenderRef.current = false;
      return;
    }

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(() => {
      handleUpdateOrder(true);
    }, 1000);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [editOrderForm]);

  return {
    // Data
    campaign,
    products,
    orders,
    analytics,
    filteredOrders,
    sortedProducts,

    // State
    isActive,
    canEditCampaign,

    // Modal states
    isProductModalOpen,
    setIsProductModalOpen,
    isEditProductModalOpen,
    setIsEditProductModalOpen,
    isEditOrderModalOpen,
    setIsEditOrderModalOpen,
    isViewOrderModalOpen,
    setIsViewOrderModalOpen,
    isShippingModalOpen,
    setIsShippingModalOpen,
    isEditDeadlineModalOpen,
    setIsEditDeadlineModalOpen,
    isCloseConfirmOpen,
    setIsCloseConfirmOpen,
    isReopenConfirmOpen,
    setIsReopenConfirmOpen,
    isSentConfirmOpen,
    setIsSentConfirmOpen,
    isCloneModalOpen,
    setIsCloneModalOpen,
    isImageUploadModalOpen,
    setIsImageUploadModalOpen,
    isPixModalOpen,
    setIsPixModalOpen,
    isPaymentProofModalOpen,
    setIsPaymentProofModalOpen,

    // Editing states
    viewingOrder,
    setViewingOrder,
    orderForPayment,
    setOrderForPayment,
    editingOrder,
    setEditingOrder,
    editingProduct,
    setEditingProduct,

    // Form states
    productForm,
    setProductForm,
    editProductForm,
    setEditProductForm,
    editOrderForm,
    setEditOrderForm,
    shippingCost,
    setShippingCost,
    deadlineDate,
    setDeadlineDate,
    pixKey,
    setPixKey,
    pixType,
    setPixType,

    // Search and sorting
    orderSearch,
    setOrderSearch,
    orderSortField,
    orderSortDirection,
    productSortField,
    productSortDirection,

    // Questions tab
    shouldOpenQuestionsTab,
    setShouldOpenQuestionsTab,

    // Autosave
    isAutosaving,
    lastSaved,

    // Handlers
    handleCreateProduct,
    handleUpdateProduct,
    handleDeleteProduct,
    handleAddOrder,
    handleAddToOrder,
    handleCreateOrder,
    handleUpdateOrder,
    handleDeleteOrder,
    handleTogglePayment,
    handleConfirmPayment,
    handleUpdateShipping,
    handleUpdateDeadline,
    handleUpdatePix,
    handleUpdateCampaign,
    handleCloseCampaign,
    handleReopenCampaign,
    handleMarkAsSent,
    handleCloneCampaign,
    handleSort,
    handleProductSort,
    openEditProductModal,
    openEditOrderModal,
    handleOpenEditDeadline,
    handleOpenPixModal,
    handleOpenCloneModal,

    // Mutations loading states
    isCreatingProduct: createProductMutation.isPending,
    isUpdatingProduct: updateProductMutation.isPending,
    isDeletingProduct: deleteProductMutation.isPending,
    isCreatingOrder: createOrderMutation.isPending,
    isUpdatingOrder: updateOrderMutation.isPending,
    isDeletingOrder: deleteOrderMutation.isPending,
    isTogglingPayment: togglePaymentMutation.isPending,
    isUpdatingCampaign: updateCampaignMutation.isPending,
    isCloningCampaign: cloneCampaignMutation.isPending,
  };
}
