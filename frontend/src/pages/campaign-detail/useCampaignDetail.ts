import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  campaignApi,
  productApi,
  orderApi,
  analyticsApi,
  Order,
  Product,
} from "@/api";
import { useAuth } from "@/contexts/AuthContext";

interface ProductForm {
  campaignId: string;
  name: string;
  price: string;
  weight: string;
  imageUrl?: string;
}

interface OrderForm {
  campaignId: string;
  customerName: string;
  items: Array<{ productId: string; quantity: number }>;
}

type SortField =
  | "customerName"
  | "subtotal"
  | "shippingFee"
  | "total"
  | "isPaid";
type SortDirection = "asc" | "desc";
type ProductSortField = "name" | "price" | "weight";

export function useCampaignDetail() {
  const { id: campaignId } = useParams<{ id: string }>();
  const { user, requireAuth } = useAuth();
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
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);

  // Editing states
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Flag para indicar se a mutação foi disparada pelo botão "Pedir"
  // Quando true, não fecha o modal automaticamente
  const isAddingFromButtonRef = useRef(false);

  // Form states
  const [productForm, setProductForm] = useState<ProductForm>({
    campaignId: campaignId || "",
    name: "",
    price: "",
    weight: "",
    imageUrl: "",
  });

  const [editProductForm, setEditProductForm] = useState({
    name: "",
    price: "",
    weight: "",
    imageUrl: "",
  });

  const [orderForm, setOrderForm] = useState<OrderForm>({
    campaignId: campaignId || "",
    customerName: "",
    items: [],
  });

  const [editOrderForm, setEditOrderForm] = useState<OrderForm>({
    campaignId: campaignId || "",
    customerName: "",
    items: [],
  });

  const [shippingCost, setShippingCost] = useState("");
  const [deadlineForm, setDeadlineForm] = useState("");
  const [cloneName, setCloneName] = useState("");
  const [cloneDescription, setCloneDescription] = useState("");

  // Campaign inline edit states
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState("");

  // Search & Sort states
  const [orderSearch, setOrderSearch] = useState("");
  const [orderSortField, setOrderSortField] =
    useState<SortField>("customerName");
  const [orderSortDirection, setOrderSortDirection] =
    useState<SortDirection>("asc");
  const [productSortField, setProductSortField] =
    useState<ProductSortField>("name");
  const [productSortDirection, setProductSortDirection] =
    useState<SortDirection>("asc");

  // Queries
  const { data: campaign } = useQuery({
    queryKey: ["campaign", campaignId],
    queryFn: () => campaignApi.getById(campaignId!),
    enabled: !!campaignId,
  });

  const { data: products } = useQuery({
    queryKey: ["products", campaignId],
    queryFn: () => productApi.getByCampaign(campaignId!),
    enabled: !!campaignId,
  });

  const { data: orders } = useQuery({
    queryKey: ["orders", campaignId],
    queryFn: () => orderApi.getByCampaign(campaignId!),
    enabled: !!campaignId,
  });

  const { data: analytics } = useQuery({
    queryKey: ["analytics", campaignId],
    queryFn: () => analyticsApi.getByCampaign(campaignId!),
    enabled: !!campaignId,
  });

  // Handle navigation from notifications
  const location = useLocation();
  const navigate = useNavigate();

  // State for handling navigation from notifications
  const [shouldOpenQuestionsTab, setShouldOpenQuestionsTab] = useState(false);

  useEffect(() => {
    const state = location.state as {
      openOrderChat?: boolean;
      orderId?: string;
      openQuestionsTab?: boolean;
    } | null;

    if (state?.openOrderChat && state?.orderId && orders) {
      // Find the order
      const order = orders.find((o) => o.id === state.orderId);

      if (order) {
        // Open the order modal
        setViewingOrder(order);
        setIsViewOrderModalOpen(true);

        // Clear the state to prevent reopening on refresh
        navigate(location.pathname, { replace: true, state: {} });
      }
    }

    if (state?.openQuestionsTab) {
      // Signal to open questions tab
      setShouldOpenQuestionsTab(true);

      // Clear the state to prevent reopening on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, orders, navigate, location.pathname]);

  // Computed states
  const isActive = campaign?.status === "ACTIVE";
  const isClosed = campaign?.status === "CLOSED";
  const isSent = campaign?.status === "SENT";
  const canEditCampaign = campaign?.creatorId === user?.id;

  // Sorted & filtered data
  const sortedProducts = useMemo(() => {
    if (!products) return [];
    return [...products].sort((a, b) => {
      const aVal = a[productSortField];
      const bVal = b[productSortField];
      const modifier = productSortDirection === "asc" ? 1 : -1;
      if (typeof aVal === "string" && typeof bVal === "string") {
        return aVal.localeCompare(bVal) * modifier;
      }
      return ((aVal as number) - (bVal as number)) * modifier;
    });
  }, [products, productSortField, productSortDirection]);

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    let filtered = orders;
    if (orderSearch) {
      filtered = filtered.filter((order) =>
        order.customerName?.toLowerCase().includes(orderSearch.toLowerCase())
      );
    }
    return [...filtered].sort((a, b) => {
      const aVal = a[orderSortField];
      const bVal = b[orderSortField];
      const modifier = orderSortDirection === "asc" ? 1 : -1;
      if (typeof aVal === "boolean") {
        return (aVal === bVal ? 0 : aVal ? -1 : 1) * modifier;
      }
      if (typeof aVal === "string" && typeof bVal === "string") {
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
      queryClient.invalidateQueries({ queryKey: ["products", campaignId] });
      toast.success("Produto adicionado!");
      setIsProductModalOpen(false);
      setProductForm({
        campaignId: campaignId || "",
        name: "",
        price: "",
        weight: "",
        imageUrl: "",
      });
    },
    onError: () => toast.error("Erro ao adicionar produto"),
  });

  const updateProductMutation = useMutation({
    mutationFn: ({
      productId,
      data,
    }: {
      productId: string;
      data: Partial<Product>;
    }) => productApi.update(productId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", campaignId] });
      queryClient.invalidateQueries({ queryKey: ["orders", campaignId] });
      queryClient.invalidateQueries({ queryKey: ["analytics", campaignId] });
      toast.success("Produto atualizado!");
      setIsEditProductModalOpen(false);
      setEditingProduct(null);
    },
    onError: () => toast.error("Erro ao atualizar produto"),
  });

  const deleteProductMutation = useMutation({
    mutationFn: productApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", campaignId] });
      toast.success("Produto removido!");
    },
    onError: () => toast.error("Erro ao remover produto"),
  });

  const createOrderMutation = useMutation({
    mutationFn: orderApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", campaignId] });
      queryClient.invalidateQueries({ queryKey: ["analytics", campaignId] });

      // Só limpa o formulário e fecha o modal se o modal estiver aberto
      // (ou seja, se foi criado manualmente via modal, não automaticamente)
      if (isOrderModalOpen) {
        toast.success("Pedido criado!");
        setIsOrderModalOpen(false);
        setOrderForm({
          campaignId: campaignId || "",
          customerName: "",
          items: [],
        });
      }
    },
    onError: () => toast.error("Erro ao criar pedido"),
  });

  const updateOrderWithItemsMutation = useMutation({
    mutationFn: ({
      orderId,
      data,
    }: {
      orderId: string;
      data: { items?: Array<{ productId: string; quantity: number }> };
    }) => orderApi.updateWithItems(orderId, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["orders", campaignId] });
      await queryClient.invalidateQueries({
        queryKey: ["analytics", campaignId],
      });

      // Só fecha o modal se foi uma edição manual (não veio do botão "Pedir")
      if (isEditOrderModalOpen && !isAddingFromButtonRef.current) {
        toast.success("Pedido atualizado!");
        setIsEditOrderModalOpen(false);
        setEditingOrder(null);
      }

      // Reseta a flag após processar
      isAddingFromButtonRef.current = false;
    },
    onError: () => {
      toast.error("Erro ao atualizar pedido");
      isAddingFromButtonRef.current = false;
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: orderApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", campaignId] });
      queryClient.invalidateQueries({ queryKey: ["analytics", campaignId] });
      toast.success("Pedido removido!");
    },
    onError: () => toast.error("Erro ao remover pedido"),
  });

  const updateShippingMutation = useMutation({
    mutationFn: (cost: number) =>
      campaignApi.update(campaignId!, { shippingCost: cost }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign", campaignId] });
      queryClient.invalidateQueries({ queryKey: ["orders", campaignId] });
      queryClient.invalidateQueries({ queryKey: ["analytics", campaignId] });
      toast.success("Frete atualizado!");
      setIsShippingModalOpen(false);
    },
    onError: () => toast.error("Erro ao atualizar frete"),
  });

  const updateDeadlineMutation = useMutation({
    mutationFn: (deadline: string | null) =>
      campaignApi.update(campaignId!, { deadline: deadline || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign", campaignId] });
      toast.success("Data limite atualizada!");
      setIsEditDeadlineModalOpen(false);
    },
    onError: () => toast.error("Erro ao atualizar data limite"),
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: "ACTIVE" | "CLOSED" | "SENT" | "ARCHIVED") =>
      campaignApi.updateStatus(campaignId!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign", campaignId] });
      toast.success("Status atualizado!");
      setIsCloseConfirmOpen(false);
      setIsReopenConfirmOpen(false);
      setIsSentConfirmOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Erro ao atualizar status");
    },
  });

  const updateCampaignMutation = useMutation({
    mutationFn: (data: { name?: string; description?: string }) =>
      campaignApi.update(campaignId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign", campaignId] });
      toast.success("Campanha atualizada!");
    },
    onError: () => toast.error("Erro ao atualizar campanha"),
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({
      orderId,
      data,
    }: {
      orderId: string;
      data: Partial<Order>;
    }) => orderApi.update(orderId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", campaignId] });
      queryClient.invalidateQueries({ queryKey: ["analytics", campaignId] });
      toast.success("Pedido atualizado!");
    },
    onError: () => toast.error("Erro ao atualizar pedido"),
  });

  const cloneCampaignMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { name: string; description?: string };
    }) => campaignApi.clone(id, data),
    onSuccess: (newCampaign) => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("Campanha clonada com sucesso!");
      setIsCloneModalOpen(false);
      setCloneName("");
      setCloneDescription("");
      // Navigate to the new campaign
      navigate(`/campaigns/${newCampaign.id}`);
    },
    onError: () => toast.error("Erro ao clonar campanha"),
  });

  // Handlers
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    createProductMutation.mutate({
      ...productForm,
      price: parseFloat(productForm.price) || 0,
      weight: parseFloat(productForm.weight) || 0,
    });
  };

  const handleEditProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    updateProductMutation.mutate({
      productId: editingProduct.id,
      data: {
        ...editProductForm,
        price: parseFloat(editProductForm.price) || 0,
        weight: parseFloat(editProductForm.weight) || 0,
      },
    });
  };

  const openEditProductModal = (product: Product) => {
    setEditingProduct(product);
    setEditProductForm({
      name: product.name,
      price: String(product.price),
      weight: String(product.weight),
      imageUrl: "",
    });
    setIsEditProductModalOpen(true);
  };

  const handleDeleteProduct = (productId: string) => {
    if (window.confirm("Tem certeza que deseja remover este produto?")) {
      deleteProductMutation.mutate(productId);
    }
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    createOrderMutation.mutate(orderForm);
  };

  const handleCloseOrderModal = () => {
    setIsOrderModalOpen(false);
    // Mantém os items para que o usuário possa continuar adicionando produtos depois
    // Os items só são limpos quando o pedido é criado com sucesso
  };

  const loadExistingOrder = () => {
    const existingOrder = orders?.find((o) => o.userId === user?.id);
    if (existingOrder) {
      setOrderForm({
        campaignId: campaignId || "",
        customerName: existingOrder.customerName || existingOrder.customer.name,
        items: existingOrder.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      });
    }
  };

  const handleEditOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    updateOrderWithItemsMutation.mutate({
      orderId: editingOrder.id,
      data: {
        items: editOrderForm.items,
      },
    });
  };

  const openEditOrderModal = (order: Order) => {
    setEditingOrder(order);
    setEditOrderForm({
      campaignId: campaignId || "",
      customerName: order.customerName || "",
      items: order.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    });
    setIsEditOrderModalOpen(true);
  };

  const handleDeleteOrder = (orderId: string) => {
    if (window.confirm("Tem certeza que deseja remover este pedido?")) {
      deleteOrderMutation.mutate(orderId);
    }
  };

  const handleUpdateShipping = (e: React.FormEvent) => {
    e.preventDefault();
    updateShippingMutation.mutate(parseFloat(shippingCost) || 0);
  };

  const handleUpdateDeadline = (e: React.FormEvent) => {
    e.preventDefault();
    updateDeadlineMutation.mutate(deadlineForm || null);
  };

  const handleUpdateStatus = (
    status: "ACTIVE" | "CLOSED" | "SENT" | "ARCHIVED"
  ) => {
    updateStatusMutation.mutate(status);
  };

  const handleUpdateCampaign = (data: {
    name?: string;
    description?: string;
  }) => {
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
    setEditedName("");
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleNameSave();
    } else if (e.key === "Escape") {
      handleNameCancel();
    }
  };

  const handleDescriptionClick = () => {
    if (canEditCampaign && campaign) {
      setEditedDescription(campaign.description || "");
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
    setEditedDescription("");
  };

  const handleDescriptionKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleDescriptionCancel();
    }
  };

  const handleSort = (field: SortField) => {
    if (orderSortField === field) {
      setOrderSortDirection(orderSortDirection === "asc" ? "desc" : "asc");
    } else {
      setOrderSortField(field);
      setOrderSortDirection("asc");
    }
  };

  const handleProductSort = (field: ProductSortField) => {
    if (productSortField === field) {
      setProductSortDirection(productSortDirection === "asc" ? "desc" : "asc");
    } else {
      setProductSortField(field);
      setProductSortDirection("asc");
    }
  };

  const handleTogglePayment = (order: Order) => {
    updateOrderMutation.mutate({
      orderId: order.id,
      data: { isPaid: !order.isPaid },
    });
  };

  const handleAddToOrder = async (product: Product) => {
    requireAuth(async () => {
      const existingOrder = orders?.find((o) => o.userId === user?.id);

      if (existingOrder) {
        // Se o usuário já tem um pedido, adiciona o produto e salva automaticamente
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

        // Atualiza o formulário de edição ANTES da mutação
        setEditOrderForm({
          campaignId: campaignId || "",
          customerName: existingOrder.customerName || "",
          items: items,
        });
        setEditingOrder(existingOrder);

        // Define a flag para indicar que veio do botão "Pedir"
        // Isso evita que o modal seja fechado automaticamente no onSuccess
        isAddingFromButtonRef.current = true;

        // Abre o modal imediatamente
        setIsEditOrderModalOpen(true);

        // Faz a mutação em background
        updateOrderWithItemsMutation.mutate({
          orderId: existingOrder.id,
          data: { items },
        });
      } else {
        // Se o usuário NÃO tem pedido, cria automaticamente com o produto
        if (!user?.name) {
          toast.error("Erro: Nome de usuário não encontrado");
          return;
        }

        toast.success(`Pedido criado com "${product.name}"!`);

        // Prepara o formulário antes de criar
        const newOrderForm = {
          campaignId: campaignId || "",
          customerName: user.name,
          items: [{ productId: product.id, quantity: 1 }],
        };

        // Define a flag para indicar que veio do botão "Pedir"
        isAddingFromButtonRef.current = true;

        // Cria o pedido
        createOrderMutation.mutate(newOrderForm, {
          onSuccess: async () => {
            // Aguarda as queries serem atualizadas
            await queryClient.invalidateQueries({
              queryKey: ["orders", campaignId],
            });

            // Aguarda um pouco para garantir que a query foi atualizada
            setTimeout(() => {
              // Busca o pedido recém-criado
              queryClient
                .refetchQueries({ queryKey: ["orders", campaignId] })
                .then(() => {
                  const newOrder = orders?.find((o) => o.userId === user?.id);
                  if (newOrder) {
                    isAddingFromButtonRef.current = true;
                    openEditOrderModal(newOrder);
                  }
                });
            }, 300);
          },
        });
      }
    });
  };

  const handleEditOrderFromView = () => {
    if (viewingOrder) {
      setIsViewOrderModalOpen(false);
      openEditOrderModal(viewingOrder);
    }
  };

  const handleReopenCampaign = () => {
    const hasOrders = orders && orders.length > 0;
    const newStatus = hasOrders ? "CLOSED" : "ACTIVE";
    handleUpdateStatus(newStatus);
  };

  const handleOpenEditDeadline = () => {
    setIsEditDeadlineModalOpen(true);
    if (campaign?.deadline) {
      const dt = new Date(campaign.deadline);
      const year = dt.getFullYear();
      const month = (dt.getMonth() + 1).toString().padStart(2, "0");
      const day = dt.getDate().toString().padStart(2, "0");
      const hours = dt.getHours().toString().padStart(2, "0");
      const minutes = dt.getMinutes().toString().padStart(2, "0");
      const seconds = dt.getSeconds().toString().padStart(2, "0");
      setDeadlineForm(`${year}-${month}-${day}T${hours}:${minutes}:${seconds}`);
    } else {
      setDeadlineForm("");
    }
  };

  const handleOpenCloneModal = () => {
    requireAuth(() => {
      if (campaign) {
        setCloneName(`${campaign.name} (Cópia)`);
        setCloneDescription(campaign.description || "");
        setIsCloneModalOpen(true);
      }
    });
  };

  const handleCloneCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignId || !cloneName.trim()) return;
    cloneCampaignMutation.mutate({
      id: campaignId,
      data: {
        name: cloneName.trim(),
        description: cloneDescription.trim() || undefined,
      },
    });
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

    // Navigation state
    shouldOpenQuestionsTab,
    setShouldOpenQuestionsTab,

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

    // Clone Modal State
    isCloneModalOpen,
    setIsCloneModalOpen,
    cloneName,
    setCloneName,
    cloneDescription,
    setCloneDescription,

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
    handleOpenCloneModal,
    handleCloneCampaign,

    // Mutations
    createProductMutation,
    updateProductMutation,
    updateShippingMutation,
    updateDeadlineMutation,
    updateStatusMutation,
    createOrderMutation,
    updateOrderWithItemsMutation,
    cloneCampaignMutation,
  };
}
