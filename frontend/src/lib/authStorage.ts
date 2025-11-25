/**
 * Authentication Storage Utilities
 * Manages access and refresh tokens in localStorage
 */

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';

export interface StoredUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'CAMPAIGN_CREATOR' | 'CUSTOMER';
  googleId?: string;
}

export const authStorage = {
  // Token management
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  setAccessToken(token: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  },

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setRefreshToken(token: string): void {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  },

  // User management
  getUser(): StoredUser | null {
    const userJson = localStorage.getItem(USER_KEY);
    if (!userJson) return null;
    try {
      return JSON.parse(userJson);
    } catch {
      return null;
    }
  },

  setUser(user: StoredUser): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  // Set both tokens and user (for login/register)
  setAuth(accessToken: string, refreshToken: string, user: StoredUser): void {
    this.setAccessToken(accessToken);
    this.setRefreshToken(refreshToken);
    this.setUser(user);
  },

  // Clear all auth data (for logout)
  clearAuth(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getAccessToken() && !!this.getUser();
  },
};
