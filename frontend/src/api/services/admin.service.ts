/**
 * Admin Service
 * Serviço de API para funcionalidades de administrador
 */

import { apiClient } from '../client';
import type {
  DashboardStats,
  DashboardActivity,
  PaginatedUsers,
  AdminUserDetail,
  UpdateUserDto,
  BanUserDto,
  PaginatedCampaigns,
  PaginatedMessages,
  PaginatedAuditLogs,
  AuditLogDetail,
  AuditStats,
  ListUsersParams,
  ListCampaignsParams,
  ListMessagesParams,
  ListAuditLogsParams,
} from '../types';

export const adminService = {
  // Dashboard
  getDashboardStats: () => apiClient.get<DashboardStats>('/admin/dashboard/stats'),
  getDashboardActivity: () => apiClient.get<DashboardActivity>('/admin/dashboard/activity'),

  // Users
  listUsers: (params?: ListUsersParams) =>
    apiClient.get<PaginatedUsers>('/admin/users', { params }),
  getUser: (id: string) => apiClient.get<AdminUserDetail>(`/admin/users/${id}`),
  updateUser: (id: string, data: UpdateUserDto) =>
    apiClient.patch<AdminUserDetail>(`/admin/users/${id}`, data),
  banUser: (id: string, data?: BanUserDto) =>
    apiClient.post(`/admin/users/${id}/ban`, data),
  unbanUser: (id: string) => apiClient.post(`/admin/users/${id}/unban`),
  deleteUser: (id: string) => apiClient.delete(`/admin/users/${id}`),

  // Content - Campaigns
  listCampaigns: (params?: ListCampaignsParams) =>
    apiClient.get<PaginatedCampaigns>('/admin/content/campaigns', { params }),
  getCampaign: (id: string) => apiClient.get(`/admin/content/campaigns/${id}`),
  updateCampaign: (id: string, data: { status?: string }) =>
    apiClient.patch(`/admin/content/campaigns/${id}`, data),
  deleteCampaign: (id: string) => apiClient.delete(`/admin/content/campaigns/${id}`),

  // Content - Messages
  listMessages: (params?: ListMessagesParams) =>
    apiClient.get<PaginatedMessages>('/admin/content/messages', { params }),
  deleteMessage: (id: string) => apiClient.delete(`/admin/content/messages/${id}`),

  // Audit Logs
  listAuditLogs: (params?: ListAuditLogsParams) =>
    apiClient.get<PaginatedAuditLogs>('/admin/audit', { params }),
  getAuditLog: (id: string) => apiClient.get<AuditLogDetail>(`/admin/audit/${id}`),
  getAuditStats: (params?: { startDate?: string; endDate?: string }) =>
    apiClient.get<AuditStats>('/admin/audit/stats/summary', { params }),
  getAuditByAdmin: (adminId: string, limit?: number) =>
    apiClient.get(`/admin/audit/admin/${adminId}`, { params: { limit } }),
  getAuditByTarget: (targetType: string, targetId: string, limit?: number) =>
    apiClient.get(`/admin/audit/target/${targetType}/${targetId}`, { params: { limit } }),
};
