/**
 * Authentication Service
 * Handles user registration, login, logout, and token management
 */

import { authClient, apiClient } from "../client";
import type {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  RefreshResponse,
  StoredUser,
  CompletePhoneRequest,
  CompleteAddressRequest,
} from "../types";

export const authService = {
  /**
   * Register a new user
   * @param data - User registration data (name, email, password, role)
   * @returns Authentication response with tokens and user data
   */
  register: (data: RegisterRequest) =>
    authClient
      .post<AuthResponse>("/auth/register", data)
      .then((res) => res.data),

  /**
   * Login with email and password
   * @param data - Login credentials (email, password)
   * @returns Authentication response with tokens and user data
   */
  login: (data: LoginRequest) =>
    authClient.post<AuthResponse>("/auth/login", data).then((res) => res.data),

  /**
   * Refresh access token using refresh token
   * Refresh token is sent automatically via HttpOnly cookie (withCredentials: true)
   * @returns New access token
   */
  refresh: () =>
    authClient
      .post<RefreshResponse>("/auth/refresh")
      .then((res) => res.data),

  /**
   * Logout and invalidate refresh token
   * Refresh token is automatically read from HttpOnly cookie on the server
   */
  logout: () => apiClient.post<void>("/auth/logout").then((res) => res.data),

  /**
   * Get current user information
   * @param accessToken - Current access token
   * @returns User data
   */
  me: (accessToken: string) =>
    authClient
      .get<{ user: StoredUser }>("/auth/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      .then((res) => res.data.user),

  /**
   * Complete phone registration for OAuth users
   * @param data - Phone number data
   * @returns Updated user data
   */
  completePhone: (data: CompletePhoneRequest) =>
    apiClient
      .patch<{ user: StoredUser }>("/auth/complete-phone", data)
      .then((res) => res.data.user),

  /**
   * Check if a name already exists in the database
   * @param name - Name to check
   * @returns Information about name availability
   */
  checkName: (name: string) =>
    authClient
      .get<{ exists: boolean; count: number; suggestion: string | null }>(
        `/auth/check-name?name=${encodeURIComponent(name)}`
      )
      .then((res) => res.data),

  /**
   * Complete address registration for users
   */
  completeAddress: (data: CompleteAddressRequest) =>
    apiClient
      .patch<{ user: StoredUser }>('/auth/complete-address', data)
      .then((res) => res.data.user),
};
