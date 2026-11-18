'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authStorage, StoredUser, PendingActionData } from '../lib/authStorage';
import { authApi, RegisterRequest, RegisterResponse, LoginRequest, AuthResponse } from '../lib/authApi';
import { reconnectSocket } from '../lib/socket';
import { getApiErrorCode, getApiErrorDetails, getApiErrorMessage } from '../lib/apiError';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: StoredUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<RegisterResponse>;
  /** Confirma o email e abre a sessão; true quando já redirecionou para completar o perfil */
  verifyEmail: (token: string) => Promise<boolean>;
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

  const needsCompleteProfile = useCallback(
    (currentUser: StoredUser | null): boolean =>
      !!currentUser &&
      (!!currentUser.legalAcceptanceRequired ||
        !currentUser.phoneCompleted ||
        !currentUser.addressCompleted),
    []
  );

  const redirectToCompleteProfileIfNeeded = useCallback(
    (currentUser: StoredUser | null): boolean => {
      if (!needsCompleteProfile(currentUser)) {
        return false;
      }

      if (typeof window !== "undefined" && window.location.pathname !== "/completar-perfil") {
        window.location.href = "/completar-perfil";
      }
      return true;
    },
    [needsCompleteProfile]
  );

  // Initialize auth on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedUser = authStorage.getUser();

      // Access token só existe em memória: após recarregar, obtém um novo via refresh
      if (storedUser) {
        try {
          const response = await authApi.refresh();
          setUser(response.user);
          redirectToCompleteProfileIfNeeded(response.user);
        } catch {
          authStorage.clearAuth();
          setUser(null);
        }
      }

      setIsLoading(false);
    };

    initAuth();
  }, [redirectToCompleteProfileIfNeeded]);

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

  // Abre a sessão no app depois de login ou confirmação de email
  // Devolve true quando redirecionou para completar o perfil
  const startSession = (response: AuthResponse, welcomeMessage: string): boolean => {
    authStorage.setAuth(response.accessToken, response.user);
    setUser(response.user);
    // Reconnect socket with new auth token
    reconnectSocket();
    toast.success(welcomeMessage);

    if (redirectToCompleteProfileIfNeeded(response.user)) {
      return true;
    }

    // Execute pending action if exists
    if (pendingAction) {
      setTimeout(() => {
        pendingAction();
        setPendingAction(null);
      }, 100);
    }
    return false;
  };

  const login = async (data: LoginRequest) => {
    try {
      const response = await authApi.login(data);
      startSession(response, `Bem-vindo, ${response.user.name}!`);
    } catch (error: unknown) {
      // Email não confirmado: o modal mostra a tela de confirmação no lugar do toast
      if (getApiErrorCode(error) !== 'EMAIL_NOT_VERIFIED') {
        toast.error(getApiErrorMessage(error, 'Erro ao fazer login'));
      }
      throw error;
    }
  };

  // Cadastro não abre sessão: a conta só ativa pelo link enviado ao email
  const register = async (data: RegisterRequest) => {
    try {
      return await authApi.register(data);
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

  const verifyEmail = async (token: string) => {
    const response = await authApi.verifyEmail(token);
    return startSession(response, `Email confirmado! Bem-vindo, ${response.user.name}!`);
  };

  const logout = async () => {
    const accessToken = authStorage.getAccessToken();
    if (accessToken) {
      try {
        await authApi.logout();
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
    verifyEmail,
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

