/**
 * Authentication API Client
 * Handles all authentication-related API calls
 */

import axios from 'axios';
import { StoredUser } from './authStorage';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role?: 'CUSTOMER' | 'CAMPAIGN_CREATOR';
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

export const authApi = {
  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await axios.post<AuthResponse>(`${API_URL}/api/auth/register`, data);
    return response.data;
  },

  /**
   * Login with email and password
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await axios.post<AuthResponse>(`${API_URL}/api/auth/login`, data);
    return response.data;
  },

  /**
   * Refresh access token using refresh token
   */
  async refresh(refreshToken: string): Promise<RefreshResponse> {
    const response = await axios.post<RefreshResponse>(
      `${API_URL}/api/auth/refresh`,
      { refreshToken }
    );
    return response.data;
  },

  /**
   * Logout (invalidate refresh token)
   */
  async logout(refreshToken: string): Promise<void> {
    await axios.post(`${API_URL}/api/auth/logout`, { refreshToken });
  },

  /**
   * Get current user info
   */
  async me(accessToken: string): Promise<StoredUser> {
    const response = await axios.get<StoredUser>(`${API_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  },
};
