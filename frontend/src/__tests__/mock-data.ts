/**
 * Mock Data Factories
 * Factory functions to generate mock data for testing
 */

import {
  CampaignWithProducts,
  ProductPreview,
  Product,
  Order,
  OrderItem,
  Analytics,
  Campaign,
  Notification,
  NotificationListResponse,
} from '@/api';

// Mock Product Factory
export const createMockProduct = (
  overrides: Partial<ProductPreview> = {}
): ProductPreview => ({
  id: `product-${Math.random().toString(36).substring(7)}`,
  name: 'Test Product',
  price: 99.99,
  ...overrides,
});

// Mock Campaign Factory
export const createMockCampaign = (
  overrides: Partial<CampaignWithProducts> = {}
): CampaignWithProducts => ({
  id: `campaign-${Math.random().toString(36).substring(7)}`,
  name: 'Test Campaign',
  description: 'This is a test campaign description',
  status: 'ACTIVE',
  deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  shippingCost: 50.0,
  creatorId: 'user-1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  _count: {
    products: 5,
    orders: 10,
  },
  creator: {
    id: 'user-1',
    name: 'Test Creator',
  },
  products: [
    createMockProduct({ id: 'product-1', name: 'Product 1', price: 50.0 }),
    createMockProduct({ id: 'product-2', name: 'Product 2', price: 75.0 }),
    createMockProduct({ id: 'product-3', name: 'Product 3', price: 100.0 }),
  ],
  ...overrides,
});

// Mock Campaign List Response Factory
export const createMockCampaignListResponse = (
  campaigns: CampaignWithProducts[] = [],
  overrides: Partial<any> = {}
) => ({
  data: campaigns,
  suggestions: [],
  nextCursor: null,
  hasMore: false,
  total: campaigns.length,
  ...overrides,
});

// Predefined mock campaigns with different statuses
export const mockActiveCampaign = createMockCampaign({
  id: 'campaign-active',
  name: 'Active Campaign',
  status: 'ACTIVE',
  deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
});

export const mockClosedCampaign = createMockCampaign({
  id: 'campaign-closed',
  name: 'Closed Campaign',
  status: 'CLOSED',
  deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
});

export const mockSentCampaign = createMockCampaign({
  id: 'campaign-sent',
  name: 'Sent Campaign',
  status: 'SENT',
  deadline: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
});

export const mockArchivedCampaign = createMockCampaign({
  id: 'campaign-archived',
  name: 'Archived Campaign',
  status: 'ARCHIVED',
  deadline: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
});

// Predefined mock campaigns with different deadline scenarios
export const mockCampaignEndingToday = createMockCampaign({
  id: 'campaign-ending-today',
  name: 'Campaign Ending Today',
  status: 'ACTIVE',
  deadline: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // 3 hours from now
});

export const mockCampaignEndingTomorrow = createMockCampaign({
  id: 'campaign-ending-tomorrow',
  name: 'Campaign Ending Tomorrow',
  status: 'ACTIVE',
  deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
});

export const mockCampaignEndingIn3Days = createMockCampaign({
  id: 'campaign-ending-3days',
  name: 'Campaign Ending in 3 Days',
  status: 'ACTIVE',
  deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
});

export const mockCampaignEndingIn7Days = createMockCampaign({
  id: 'campaign-ending-7days',
  name: 'Campaign Ending in 7 Days',
  status: 'ACTIVE',
  deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
});

// Mock campaign with no products
export const mockCampaignNoProducts = createMockCampaign({
  id: 'campaign-no-products',
  name: 'Campaign Without Products',
  products: [],
  _count: {
    products: 0,
    orders: 0,
  },
});

// Mock campaign with many products
export const mockCampaignManyProducts = createMockCampaign({
  id: 'campaign-many-products',
  name: 'Campaign With Many Products',
  products: Array.from({ length: 10 }, (_, i) =>
    createMockProduct({ id: `product-${i}`, name: `Product ${i + 1}` })
  ),
  _count: {
    products: 10,
    orders: 25,
  },
});

