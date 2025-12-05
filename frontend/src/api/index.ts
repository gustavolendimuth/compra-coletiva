/**
 * API Module - Barrel Export
 * Central export point for all API services and types
 */

// Export API clients
export { apiClient, authClient } from './client';

// Export configuration
export { API_URL, apiConfig } from './config';

// Export all types
export * from './types';

// Export all services
export { authService } from './services/auth.service';
export { campaignService } from './services/campaign.service';
export { productService } from './services/product.service';
export { orderService } from './services/order.service';
export { orderMessageService, campaignMessageService } from './services/message.service';
export { notificationService } from './services/notification.service';
export { feedbackService } from './services/feedback.service';
export { analyticsService } from './services/analytics.service';
export { validationService } from './services/validation.service';

// Legacy exports for backward compatibility
export { authService as authApi } from './services/auth.service';
export { campaignService as campaignApi } from './services/campaign.service';
export { productService as productApi } from './services/product.service';
export { orderService as orderApi } from './services/order.service';
export { orderMessageService as messageApi } from './services/message.service';
export { campaignMessageService as campaignMessageApi } from './services/message.service';
export { feedbackService as feedbackApi } from './services/feedback.service';
export { analyticsService as analyticsApi } from './services/analytics.service';

// Export api client as default 'api' for backward compatibility
export { apiClient as api } from './client';
