import axios from 'axios';
import { API_URL } from './env';
import { authStorage } from './authStorage';
import { authApi } from './authApi';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: Add Authorization header if token exists
api.interceptors.request.use(
  (config) => {
    const token = authStorage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Handle 401 errors and refresh token
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is not 401 or request already retried, reject immediately
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // If already refreshing token, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(() => {
          return api(originalRequest);
        })
        .catch((err) => {
          return Promise.reject(err);
        });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = authStorage.getRefreshToken();

    if (!refreshToken) {
      // No refresh token, clear auth and reject
      authStorage.clearAuth();
      processQueue(new Error('No refresh token'));
      isRefreshing = false;
      return Promise.reject(error);
    }

    try {
      // Try to refresh the access token
      const { accessToken } = await authApi.refresh(refreshToken);
      authStorage.setAccessToken(accessToken);

      // Update the failed request with new token
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;

      processQueue();
      isRefreshing = false;

      // Retry the original request
      return api(originalRequest);
    } catch (refreshError) {
      // Refresh failed, clear auth and reject
      authStorage.clearAuth();
      processQueue(refreshError);
      isRefreshing = false;
      return Promise.reject(refreshError);
    }
  }
);

// Types
export interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: 'ACTIVE' | 'CLOSED' | 'SENT' | 'ARCHIVED';
  deadline?: string;
  shippingCost: number;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    products: number;
    orders: number;
  };
}

// Tipo estendido para listagem com preview de produtos
export interface ProductPreview {
  id: string;
  name: string;
  price: number;
}

export interface CampaignWithProducts extends Campaign {
  creator?: {
    id: string;
    name: string;
  };
  products?: ProductPreview[];
}

// Parâmetros para listagem de campanhas
export interface CampaignListParams {
  cursor?: string;
  limit?: number;
  search?: string;
  status?: 'ACTIVE' | 'CLOSED' | 'SENT' | 'ARCHIVED';
  creatorId?: string;
  fromSellers?: boolean;
  similarProducts?: boolean;
}

// Resposta paginada de campanhas
export interface CampaignListResponse {
  data: CampaignWithProducts[];
  suggestions?: CampaignWithProducts[]; // Sugestões quando busca retorna poucos/nenhum resultado
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
}

export interface Product {
  id: string;
  campaignId: string;
  name: string;
  price: number;
  weight: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  product: Product;
}

export interface Order {
  id: string;
  campaignId: string;
  customerName?: string; // Opcional para compatibilidade com pedidos antigos
  userId: string;
  customer: {
    id: string;
    name: string;
    email: string;
  };
  isPaid: boolean;
  isSeparated: boolean;
  subtotal: number;
  shippingFee: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export interface OrderMessage {
  id: string;
  orderId: string;
  senderId: string;
  senderName: string;
  senderType: 'ADMIN' | 'CUSTOMER';
  message: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  sender: {
    id: string;
    name: string;
    role: 'ADMIN' | 'CAMPAIGN_CREATOR' | 'CUSTOMER';
  };
}

export interface Analytics {
  totalQuantity: number;
  totalWithoutShipping: number;
  totalWithShipping: number;
  totalPaid: number;
  totalUnpaid: number;
  byProduct: Array<{
    productId: string;
    productName: string;
    quantity: number;
  }>;
  byCustomer: Array<{
    customerName: string;
    total: number;
    isPaid: boolean;
  }>;
}

// API functions
export const campaignApi = {
  // Nova API com paginação e filtros
  list: (params: CampaignListParams = {}) =>
    api.get<CampaignListResponse>('/campaigns', { params }).then(res => res.data),

  // Mantém getAll para compatibilidade (agora usa a nova API internamente)
  getAll: () => api.get<CampaignListResponse>('/campaigns').then(res => res.data.data),

  getById: (id: string) => api.get<Campaign>(`/campaigns/${id}`).then(res => res.data),
  create: (data: { name: string; description?: string; deadline?: string; shippingCost?: number }) =>
    api.post<Campaign>('/campaigns', data).then(res => res.data),
  update: (id: string, data: Partial<Campaign>) =>
    api.patch<Campaign>(`/campaigns/${id}`, data).then(res => res.data),
  updateStatus: (id: string, status: 'ACTIVE' | 'CLOSED' | 'SENT' | 'ARCHIVED') =>
    api.patch<Campaign>(`/campaigns/${id}/status`, { status }).then(res => res.data),
  delete: (id: string) => api.delete(`/campaigns/${id}`),
  downloadSupplierInvoice: (id: string) => {
    return api.get(`/campaigns/${id}/supplier-invoice`, {
      responseType: 'blob'
    }).then(res => {
      // Create a blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;

      // Extract filename from Content-Disposition header or use default
      const contentDisposition = res.headers['content-disposition'];
      let filename = `fatura-fornecedor-${id}.pdf`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    });
  }
};

export const productApi = {
  getByCampaign: (campaignId: string) =>
    api.get<Product[]>('/products', { params: { campaignId } }).then(res => res.data),
  create: (data: { campaignId: string; name: string; price: number; weight: number }) =>
    api.post<Product>('/products', data).then(res => res.data),
  update: (id: string, data: Partial<Product>) =>
    api.patch<Product>(`/products/${id}`, data).then(res => res.data),
  delete: (id: string) => api.delete(`/products/${id}`)
};

export const orderApi = {
  getByCampaign: (campaignId: string) =>
    api.get<Order[]>('/orders', { params: { campaignId } }).then(res => res.data),
  create: (data: {
    campaignId: string;
    items: Array<{ productId: string; quantity: number }>;
  }) => api.post<Order>('/orders', data).then(res => res.data),
  update: (id: string, data: Partial<Order>) =>
    api.patch<Order>(`/orders/${id}`, data).then(res => res.data),
  updateWithItems: (id: string, data: {
    items?: Array<{ productId: string; quantity: number }>;
  }) => api.put<Order>(`/orders/${id}`, data).then(res => res.data),
  delete: (id: string) => api.delete(`/orders/${id}`)
};

export const messageApi = {
  getByOrder: (orderId: string) =>
    api.get<OrderMessage[]>('/messages', { params: { orderId } }).then(res => res.data),
  create: (data: {
    orderId: string;
    message: string;
  }) => api.post<OrderMessage>('/messages', data).then(res => res.data),
  getUnreadCount: () =>
    api.get<{ count: number }>('/messages/unread-count').then(res => res.data)
};

export const analyticsApi = {
  getByCampaign: (campaignId: string) =>
    api.get<Analytics>(`/analytics/campaign/${campaignId}`).then(res => res.data)
};
