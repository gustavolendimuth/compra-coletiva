/**
 * Authentication Storage Utilities
 * Manages access and refresh tokens in localStorage
 */

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';
const PENDING_ACTION_KEY = 'pendingAction';
const RETURN_URL_KEY = 'returnUrl';
const PENDING_ACTION_DATA_KEY = 'pendingActionData';

export interface PendingActionData {
  type: string;
  payload: any;
}

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

  // Pending action management (used for OAuth flow to persist actions across redirects)
  // Using localStorage instead of sessionStorage because OAuth redirects across domains
  setPendingActionFlag(): void {
    localStorage.setItem(PENDING_ACTION_KEY, 'true');
  },

  hasPendingAction(): boolean {
    return localStorage.getItem(PENDING_ACTION_KEY) === 'true';
  },

  clearPendingActionFlag(): void {
    localStorage.removeItem(PENDING_ACTION_KEY);
  },

  // Return URL management (to redirect back to original page after OAuth)
  // Using localStorage instead of sessionStorage because OAuth redirects across domains
  // and sessionStorage doesn't persist across different domains
  setReturnUrl(url: string): void {
    localStorage.setItem(RETURN_URL_KEY, url);
  },

  getReturnUrl(): string | null {
    return localStorage.getItem(RETURN_URL_KEY);
  },

  clearReturnUrl(): void {
    localStorage.removeItem(RETURN_URL_KEY);
  },

  // Pending action data (serializable metadata about the action)
  // Using localStorage instead of sessionStorage because OAuth redirects across domains
  setPendingActionData(data: PendingActionData): void {
    localStorage.setItem(PENDING_ACTION_DATA_KEY, JSON.stringify(data));
  },

  getPendingActionData(): PendingActionData | null {
    const data = localStorage.getItem(PENDING_ACTION_DATA_KEY);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  },

  clearPendingActionData(): void {
    localStorage.removeItem(PENDING_ACTION_DATA_KEY);
  },
};