// Full Product Factory (with all fields)
export const createMockFullProduct = (
  overrides: Partial<Product> = {}
): Product => ({
  id: `product-${Math.random().toString(36).substring(7)}`,
  campaignId: 'campaign-1',
  name: 'Test Product',
  price: 99.99,
  weight: 500,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

// Order Item Factory
export const createMockOrderItem = (
  overrides: Partial<OrderItem> = {}
): OrderItem => ({
  id: `item-${Math.random().toString(36).substring(7)}`,
  orderId: 'order-1',
  productId: 'product-1',
  quantity: 2,
  unitPrice: 99.99,
  subtotal: 199.98,
  product: createMockFullProduct({
    id: 'product-1',
    name: 'Test Product',
    price: 99.99,
    weight: 500,
  }),
  ...overrides,
});

// Order Factory
export const createMockOrder = (overrides: Partial<Order> = {}): Order => ({
  id: `order-${Math.random().toString(36).substring(7)}`,
  campaignId: 'campaign-1',
  customerName: 'Test Customer',
  userId: 'user-1',
  customer: {
    id: 'user-1',
    name: 'Test Customer',
    email: 'customer@example.com',
  },
  isPaid: false,
  isSeparated: false,
  subtotal: 199.98,
  shippingFee: 10.0,
  total: 209.98,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  items: [
    createMockOrderItem({
      id: 'item-1',
      productId: 'product-1',
      quantity: 2,
    }),
  ],
  ...overrides,
});

// Analytics Factory
export const createMockAnalytics = (
  overrides: Partial<Analytics> = {}
): Analytics => ({
  totalQuantity: 10,
  totalWithoutShipping: 500.0,
  totalWithShipping: 550.0,
  totalPaid: 300.0,
  totalUnpaid: 250.0,
  byProduct: [
    {
      productId: 'product-1',
      productName: 'Product 1',
      quantity: 5,
    },
    {
      productId: 'product-2',
      productName: 'Product 2',
      quantity: 5,
    },
  ],
  byCustomer: [
    {
      customerName: 'Customer 1',
      total: 250.0,
      isPaid: true,
    },
    {
      customerName: 'Customer 2',
      total: 300.0,
      isPaid: false,
    },
  ],
  ...overrides,
});

// Full Campaign Factory (without products array, just Campaign interface)
export const createMockCampaignFull = (
  overrides: Partial<Campaign> = {}
): Campaign => ({
  id: `campaign-${Math.random().toString(36).substring(7)}`,
  name: 'Test Campaign',
  description: 'This is a test campaign description',
  status: 'ACTIVE',
  deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  shippingCost: 50.0,
  creatorId: 'user-1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  _count: {
    products: 5,
    orders: 10,
  },
  ...overrides,
});

// Notification Factory
export const createMockNotification = (
  overrides: Partial<Notification> = {}
): Notification => ({
  id: `notification-${Math.random().toString(36).substring(7)}`,
  userId: 'user-1',
  type: 'CAMPAIGN_READY_TO_SEND',
  title: 'Test Notification',
  message: 'This is a test notification message',
  isRead: false,
  metadata: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

// Notification List Response Factory
export const createMockNotificationListResponse = (
  notifications: Notification[] = [],
  overrides: Partial<NotificationListResponse> = {}
): NotificationListResponse => ({
  notifications,
  total: notifications.length,
  unreadCount: notifications.filter((n) => !n.isRead).length,
  ...overrides,
});

// Predefined mock notifications
export const mockUnreadNotification = createMockNotification({
  id: 'notification-unread',
  title: 'Campanha pronta para envio',
  message: 'A campanha "Test Campaign" atingiu a meta e está pronta para ser enviada!',
  type: 'CAMPAIGN_READY_TO_SEND',
  isRead: false,
  metadata: { campaignSlug: 'test-campaign' },
});

export const mockReadNotification = createMockNotification({
  id: 'notification-read',
  title: 'Campanha arquivada',
  message: 'A campanha "Old Campaign" foi arquivada',
  type: 'CAMPAIGN_ARCHIVED',
  isRead: true,
  metadata: { campaignSlug: 'old-campaign' },
});

export const mockMessageNotification = createMockNotification({
  id: 'notification-message',
  title: 'Nova mensagem',
  message: 'Você recebeu uma nova mensagem em "Test Campaign"',
  type: 'NEW_MESSAGE',
  isRead: false,
  metadata: { campaignSlug: 'test-campaign', orderId: 'order-1', isQuestion: false },
});
