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
  phoneCompleted?: boolean;
  addressCompleted?: boolean;
  role: "ADMIN" | "CAMPAIGN_CREATOR" | "CUSTOMER";
  googleId?: string;
  defaultZipCode?: string | null;
  defaultAddress?: string | null;
  defaultAddressNumber?: string | null;
  defaultNeighborhood?: string | null;
  defaultCity?: string | null;
  defaultState?: string | null;
  defaultLatitude?: number | null;
  defaultLongitude?: number | null;
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

export interface CompletePhoneRequest {
  phone: string;
}

// ============================================================================
// Campaign Types
// ============================================================================

export type PixKeyType = "CPF" | "CNPJ" | "EMAIL" | "PHONE" | "RANDOM";

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
  pixKey?: string;
  pixType?: PixKeyType;
  pixName?: string;
  pixVisibleAtStatus: "ACTIVE" | "CLOSED" | "SENT" | "ARCHIVED";
  pickupZipCode?: string;
  pickupAddress?: string;
  pickupAddressNumber?: string;
  pickupComplement?: string;
  pickupNeighborhood?: string;
  pickupCity?: string;
  pickupState?: string;
  pickupLatitude?: number | null;
  pickupLongitude?: number | null;
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
  distance?: number;
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
  pixKey?: string;
  pixType?: PixKeyType;
  pixName?: string;
  pixVisibleAtStatus?: "ACTIVE" | "CLOSED" | "SENT" | "ARCHIVED";
  pickupZipCode?: string;
  pickupAddress?: string;
  pickupAddressNumber?: string;
  pickupComplement?: string;
  pickupNeighborhood?: string;
  pickupCity?: string;
  pickupState?: string;
}

export interface UpdateCampaignDto {
  name?: string;
  description?: string;
  deadline?: string;
  shippingCost?: number;
  status?: "ACTIVE" | "CLOSED" | "SENT" | "ARCHIVED";
  pixKey?: string | null;
  pixType?: PixKeyType | null;
  pixName?: string | null;
  pixVisibleAtStatus?: "ACTIVE" | "CLOSED" | "SENT" | "ARCHIVED";
  pickupZipCode?: string;
  pickupAddress?: string;
  pickupAddressNumber?: string;
  pickupComplement?: string;
  pickupNeighborhood?: string;
  pickupCity?: string;
  pickupState?: string;
}

export interface CloneCampaignDto {
  name: string;
  description?: string;
}

export interface CampaignOrdersSummaryResponse {
  campaignId: string;
  campaignName: string;
  campaignSlug: string | null;
  generatedAt: string;
  ordersCount: number;
  totalAmount: number;
  summaryText: string;
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
  paymentProofUrl?: string;
  paymentProofKey?: string;
  paymentProofStorageType?: 'S3' | 'LOCAL';
}

export interface CreateOrderDto {
  campaignId: string;
  items: Array<{ productId: string; quantity: number }>;
}

export interface OrderFormItem {
  productId: string;
  quantity: number | "";
}

export interface OrderForm {
  campaignId: string;
  items: OrderFormItem[];
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

// ============================================================================
// Email Preference Types
// ============================================================================

export interface EmailPreference {
  id: string;
  userId: string;
  emailEnabled: boolean;
  campaignReadyToSend: boolean;
  campaignStatusChanged: boolean;
  campaignArchived: boolean;
  newMessage: boolean;
  digestEnabled: boolean;
  digestFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  createdAt: string;
  updatedAt: string;
}

export interface UpdateEmailPreferenceDto {
  emailEnabled?: boolean;
  campaignReadyToSend?: boolean;
  campaignStatusChanged?: boolean;
  campaignArchived?: boolean;
  newMessage?: boolean;
  digestEnabled?: boolean;
  digestFrequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
}

export interface UnsubscribeResponse {
  success: boolean;
  message: string;
}

export interface ResubscribeResponse {
  success: boolean;
  message: string;
  preferences: EmailPreference;
}

// ============================================================================
// Profile Types
// ============================================================================

export interface ProfileUser extends StoredUser {
  avatarUrl?: string;
  avatarKey?: string;
  avatarStorageType?: 'S3' | 'LOCAL';
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileDto {
  name?: string;
  phone?: string;
  currentPassword?: string;
  newPassword?: string;
}

export interface UpdateProfileResponse {
  message: string;
  user: ProfileUser;
}

export interface AvatarUploadResponse {
  message: string;
  avatarUrl: string;
}

export interface ChangeEmailDto {
  newEmail: string;
  password: string;
}

export interface ChangeEmailResponse {
  message: string;
  expiresAt: string;
}

export interface VerifyEmailResponse {
  data: {
    message: string;
    email: string;
  };
}

export interface DeleteAccountDto {
  password?: string;
  reason?: string;
}

export interface ExportDataResponse {
  exportedAt: string;
  userData: ProfileUser & {
    orders: Order[];
    campaigns: Campaign[];
    notifications: Notification[];
    feedback: Feedback[];
    emailPreference?: EmailPreference;
  };
}

// ============================================================================
// Admin Types
// ============================================================================

// Dashboard
export interface DashboardStats {
  stats: {
    users: { total: number };
    campaigns: { total: number; active: number };
    orders: { total: number };
    revenue: { total: number };
  };
  recentUsers: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
  }>;
}

export interface DashboardActivity {
  recentCampaigns: Array<{
    id: string;
    name: string;
    status: string;
    createdAt: string;
    creator: {
      id: string;
      name: string;
      email: string;
    };
  }>;
  recentOrders: Array<{
    id: string;
    total: number;
    isPaid: boolean;
    createdAt: string;
    customer: {
      id: string;
      name: string;
      email: string;
    };
    campaign: {
      id: string;
      name: string;
    };
  }>;
}

// Users
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'CAMPAIGN_CREATOR' | 'CUSTOMER';
  isBanned: boolean;
  isLegacyUser: boolean;
  createdAt: string;
  spamScore: number;
  messageCount: number;
  answeredCount: number;
  _count: {
    campaigns: number;
    orders: number;
  };
}

