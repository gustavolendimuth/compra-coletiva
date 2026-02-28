/**
 * Authentication Storage Utilities
 * Manages access and refresh tokens in localStorage and cookies
 * Cookies are used for middleware route protection (server-side)
 * localStorage is used for client-side access
 */

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_KEY = "user";
const PENDING_ACTION_KEY = "pendingAction";
const RETURN_URL_KEY = "returnUrl";
const PENDING_ACTION_DATA_KEY = "pendingActionData";

// Cookie names for middleware
const AUTH_TOKEN_COOKIE = "auth-token";
const USER_ROLE_COOKIE = "user-role";

// Helper to set a cookie
function setCookie(name: string, value: string, days = 7): void {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

// Helper to delete a cookie
function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

export interface PendingActionData {
  type: string;
  payload: unknown;
}

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

export const authStorage = {
  // Token management
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  setAccessToken(token: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
    setCookie(AUTH_TOKEN_COOKIE, token);
  },

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setRefreshToken(token: string): void {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  },

  setTokens(tokens: { accessToken: string; refreshToken: string }): void {
    this.setAccessToken(tokens.accessToken);
    this.setRefreshToken(tokens.refreshToken);
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
    setCookie(USER_ROLE_COOKIE, user.role);
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
    deleteCookie(AUTH_TOKEN_COOKIE);
    deleteCookie(USER_ROLE_COOKIE);
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getAccessToken() && !!this.getUser();
  },

  // Pending action management (used for OAuth flow to persist actions across redirects)
  // Using localStorage instead of sessionStorage because OAuth redirects across domains
  setPendingActionFlag(): void {
    localStorage.setItem(PENDING_ACTION_KEY, "true");
  },

  hasPendingAction(): boolean {
    return localStorage.getItem(PENDING_ACTION_KEY) === "true";
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

