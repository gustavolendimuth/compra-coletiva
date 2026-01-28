'use client';

import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, usePathname, useRouter } from "next/navigation";
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
import { removeMask, applyPixMask } from "@/lib/pixMasks";

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
  | "customerName"
  | "subtotal"
  | "shippingFee"
  | "total"
  | "isPaid";
type SortDirection = "asc" | "desc";
type ProductSortField = "name" | "price" | "weight";

export function useCampaignDetail() {
  const params = useParams();
  const slug = params?.slug as string;
  const { user, requireAuth } = useAuth();
  const queryClient = useQueryClient();

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
  // Quando true, não fecha o modal automaticamente
  const isAddingFromButtonRef = useRef(false);

  // Ref para rastrear a primeira renderização do modal de edição
  const isFirstEditRenderRef = useRef(true);

  // Ref para o timer de debounce do autosave
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Ref para indicar se está fazendo autosave
  // Quando true, não fecha o modal e não mostra toast
  const isAutosavingRef = useRef(false);

  // Estados para indicador visual de autosave
  const [isAutosaving, setIsAutosaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Form states
  const [productForm, setProductForm] = useState<ProductForm>({
    campaignId: "",
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

  const [editOrderForm, setEditOrderForm] = useState<OrderForm>({
    campaignId: "",
    items: [],
  });

  const [shippingCost, setShippingCost] = useState("");
  const [deadlineForm, setDeadlineForm] = useState("");
  const [cloneName, setCloneName] = useState("");
  const [cloneDescription, setCloneDescription] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [pixType, setPixType] = useState<"CPF" | "CNPJ" | "EMAIL" | "PHONE" | "RANDOM" | "">("");
  const [pixName, setPixName] = useState("");
  const [pixVisibleAtStatus, setPixVisibleAtStatus] = useState<"ACTIVE" | "CLOSED" | "SENT" | "ARCHIVED">("ACTIVE");

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
    queryKey: ["campaign", slug],
    queryFn: () => campaignApi.getBySlug(slug!),
    enabled: !!slug,
  });

  // Get the actual campaign ID from the loaded campaign
  const campaignId = campaign?.id;

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
  const pathname = usePathname();
  const router = useRouter();

  // Autosave effect for edit order form
  useEffect(() => {
    // Não faz autosave se:
    // 1. Modal de edição não está aberto
    // 2. Não há pedido sendo editado
    // 3. É a primeira renderização (quando o modal abre)
    if (!isEditOrderModalOpen || !editingOrder || isFirstEditRenderRef.current) {
      if (isEditOrderModalOpen && editingOrder) {
        isFirstEditRenderRef.current = false;
      }
      return;
    }

    // Limpa o timer anterior se existir
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    // Configura novo timer para autosave com debounce de 500ms
    autosaveTimerRef.current = setTimeout(() => {
      // Verifica se há itens válidos para salvar
      const hasValidItems = editOrderForm.items.some(
        item => item.productId && item.quantity > 0
      );

      if (hasValidItems && !isAddingFromButtonRef.current) {
        // Define flag de autosave para não fechar o modal
        isAutosavingRef.current = true;
        setIsAutosaving(true);

        // Faz a mutação em background sem fechar o modal
        updateOrderWithItemsMutation.mutate({
          orderId: editingOrder.id,
          data: {
            items: editOrderForm.items.filter(
              item => item.productId && item.quantity > 0
            ),
          },
        });
      }
    }, 500);

    // Cleanup: limpa o timer quando o componente desmonta ou as dependências mudam
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editOrderForm.items, isEditOrderModalOpen, editingOrder?.id]);

  // Reset first render flag and autosave states when modal closes
  useEffect(() => {
    if (!isEditOrderModalOpen) {
      isFirstEditRenderRef.current = true;
      setIsAutosaving(false);
      setLastSaved(null);
    }
  }, [isEditOrderModalOpen]);

  // Clear PIX key when type changes to avoid inconsistencies
  useEffect(() => {
    if (pixType) {
      setPixKey("");
    }
  }, [pixType]);

  // State for handling navigation from notifications
  const [shouldOpenQuestionsTab, setShouldOpenQuestionsTab] = useState(false);

  useEffect(() => {
    // In Next.js, we use sessionStorage to pass navigation state
    const storedState = typeof window !== 'undefined'
      ? sessionStorage.getItem('campaignNavigationState')
      : null;

    if (!storedState) return;

    const state = JSON.parse(storedState) as {
      openOrderChat?: boolean;
      orderId?: string;
      openQuestionsTab?: boolean;
    };

    if (state?.openOrderChat && state?.orderId && orders) {
      // Find the order
      const order = orders.find((o) => o.id === state.orderId);

      if (order) {
        // Open the order modal
        setViewingOrder(order);
        setIsViewOrderModalOpen(true);

        // Clear the state to prevent reopening on refresh
        sessionStorage.removeItem('campaignNavigationState');
      }
    }

    if (state?.openQuestionsTab) {
      // Signal to open questions tab
      setShouldOpenQuestionsTab(true);

      // Clear the state to prevent reopening on refresh
      sessionStorage.removeItem('campaignNavigationState');
    }
  }, [orders]);

  // Computed states
  const isActive = campaign?.status === "ACTIVE";
  const isClosed = campaign?.status === "CLOSED";
  const isSent = campaign?.status === "SENT";
  const canEditCampaign = campaign?.creatorId === user?.id;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt+N: Adicionar Pedido (apenas se campanha estiver ativa e usuário autenticado)
      if (e.altKey && e.key === 'n' && isActive && user) {
        e.preventDefault();
        handleAddOrder();
      }

      // Alt+P: Adicionar Produto ao pedido (apenas se modal de edição estiver aberto)
      if (e.altKey && e.key === 'p' && isEditOrderModalOpen) {
        e.preventDefault();
        setEditOrderForm((prev) => ({
          ...prev,
          items: [...prev.items, { productId: "", quantity: 1 }],
        }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, user, isEditOrderModalOpen]);

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
        order.customer.name?.toLowerCase().includes(orderSearch.toLowerCase())
      );
    }
    return [...filtered].sort((a, b) => {
      // Handle customerName field specially since it's now in customer.name
      const aVal = orderSortField === "customerName" ? a.customer.name : a[orderSortField];
      const bVal = orderSortField === "customerName" ? b.customer.name : b[orderSortField];
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
      // Toast será mostrado pelo handleAddOrder quando apropriado
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

      // Se for autosave, não fecha o modal e não mostra toast
      if (isAutosavingRef.current) {
        isAutosavingRef.current = false;
        setIsAutosaving(false);
        setLastSaved(new Date());
        return;
      }

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
      isAutosavingRef.current = false;
      setIsAutosaving(false);
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
      campaignApi.update(slug!, { shippingCost: cost }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign", slug] });
      queryClient.invalidateQueries({ queryKey: ["orders", campaignId] });
      queryClient.invalidateQueries({ queryKey: ["analytics", campaignId] });
      toast.success("Frete atualizado!");
      setIsShippingModalOpen(false);
    },
    onError: () => toast.error("Erro ao atualizar frete"),
  });

  const updateDeadlineMutation = useMutation({
    mutationFn: (deadline: string | null) =>
      campaignApi.update(slug!, { deadline: deadline || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign", slug] });
      toast.success("Data limite atualizada!");
      setIsEditDeadlineModalOpen(false);
    },
    onError: () => toast.error("Erro ao atualizar data limite"),
  });

  const updatePixMutation = useMutation({
    mutationFn: (data: {
      pixKey?: string | null;
      pixType?: "CPF" | "CNPJ" | "EMAIL" | "PHONE" | "RANDOM" | null;
      pixName?: string | null;
      pixVisibleAtStatus?: "ACTIVE" | "CLOSED" | "SENT" | "ARCHIVED";
    }) => campaignApi.update(slug!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign", slug] });
      toast.success("PIX atualizado!");
      setIsPixModalOpen(false);
    },
    onError: () => toast.error("Erro ao atualizar PIX"),
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: "ACTIVE" | "CLOSED" | "SENT" | "ARCHIVED") =>
      campaignApi.updateStatus(slug!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign", slug] });
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
      campaignApi.update(slug!, data),
    onSuccess: (updatedCampaign) => {
      // If the name changed, the slug might have changed too
      // Navigate to the new slug if different
      if (updatedCampaign.slug !== slug) {
        router.replace(`/campanhas/${updatedCampaign.slug}`);
      } else {
        queryClient.invalidateQueries({ queryKey: ["campaign", slug] });
      }
      toast.success("Campanha atualizada!");
    },
    onError: () => toast.error("Erro ao atualizar campanha"),
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
      queryClient.invalidateQueries({ queryKey: ["orders", campaignId] });
      queryClient.invalidateQueries({ queryKey: ["analytics", campaignId] });
      toast.success("Status de pagamento atualizado!");
      setIsPaymentProofModalOpen(false);
      setOrderForPayment(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Erro ao atualizar pagamento");
    },
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
      // Navigate to the new campaign using slug
      router.push(`/campanhas/${newCampaign.slug}`);
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
    deleteProductMutation.mutate(productId);
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
      items: order.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    });
    setIsEditOrderModalOpen(true);
  };

  const handleDeleteOrder = (orderId: string) => {
    deleteOrderMutation.mutate(orderId);
  };

  const handleUpdateShipping = (e: React.FormEvent) => {
    e.preventDefault();
    updateShippingMutation.mutate(parseFloat(shippingCost) || 0);
  };

  const handleUpdateDeadline = (e: React.FormEvent) => {
    e.preventDefault();
    updateDeadlineMutation.mutate(deadlineForm || null);
  };

  const handleUpdatePix = (e: React.FormEvent) => {
    e.preventDefault();
    // Remove mask from PIX key before sending
    const cleanPixKey = pixKey ? removeMask(pixKey, pixType) : null;
    updatePixMutation.mutate({
      pixKey: cleanPixKey,
      pixType: pixType || null,
      pixName: pixName || null,
      pixVisibleAtStatus,
    });
  };

  const handleRemovePix = () => {
    updatePixMutation.mutate({
      pixKey: null,
      pixType: null,
      pixName: null,
      pixVisibleAtStatus: "ACTIVE",
    });
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
    // Se está marcando como pago, abre modal para upload
    if (!order.isPaid) {
      setOrderForPayment(order);
      setIsPaymentProofModalOpen(true);
    } else {
      // Se está desmarcando, apenas atualiza (sem arquivo)
      updatePaymentMutation.mutate({
        orderId: order.id,
        isPaid: false,
      });
    }
  };

  const handlePaymentProofSubmit = (file: File) => {
    if (!orderForPayment) return;
    updatePaymentMutation.mutate({
      orderId: orderForPayment.id,
      isPaid: true,
      file,
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

        // Prepara os dados para criar o pedido (API não aceita customerName)
        const createOrderData = {
          campaignId: campaignId || "",
          items: [{ productId: product.id, quantity: 1 }],
        };

        // Define a flag para indicar que veio do botão "Pedir"
        isAddingFromButtonRef.current = true;

        // Cria o pedido
        createOrderMutation.mutate(createOrderData, {
          onSuccess: async () => {
            // Aguarda as queries serem atualizadas
            await queryClient.invalidateQueries({
              queryKey: ["orders", campaignId],
            });

            // Refetch e busca o pedido recém-criado do cache atualizado
            await queryClient.refetchQueries({
              queryKey: ["orders", campaignId],
            });

            const updatedOrders = queryClient.getQueryData<Order[]>([
              "orders",
              campaignId,
            ]);
            const newOrder = updatedOrders?.find(
              (o) => o.userId === user?.id
            );
            if (newOrder) {
              isAddingFromButtonRef.current = true;
              openEditOrderModal(newOrder);
            }
          },
        });
      }
    });
  };

  const handleAddOrder = () => {
    requireAuth(async () => {
      // Verifica se usuário já tem pedido
      const existingOrder = orders?.find((o) => o.userId === user?.id);

      if (existingOrder) {
        // Se já tem pedido, abre modal de edição
        setEditingOrder(existingOrder);
        setEditOrderForm({
          campaignId: campaignId || "",
          items: existingOrder.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        });
        setIsEditOrderModalOpen(true);
      } else {
        // Se não tem pedido, cria pedido vazio primeiro
        if (!user?.name) {
          toast.error("Erro: Nome de usuário não encontrado");
          return;
        }

        // Prepara os dados para criar o pedido (API não aceita customerName)
        const createOrderData = {
          campaignId: campaignId || "",
          items: [], // Pedido vazio - autosave vai adicionar items
        };

        // Cria o pedido vazio
        createOrderMutation.mutate(createOrderData, {
          onSuccess: async (newOrder) => {
            // Aguarda as queries serem atualizadas
            await queryClient.invalidateQueries({
              queryKey: ["orders", campaignId],
            });

            // Abre modal de edição com o pedido vazio
            setEditingOrder(newOrder);
            setEditOrderForm({
              campaignId: campaignId || "",
              items: [],
            });
            setIsEditOrderModalOpen(true);
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

  const handleOpenPixModal = () => {
    setIsPixModalOpen(true);
    if (campaign) {
      // Apply mask to existing PIX key when loading
      const maskedPixKey = campaign.pixKey && campaign.pixType
        ? applyPixMask(campaign.pixKey, campaign.pixType)
        : "";
      setPixKey(maskedPixKey);
      setPixType(campaign.pixType || "");
      setPixName(campaign.pixName || "");
      setPixVisibleAtStatus(campaign.pixVisibleAtStatus || "ACTIVE");
    } else {
      setPixKey("");
      setPixType("");
      setPixName("");
      setPixVisibleAtStatus("ACTIVE");
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
    isEditOrderModalOpen,
    setIsEditOrderModalOpen,
    editingOrder,
    setEditingOrder,
    editOrderForm,
    setEditOrderForm,
    isAutosaving,
    lastSaved,
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

    // PIX Modal State
    isPixModalOpen,
    setIsPixModalOpen,
    pixKey,
    setPixKey,
    pixType,
    setPixType,
    pixName,
    setPixName,
    pixVisibleAtStatus,
    setPixVisibleAtStatus,

    // Payment Proof Modal State
    isPaymentProofModalOpen,
    setIsPaymentProofModalOpen,
    orderForPayment,
    setOrderForPayment,

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

    // Image Upload Modal State
    isImageUploadModalOpen,
    setIsImageUploadModalOpen,

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
    handleAddOrder,
    handleEditOrder,
    openEditOrderModal,
    handleDeleteOrder,
    handleUpdateShipping,
    handleUpdateDeadline,
    handleUpdatePix,
    handleRemovePix,
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
    handlePaymentProofSubmit,
    handleEditOrderFromView,
    handleReopenCampaign,
    handleOpenEditDeadline,
    handleOpenPixModal,
    handleOpenCloneModal,
    handleCloneCampaign,

    // Mutations
    createProductMutation,
    updateProductMutation,
    updateShippingMutation,
    updateDeadlineMutation,
    updatePixMutation,
    updateStatusMutation,
    createOrderMutation,
    updateOrderWithItemsMutation,
    updatePaymentMutation,
    cloneCampaignMutation,
  };
}
