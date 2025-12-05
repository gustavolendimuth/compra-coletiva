/**
 * Authentication Service
 * Handles user registration, login, logout, and token management
 */

import { authClient } from '../client';
import type {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  RefreshResponse,
  StoredUser
} from '../types';

export const authService = {
  /**
   * Register a new user
   * @param data - User registration data (name, email, password, role)
   * @returns Authentication response with tokens and user data
   */
  register: (data: RegisterRequest) =>
    authClient.post<AuthResponse>('/auth/register', data).then(res => res.data),

  /**
   * Login with email and password
   * @param data - Login credentials (email, password)
   * @returns Authentication response with tokens and user data
   */
  login: (data: LoginRequest) =>
    authClient.post<AuthResponse>('/auth/login', data).then(res => res.data),

  /**
   * Refresh access token using refresh token
   * @param refreshToken - Current refresh token
   * @returns New access token
   */
  refresh: (refreshToken: string) =>
    authClient.post<RefreshResponse>('/auth/refresh', { refreshToken }).then(res => res.data),

  /**
   * Logout and invalidate refresh token
   * @param refreshToken - Refresh token to invalidate
   */
  logout: (refreshToken: string) =>
    authClient.post<void>('/auth/logout', { refreshToken }).then(res => res.data),

  /**
   * Get current user information
   * @param accessToken - Current access token
   * @returns User data
   */
  me: (accessToken: string) =>
    authClient.get<{ user: StoredUser }>('/auth/me', {
      headers: { Authorization: `Bearer ${accessToken}` }
    }).then(res => res.data.user)
};
