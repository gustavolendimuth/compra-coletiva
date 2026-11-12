/**
 * Authentication Storage Utilities
 * Access token fica só em memória (nunca em localStorage nem em cookie legível por JS).
 * O cookie `auth-token` é apenas um indicador de sessão (`1`) para o middleware.
 * Ao recarregar a página, o access token é obtido de novo via POST /auth/refresh.
 */

const ACCESS_TOKEN_KEY = "accessToken";
const USER_KEY = "user";
const PENDING_ACTION_KEY = "pendingAction";
const RETURN_URL_KEY = "returnUrl";
const PENDING_ACTION_DATA_KEY = "pendingActionData";

// Cookie names for middleware
const AUTH_TOKEN_COOKIE = "auth-token";
const USER_ROLE_COOKIE = "user-role";
// Indicador de sessão (sem token); mesma duração do refresh token
const SESSION_INDICATOR_VALUE = "1";
const SESSION_COOKIE_DAYS = 30;

// Access token em memória do módulo (uma aba)
let accessTokenInMemory: string | null = null;

function getLocalStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function safeStorageGet(key: string): string | null {
  const storage = getLocalStorage();
  if (!storage) {
    return null;
  }

  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function safeStorageSet(key: string, value: string): void {
  const storage = getLocalStorage();
  if (!storage) {
    return;
  }

  try {
    storage.setItem(key, value);
  } catch {
    // Ignore storage write errors (Safari private mode / restricted contexts).
  }
}

function safeStorageRemove(key: string): void {
  const storage = getLocalStorage();
  if (!storage) {
    return;
  }

  try {
    storage.removeItem(key);
  } catch {
    // Ignore storage remove errors (Safari private mode / restricted contexts).
  }
}

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
  hasPassword?: boolean;
  phoneCompleted?: boolean;
  addressCompleted?: boolean;
  legalAcceptanceRequired?: boolean;
  termsAcceptedAt?: string | null;
  termsAcceptedVersion?: string | null;
  privacyAcceptedAt?: string | null;
  privacyAcceptedVersion?: string | null;
  salesDisclaimerAcceptedAt?: string | null;
  salesDisclaimerAcceptedVersion?: string | null;
  hideNameInCampaigns?: boolean;
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
    return accessTokenInMemory;
  },

  setAccessToken(token: string): void {
    accessTokenInMemory = token;
    // Remove token persistido por versões anteriores
    safeStorageRemove(ACCESS_TOKEN_KEY);
    setCookie(AUTH_TOKEN_COOKIE, SESSION_INDICATOR_VALUE, SESSION_COOKIE_DAYS);
  },

  // User management
  getUser(): StoredUser | null {
    const userJson = safeStorageGet(USER_KEY);
    if (!userJson) return null;
    try {
      return JSON.parse(userJson);
    } catch {
      return null;
    }
  },

  setUser(user: StoredUser): void {
    safeStorageSet(USER_KEY, JSON.stringify(user));
    setCookie(USER_ROLE_COOKIE, user.role, SESSION_COOKIE_DAYS);
  },

  // Set access token and user (refresh token fica apenas no cookie HttpOnly)
  setAuth(accessToken: string, user: StoredUser): void {
    this.setAccessToken(accessToken);
    this.setUser(user);
  },

  // Clear all auth data (for logout)
  clearAuth(): void {
    accessTokenInMemory = null;
    safeStorageRemove(ACCESS_TOKEN_KEY);
    safeStorageRemove("refreshToken");
    safeStorageRemove(USER_KEY);
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
    safeStorageSet(PENDING_ACTION_KEY, "true");
  },

  hasPendingAction(): boolean {
    return safeStorageGet(PENDING_ACTION_KEY) === "true";
  },

  clearPendingActionFlag(): void {
    safeStorageRemove(PENDING_ACTION_KEY);
  },

  // Return URL management (to redirect back to original page after OAuth)
  // Using localStorage instead of sessionStorage because OAuth redirects across domains
  // and sessionStorage doesn't persist across different domains
  setReturnUrl(url: string): void {
    safeStorageSet(RETURN_URL_KEY, url);
  },

  getReturnUrl(): string | null {
    return safeStorageGet(RETURN_URL_KEY);
  },

  clearReturnUrl(): void {
    safeStorageRemove(RETURN_URL_KEY);
  },

  // Pending action data (serializable metadata about the action)
  // Using localStorage instead of sessionStorage because OAuth redirects across domains
  setPendingActionData(data: PendingActionData): void {
    safeStorageSet(PENDING_ACTION_DATA_KEY, JSON.stringify(data));
  },

  getPendingActionData(): PendingActionData | null {
    const data = safeStorageGet(PENDING_ACTION_DATA_KEY);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  },

  clearPendingActionData(): void {
    safeStorageRemove(PENDING_ACTION_DATA_KEY);
  },
};

