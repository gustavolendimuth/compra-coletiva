'use client';

import { Suspense } from 'react';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

/**
 * Componente interno que usa useSearchParams
 */
function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  useEffect(() => {
    // Se já estiver autenticado, redireciona para home
    if (user) {
      router.push('/');
      return;
    }

    // Verifica se há erro de autenticação na URL
    const error = searchParams.get('error');
    if (error === 'auth_failed') {
      toast.error('Erro ao fazer login com Google. Por favor, tente novamente.');
    }

    // Abre o modal de autenticação
    window.dispatchEvent(
      new CustomEvent('openAuthModal', {
        detail: { tab: 'login' },
      })
    );
  }, [user, router, searchParams]);

  // Mostra loading enquanto verifica autenticação
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#fefdf8' }}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto mb-4"></div>
        <p className="text-sky-700/60">Carregando...</p>
      </div>
    </div>
  );
}

/**
 * Página de login
 *
 * Abre o modal de autenticação ou redireciona para home se já estiver autenticado
 */
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: '#fefdf8' }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto mb-4"></div>
            <p className="text-sky-700/60">Carregando...</p>
          </div>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
