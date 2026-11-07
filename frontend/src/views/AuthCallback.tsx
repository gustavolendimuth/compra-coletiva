'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { authStorage, StoredUser } from '../lib/authStorage';
import { refreshSession } from '../api/refreshSession';
import { reconnectSocket } from '../lib/socket';
import toast from 'react-hot-toast';

export default function AuthCallback() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setUser } = useAuth();
  const hasShownToast = useRef(false);
  const hasProcessedCallback = useRef(false);

  useEffect(() => {
    // Prevent double execution in React StrictMode
    if (hasProcessedCallback.current) {
      console.log('[AuthCallback] Já processado, ignorando segunda execução');
      return;
    }
    hasProcessedCallback.current = true;

    const handleCallback = async () => {
      // Check for error (ex.: oauth_state, email_not_verified)
      const error = searchParams?.get('error');
      if (error) {
        toast.error('Erro ao fazer login com Google');
        router.push('/campanhas');
        return;
      }

      // Nada vem na URL: o refresh token está no cookie HttpOnly,
      // e o access token + usuário vêm de POST /auth/refresh
      let userData: StoredUser;
      try {
        const response = await refreshSession();
        userData = response.user;
      } catch {
        toast.error('Erro ao fazer login com Google');
        router.push('/campanhas');
        return;
      }

      // Update React auth state (AuthContext) so downstream pages have user data
      setUser(userData);

      // Reconnect socket with new token
      reconnectSocket();

      const welcome = () => {
        if (!hasShownToast.current) {
          toast.success(`Bem-vindo, ${userData.name}!`);
          hasShownToast.current = true;
        }
      };

      // Check if user needs to complete phone or address registration
      if (
        userData.legalAcceptanceRequired ||
        !userData.phoneCompleted ||
        !userData.addressCompleted
      ) {
        console.log('[AuthCallback] Usuário precisa completar perfil, redirecionando...');
        welcome();
        router.replace('/completar-perfil');
        return;
      }

      // Get return URL or default to campaigns
      const returnUrl = authStorage.getReturnUrl() || '/campanhas';
      authStorage.clearReturnUrl();

      welcome();

      // Navigate to the original page
      router.replace(returnUrl);
    };

    handleCallback();
  }, [searchParams, router, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completando login com Google...</p>
      </div>
    </div>
  );
}
