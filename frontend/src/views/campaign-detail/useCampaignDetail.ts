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
  Product,
} from "@/api";
import { Order } from "@/api";
import { useAuth } from "@/contexts/AuthContext";
import { removeMask, applyPixMask } from "@/lib/pixMasks";
import { useOrderModal } from "@/hooks/useOrderModal";
import type { AddressData } from "@/components/ui/AddressForm";

interface ProductForm {
  campaignId: string;
  name: string;
  price: string;
  weight: string;
  imageUrl?: string;
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

  // Modal states (non-order)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false);
  const [isShippingModalOpen, setIsShippingModalOpen] = useState(false);
  const [isEditDeadlineModalOpen, setIsEditDeadlineModalOpen] = useState(false);
  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState(false);
  const [isReopenConfirmOpen, setIsReopenConfirmOpen] = useState(false);
  const [isSentConfirmOpen, setIsSentConfirmOpen] = useState(false);
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const [isImageUploadModalOpen, setIsImageUploadModalOpen] = useState(false);
  const [isPixModalOpen, setIsPixModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  // Address form state
  const [addressData, setAddressData] = useState<AddressData>({
    zipCode: '',
    address: '',
    addressNumber: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
  });
  const [addressErrors, setAddressErrors] = useState<Partial<Record<keyof AddressData, string>>>({});

  // Editing states (non-order)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

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

  // Clear PIX key when type changes to avoid inconsistencies
  useEffect(() => {
    if (pixType) {
      setPixKey("");
    }
  }, [pixType]);

  // Computed states
  const isActive = campaign?.status === "ACTIVE";
  const isClosed = campaign?.status === "CLOSED";
  const isSent = campaign?.status === "SENT";
  const canEditCampaign = campaign?.creatorId === user?.id || user?.role === 'ADMIN';

  // Alphabetical products for modal dropdown
  const alphabeticalProducts = useMemo(() => {
    if (!products) return [];
    return [...products].sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  // Order modal hook (handles all order modal logic, autosave, keyboard shortcuts)
  const orderModal = useOrderModal({
    orders,
    campaignId,
    user: user ? { id: user.id, name: user.name } : null,
    isActive,
    requireAuth,
    products: alphabeticalProducts,
  });

  // Expose useful order modal state/mutations locally for convenience
  const {
    isPaymentProofModalOpen,
    setIsPaymentProofModalOpen,
    orderForPayment,
    setOrderForPayment,
    updatePaymentMutation,
    setIsViewOrderModalOpen,
    setViewingOrder,
  } = orderModal;

  // State for handling navigation from notifications
  const [shouldOpenQuestionsTab, setShouldOpenQuestionsTab] = useState(false);

  useEffect(() => {
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
      const order = orders.find((o) => o.id === state.orderId);

      if (order) {
        setViewingOrder(order);
        setIsViewOrderModalOpen(true);
        sessionStorage.removeItem('campaignNavigationState');
      }
    }

    if (state?.openQuestionsTab) {
      setShouldOpenQuestionsTab(true);
      sessionStorage.removeItem('campaignNavigationState');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders]);

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

  // Product mutations
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

  // Campaign mutations
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

  const updateAddressMutation = useMutation({
    mutationFn: (data: {
      pickupZipCode: string;
      pickupAddress: string;
      pickupAddressNumber: string;
      pickupComplement?: string;
      pickupNeighborhood: string;
      pickupCity: string;
      pickupState: string;
    }) => campaignApi.update(slug!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign", slug] });
      toast.success("Endereço de retirada atualizado!");
      setIsAddressModalOpen(false);
    },
    onError: () => toast.error("Erro ao atualizar endereço de retirada"),
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
      if (updatedCampaign.slug !== slug) {
        router.replace(`/campanhas/${updatedCampaign.slug}`);
      } else {
        queryClient.invalidateQueries({ queryKey: ["campaign", slug] });
      }
      toast.success("Campanha atualizada!");
    },
    onError: () => toast.error("Erro ao atualizar campanha"),
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
      router.push(`/campanhas/${newCampaign.slug}`);
    },
    onError: () => toast.error("Erro ao clonar campanha"),
  });

  // Product handlers
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

  // Campaign handlers
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

  const handleOpenAddressModal = () => {
    if (campaign) {
      setAddressData({
        zipCode: campaign.pickupZipCode || '',
        address: campaign.pickupAddress || '',
        addressNumber: campaign.pickupAddressNumber || '',
        complement: campaign.pickupComplement || '',
        neighborhood: campaign.pickupNeighborhood || '',
        city: campaign.pickupCity || '',
        state: campaign.pickupState || '',
      });
      setAddressErrors({});
    }
    setIsAddressModalOpen(true);
  };

  const handleUpdateAddress = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Partial<Record<keyof AddressData, string>> = {};
    if (!addressData.zipCode) errors.zipCode = 'CEP obrigatório';
    if (!addressData.address) errors.address = 'Endereço obrigatório';
    if (!addressData.addressNumber) errors.addressNumber = 'Número obrigatório';
    if (Object.keys(errors).length > 0) {
      setAddressErrors(errors);
      return;
    }
    updateAddressMutation.mutate({
      pickupZipCode: addressData.zipCode,
      pickupAddress: addressData.address,
      pickupAddressNumber: addressData.addressNumber,
      pickupComplement: addressData.complement || undefined,
      pickupNeighborhood: addressData.neighborhood,
      pickupCity: addressData.city,
      pickupState: addressData.state,
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

    // Order Modal State (delegated to useOrderModal)
    ...orderModal,
    orderModal,

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
    handleReopenCampaign,
    handleOpenEditDeadline,
    handleOpenPixModal,
    handleOpenAddressModal,
    handleUpdateAddress,
    handleOpenCloneModal,
    handleCloneCampaign,

    // Address Modal
    isAddressModalOpen,
    setIsAddressModalOpen,
    addressData,
    setAddressData,
    addressErrors,

    // Mutations
    createProductMutation,
    updateProductMutation,
    updateShippingMutation,
    updateDeadlineMutation,
    updatePixMutation,
    updateStatusMutation,
    cloneCampaignMutation,
    updateAddressMutation,
  };
}
