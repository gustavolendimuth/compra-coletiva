import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Types
export interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
  shippingCost: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    products: number;
    orders: number;
  };
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
  customerName: string;
  isPaid: boolean;
  isSeparated: boolean;
  subtotal: number;
  shippingFee: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
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
  getAll: () => api.get<Campaign[]>('/campaigns').then(res => res.data),
  getById: (id: string) => api.get<Campaign>(`/campaigns/${id}`).then(res => res.data),
  create: (data: { name: string; description?: string; shippingCost?: number }) =>
    api.post<Campaign>('/campaigns', data).then(res => res.data),
  update: (id: string, data: Partial<Campaign>) =>
    api.patch<Campaign>(`/campaigns/${id}`, data).then(res => res.data),
  delete: (id: string) => api.delete(`/campaigns/${id}`)
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
    customerName: string;
    items: Array<{ productId: string; quantity: number }>;
  }) => api.post<Order>('/orders', data).then(res => res.data),
  update: (id: string, data: Partial<Order>) =>
    api.patch<Order>(`/orders/${id}`, data).then(res => res.data),
  updateWithItems: (id: string, data: {
    customerName?: string;
    items?: Array<{ productId: string; quantity: number }>;
  }) => api.put<Order>(`/orders/${id}`, data).then(res => res.data),
  delete: (id: string) => api.delete(`/orders/${id}`)
};

export const analyticsApi = {
  getByCampaign: (campaignId: string) =>
    api.get<Analytics>(`/analytics/campaign/${campaignId}`).then(res => res.data)
};
