'use client';

import { Suspense } from 'react';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authStorage } from '@/lib/authStorage';

/**
 * Componente interno que usa useSearchParams
 */
function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Extrai parâmetros da URL
        const accessToken = searchParams.get('accessToken');
        const refreshToken = searchParams.get('refreshToken');
        const userId = searchParams.get('userId');
        const userName = searchParams.get('userName');
        const userEmail = searchParams.get('userEmail');
        const userRole = searchParams.get('userRole');
        const phoneCompleted = searchParams.get('phoneCompleted') === 'true';

        // Valida que os tokens foram recebidos
        if (!accessToken || !refreshToken || !userId) {
          console.error('[AuthCallback] Missing required parameters');
          router.push('/login?error=auth_failed');
          return;
        }

        // Armazena tokens e dados do usuário
        authStorage.setTokens({
          accessToken,
          refreshToken,
        });

        authStorage.setUser({
          id: userId,
          name: decodeURIComponent(userName || ''),
          email: decodeURIComponent(userEmail || ''),
          role: (userRole as 'CUSTOMER' | 'ADMIN') || 'CUSTOMER',
          phoneCompleted,
        });

        console.log('[AuthCallback] User authenticated successfully', {
          userId,
          phoneCompleted,
        });

        // Redireciona para completar telefone ou para home
        if (!phoneCompleted) {
          router.push('/complete-profile');
        } else {
          router.push('/');
        }
      } catch (error) {
        console.error('[AuthCallback] Error processing callback:', error);
        router.push('/login?error=auth_failed');
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Autenticando...</p>
      </div>
    </div>
  );
}

/**
 * Página de callback do Google OAuth
 *
 * Recebe os tokens via query params do backend e armazena no localStorage,
 * depois redireciona para a página inicial ou para completar o cadastro de telefone.
 */
export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando...</p>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
