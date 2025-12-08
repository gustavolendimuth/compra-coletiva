/**
 * Shared TypeScript Types for API
 * All interfaces and types used across API services
 */

// ============================================================================
// User & Authentication Types
// ============================================================================

export interface StoredUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: "ADMIN" | "CAMPAIGN_CREATOR" | "CUSTOMER";
  googleId?: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone: string;
  role?: "CUSTOMER" | "CAMPAIGN_CREATOR";
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: StoredUser;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
}

// ============================================================================
// Campaign Types
// ============================================================================

export interface Campaign {
  id: string;
  slug: string;
  name: string;
  description?: string;
  status: "ACTIVE" | "CLOSED" | "SENT" | "ARCHIVED";
  deadline?: string;
  shippingCost: number;
  creatorId: string;
  imageUrl?: string;
  imageKey?: string;
  imageStorageType?: "S3" | "LOCAL";
  createdAt: string;
  updatedAt: string;
  _count?: {
    products: number;
    orders: number;
  };
}

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

export interface CampaignListParams {
  cursor?: string;
  limit?: number;
  search?: string;
  status?: "ACTIVE" | "CLOSED" | "SENT" | "ARCHIVED";
  creatorId?: string;
  fromSellers?: boolean;
  similarProducts?: boolean;
}

export interface CampaignListResponse {
  data: CampaignWithProducts[];
  suggestions?: CampaignWithProducts[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
}

export interface CreateCampaignDto {
  name: string;
  description?: string;
  deadline?: string;
  shippingCost?: number;
}

export interface UpdateCampaignDto {
  name?: string;
  description?: string;
  deadline?: string;
  shippingCost?: number;
  status?: "ACTIVE" | "CLOSED" | "SENT" | "ARCHIVED";
}

export interface CloneCampaignDto {
  name: string;
  description?: string;
}

// ============================================================================
// Product Types
// ============================================================================

export interface Product {
  id: string;
  campaignId: string;
  name: string;
  price: number;
  weight: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductDto {
  campaignId: string;
  name: string;
  price: number;
  weight: number;
}

export interface UpdateProductDto {
  name?: string;
  price?: number;
  weight?: number;
}

// ============================================================================
// Order Types
// ============================================================================

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
  customerName?: string;
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

export interface CreateOrderDto {
  campaignId: string;
  items: Array<{ productId: string; quantity: number }>;
}

export interface UpdateOrderDto {
  isPaid?: boolean;
  isSeparated?: boolean;
}

export interface UpdateOrderWithItemsDto {
  items?: Array<{ productId: string; quantity: number }>;
}

// ============================================================================
// Message Types (Order Chat)
// ============================================================================

export interface OrderMessage {
  id: string;
  orderId: string;
  senderId: string;
  senderName: string;
  senderType: "ADMIN" | "CUSTOMER";
  message: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  sender: {
    id: string;
    name: string;
    role: "ADMIN" | "CAMPAIGN_CREATOR" | "CUSTOMER";
  };
}

export interface CreateOrderMessageDto {
  orderId: string;
  message: string;
}

export interface UnreadCountResponse {
  count: number;
}

// ============================================================================
// Campaign Message Types (Public Q&A)
// ============================================================================

export interface CampaignMessage {
  id: string;
  campaignId: string;
  senderId: string;
  question: string;
  isEdited: boolean;
  editedAt?: string;
  answer?: string;
  answeredAt?: string;
  answeredBy?: string;
  spamScore: number;
  isPublic: boolean;
  metadata?: {
    factors?: Array<{
      name: string;
      value: number | boolean;
      weight: number;
      description: string;
    }>;
  };
  createdAt: string;
  updatedAt: string;
  sender: {
    id: string;
    name: string;
  };
  answerer?: {
    id: string;
    name: string;
  };
}

export interface CampaignMessageListResponse {
  messages: CampaignMessage[];
  total: number;
  hasMore: boolean;
}

export interface CreateCampaignMessageDto {
  campaignId: string;
  question: string;
}

export interface CreateCampaignMessageResponse {
  message: CampaignMessage;
  canEditUntil: string;
  spamScore: number;
}

export interface EditCampaignMessageDto {
  question: string;
}

export interface AnswerCampaignMessageDto {
  answer: string;
}

export interface CampaignMessageListParams {
  limit?: number;
  offset?: number;
}

// ============================================================================
// Notification Types
// ============================================================================

export interface Notification {
  id: string;
  userId: string;
  type:
    | "CAMPAIGN_READY_TO_SEND"
    | "CAMPAIGN_STATUS_CHANGED"
    | "CAMPAIGN_ARCHIVED"
    | "NEW_MESSAGE";
  title: string;
  message: string;
  isRead: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
}

// ============================================================================
// Feedback Types
// ============================================================================

export interface Feedback {
  id: string;
  userId?: string;
  email?: string;
  type: "BUG" | "SUGGESTION" | "IMPROVEMENT" | "OTHER";
  title: string;
  description: string;
  status: "PENDING" | "IN_PROGRESS" | "RESOLVED" | "DISMISSED";
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateFeedbackDto {
  type: "BUG" | "SUGGESTION" | "IMPROVEMENT" | "OTHER";
  title: string;
  description: string;
  email?: string;
}

export interface UpdateFeedbackDto {
  status: "PENDING" | "IN_PROGRESS" | "RESOLVED" | "DISMISSED";
  adminNotes?: string;
}

export interface FeedbackListParams {
  type?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export interface FeedbackListResponse {
  feedbacks: Feedback[];
  total: number;
}

export interface FeedbackStatsResponse {
  total: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  recent: number;
}

// ============================================================================
// Analytics Types
// ============================================================================

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

// Legacy alias for backward compatibility
export type CampaignAnalytics = Analytics;

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  campaignId: string;
  checks: {
    shippingDistribution: boolean;
    totalCalculation: boolean;
    paidUnpaidSum: boolean;
  };
  details?: {
    expectedShipping: number;
    actualShipping: number;
    expectedTotal: number;
    actualTotal: number;
  };
}
