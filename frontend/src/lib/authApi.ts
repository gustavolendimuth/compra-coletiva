/**
 * Authentication API Client
 * Handles all authentication-related API calls
 */

import { StoredUser } from './authStorage';

// Import api instance to avoid circular dependency
// We'll create a separate axios instance for auth to prevent circular deps
import axios from 'axios';
import { API_URL } from './env';

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
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

// Create a separate axios instance for auth to avoid circular dependency with api.ts
const authAxios = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const authApi = {
  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await authAxios.post<AuthResponse>('/api/auth/register', data);
    return response.data;
  },

  /**
   * Login with email and password
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await authAxios.post<AuthResponse>('/api/auth/login', data);
    return response.data;
  },

  /**
   * Refresh access token using refresh token
   */
  async refresh(refreshToken: string): Promise<RefreshResponse> {
    const response = await authAxios.post<RefreshResponse>(
      '/api/auth/refresh',
      { refreshToken }
    );
    return response.data;
  },

  /**
   * Logout (invalidate refresh token)
   */
  async logout(refreshToken: string): Promise<void> {
    await authAxios.post('/api/auth/logout', { refreshToken });
  },

  /**
   * Get current user info
   */
  async me(accessToken: string): Promise<StoredUser> {
    const response = await authAxios.get<{ user: StoredUser }>('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data.user;
  },
};
