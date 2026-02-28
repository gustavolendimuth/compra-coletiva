'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authStorage, StoredUser, PendingActionData } from '../lib/authStorage';
import { authApi, RegisterRequest, LoginRequest } from '../lib/authApi';
import { reconnectSocket } from '../lib/socket';
import { getApiErrorDetails, getApiErrorMessage } from '../lib/apiError';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: StoredUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: StoredUser | null) => void;
  requireAuth: (callback: () => void, metadata?: PendingActionData) => void;
  setPendingAction: (action: (() => void) | null) => void;
  hasPendingAction: () => boolean;
  executePendingActionFromData: (data: PendingActionData) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Initialize auth on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedUser = authStorage.getUser();
      const accessToken = authStorage.getAccessToken();

      if (storedUser && accessToken) {
        try {
          // Verify token is still valid by fetching current user
          const currentUser = await authApi.me(accessToken);
          setUser(currentUser);
          authStorage.setUser(currentUser);
        } catch (error) {
          // Token invalid, try to refresh
          const refreshToken = authStorage.getRefreshToken();
          if (refreshToken) {
            try {
              const { accessToken: newAccessToken } = await authApi.refresh(refreshToken);
              authStorage.setAccessToken(newAccessToken);
              const currentUser = await authApi.me(newAccessToken);
              setUser(currentUser);
              authStorage.setUser(currentUser);
            } catch {
              // Refresh failed, clear auth
              authStorage.clearAuth();
              setUser(null);
            }
          } else {
            authStorage.clearAuth();
            setUser(null);
          }
        }
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  // Listen for pending action execution after email/password login
  useEffect(() => {
    const handleExecutePendingAction = () => {
      if (pendingAction && user) {
        setTimeout(() => {
          pendingAction();
          setPendingAction(null);
        }, 100);
      }
    };

    window.addEventListener('executePendingAction', handleExecutePendingAction);
    return () => {
      window.removeEventListener('executePendingAction', handleExecutePendingAction);
    };
  }, [pendingAction, user]);

  const login = async (data: LoginRequest) => {
    try {
      const response = await authApi.login(data);
      authStorage.setAuth(response.accessToken, response.refreshToken, response.user);
      setUser(response.user);
      // Reconnect socket with new auth token
      reconnectSocket();
      toast.success(`Bem-vindo, ${response.user.name}!`);

      // Execute pending action if exists
      if (pendingAction) {
        setTimeout(() => {
          pendingAction();
          setPendingAction(null);
        }, 100);
      }
    } catch (error: unknown) {
      const message = getApiErrorMessage(error, 'Erro ao fazer login');
      toast.error(message);
      throw error;
    }
  };

  const register = async (data: RegisterRequest) => {
    try {
      const response = await authApi.register(data);
      authStorage.setAuth(response.accessToken, response.refreshToken, response.user);
      setUser(response.user);
      // Reconnect socket with new auth token
      reconnectSocket();
      toast.success(`Conta criada com sucesso! Bem-vindo, ${response.user.name}!`);

      // Execute pending action if exists
      if (pendingAction) {
        setTimeout(() => {
          pendingAction();
          setPendingAction(null);
        }, 100);
      }
    } catch (error: unknown) {
      const details = getApiErrorDetails<Array<{ message?: string }>>(error);
      const detailMessage =
        Array.isArray(details) && details.length > 0
          ? details[0]?.message
          : null;
      const message = detailMessage || getApiErrorMessage(error, 'Erro ao criar conta');
      toast.error(message);
      throw error;
    }
  };

  const logout = async () => {
    const refreshToken = authStorage.getRefreshToken();
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch (error) {
        // Ignore logout errors
      }
    }
    authStorage.clearAuth();
    setUser(null);
    // Reconnect socket without auth token
    reconnectSocket();
    toast.success('Você saiu da sua conta');
  };

  const refreshUser = async () => {
    const accessToken = authStorage.getAccessToken();
    if (accessToken) {
      try {
        const currentUser = await authApi.me(accessToken);
        setUser(currentUser);
        authStorage.setUser(currentUser);
      } catch (error) {
        // Ignore refresh errors
      }
    }
  };

  // Helper function to check if user is authenticated before an action
  const requireAuth = (callback: () => void, metadata?: PendingActionData) => {
    if (!user) {
      // Store the pending action to execute after login
      setPendingAction(() => callback);

      // If metadata provided, also store it in sessionStorage for OAuth flow
      if (metadata) {
        authStorage.setPendingActionData(metadata);
      }

      // Store current URL for OAuth redirect back
      const currentUrl = window.location.pathname + window.location.search;
      console.log('[requireAuth] Salvando returnUrl:', currentUrl);
      authStorage.setReturnUrl(currentUrl);

      toast.error('Você precisa fazer login para realizar esta ação');
      // Trigger auth modal (we'll implement this in the modal component)
      window.dispatchEvent(new CustomEvent('openAuthModal'));
      return;
    }
    callback();
  };

  // Check if there's a pending action
  const hasPendingAction = () => {
    return pendingAction !== null;
  };

  // Execute pending action from serialized data (used after OAuth redirect)
  const executePendingActionFromData = (data: PendingActionData) => {
    // Dispatch a custom event with the action data
    // This will be caught by components that need to execute the action
    window.dispatchEvent(new CustomEvent('executePendingActionFromData', { detail: data }));
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
    setUser,
    requireAuth,
    setPendingAction,
    hasPendingAction,
    executePendingActionFromData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

