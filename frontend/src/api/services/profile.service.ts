/**
 * Profile Service - API para gerenciamento de perfil do usuário
 */

import { apiClient } from '../client';
import type {
  UpdateProfileDto,
  UpdateProfileResponse,
  AvatarUploadResponse,
  ChangeEmailDto,
  ChangeEmailResponse,
  VerifyEmailResponse,
  DeleteAccountDto,
  ExportDataResponse,
} from '../types';

export const profileService = {
  /**
   * Atualiza dados do perfil (nome, telefone, senha)
   */
  update: (data: UpdateProfileDto) =>
    apiClient.patch<UpdateProfileResponse>('/profile', data).then((res) => res.data),

  /**
   * Upload de avatar
   */
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return apiClient
      .post<AvatarUploadResponse>('/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((res) => res.data);
  },

  /**
   * Remove avatar
   */
  deleteAvatar: () =>
    apiClient.delete<{ message: string }>('/profile/avatar').then((res) => res.data),

  /**
   * Solicita troca de email (envia verificação)
   */
  requestEmailChange: (data: ChangeEmailDto) =>
    apiClient.post<ChangeEmailResponse>('/profile/change-email', data).then((res) => res.data),

  /**
   * Confirma troca de email com token
   */
  verifyEmailChange: (token: string) =>
    apiClient
      .post<VerifyEmailResponse>('/profile/verify-email', { token })
      .then((res) => res.data),

  /**
   * Exclui conta (soft delete)
   */
  deleteAccount: (data?: DeleteAccountDto) =>
    apiClient.delete<{ message: string }>('/profile', { data }).then((res) => res.data),

  /**
   * Exporta dados do usuário (LGPD)
   */
  exportData: () =>
    apiClient.get<ExportDataResponse>('/profile/export').then((res) => res.data),
};