export interface AdminUserDetail extends AdminUser {
  avatarUrl?: string;
  campaigns: Array<{
    id: string;
    name: string;
    status: string;
    createdAt: string;
  }>;
  orders: Array<{
    id: string;
    total: number;
    isPaid: boolean;
    createdAt: string;
    campaign: {
      id: string;
      name: string;
    };
  }>;
  _count: {
    campaigns: number;
    orders: number;
    sentCampaignMessages: number;
  };
}

export interface PaginatedUsers {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ListUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: 'ADMIN' | 'CAMPAIGN_CREATOR' | 'CUSTOMER';
  isBanned?: boolean;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  role?: 'ADMIN' | 'CAMPAIGN_CREATOR' | 'CUSTOMER';
}

export interface BanUserDto {
  reason?: string;
}

// Content - Campaigns
export interface PaginatedCampaigns {
  campaigns: Array<
    Campaign & {
      creator: {
        id: string;
        name: string;
        email: string;
      };
      _count: {
        products: number;
        orders: number;
      };
    }
  >;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ListCampaignsParams {
  page?: number;
  limit?: number;
  status?: 'ACTIVE' | 'CLOSED' | 'SENT' | 'ARCHIVED';
  search?: string;
}

// Content - Messages
export interface AdminMessage {
  id: string;
  message: string;
  spamScore: number;
  createdAt: string;
  author: {
    id: string;
    name: string;
    email: string;
    spamScore: number;
  };
  campaign: {
    id: string;
    name: string;
  };
}

export interface PaginatedMessages {
  messages: AdminMessage[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ListMessagesParams {
  page?: number;
  limit?: number;
  minSpamScore?: number;
}

// Audit Logs
export type AuditAction =
  | 'USER_LIST'
  | 'USER_VIEW'
  | 'USER_EDIT'
  | 'USER_BAN'
  | 'USER_UNBAN'
  | 'USER_DELETE'
  | 'ROLE_CHANGE'
  | 'CAMPAIGN_LIST'
  | 'CAMPAIGN_VIEW'
  | 'CAMPAIGN_EDIT'
  | 'CAMPAIGN_ARCHIVE'
  | 'CAMPAIGN_RESTORE'
  | 'CAMPAIGN_DELETE'
  | 'MESSAGE_LIST'
  | 'MESSAGE_DELETE'
  | 'AUDIT_VIEW'
  | 'SYSTEM_VIEW'
  | 'SETTINGS_CHANGE';

export type AuditTargetType = 'USER' | 'CAMPAIGN' | 'ORDER' | 'MESSAGE' | 'FEEDBACK' | 'SYSTEM';

export interface AuditLog {
  id: string;
  adminId: string | null;
  admin?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: string | null;
  details: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface AuditLogDetail extends AuditLog {}

export interface PaginatedAuditLogs {
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ListAuditLogsParams {
  page?: number;
  limit?: number;
  adminId?: string;
  action?: AuditAction;
  targetType?: AuditTargetType;
  targetId?: string;
  startDate?: string;
  endDate?: string;
}

export interface AuditStats {
  total: number;
  byAction: Array<{
    action: AuditAction;
    count: number;
  }>;
  topAdmins: Array<{
    admin: {
      id: string;
      name: string;
      email: string;
    } | null;
    count: number;
  }>;
}

// ============================================================================
// Geocoding Types
// ============================================================================

export interface GeocodingResult {
  zipCode: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
}

// ============================================================================
// Pickup Location Types
// ============================================================================

export interface PickupLocation {
  pickupZipCode: string;
  pickupAddress: string;
  pickupAddressNumber: string;
  pickupComplement?: string;
  pickupNeighborhood: string;
  pickupCity: string;
  pickupState: string;
  pickupLatitude: number | null;
  pickupLongitude: number | null;
}

// ============================================================================
// User Address Types
// ============================================================================

export interface UserAddress {
  defaultZipCode: string | null;
  defaultAddress: string | null;
  defaultAddressNumber: string | null;
  defaultNeighborhood: string | null;
  defaultCity: string | null;
  defaultState: string | null;
  defaultLatitude: number | null;
  defaultLongitude: number | null;
  addressCompleted: boolean;
}

export interface CompleteAddressRequest {
  zipCode: string;
  address: string;
  addressNumber: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}

// ============================================================================
// Distance Types
// ============================================================================

export interface DistanceResult {
  campaignId: string;
  from: {
    zipCode: string;
    city: string;
    state: string;
    latitude: number;
    longitude: number;
  };
  to: {
    zipCode: string;
    address: string;
    number: string;
    city: string;
    state: string;
    latitude: number;
    longitude: number;
  };
  distanceKm: number;
  route?: {
    coordinates: Array<[number, number]>;
    durationMin?: number;
  };
}
