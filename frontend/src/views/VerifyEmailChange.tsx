'use client';

/**
 * VerifyEmailChange Page
 * Página de verificação de troca de email
 */

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, Button } from '@/components/ui';
import { profileService } from '@/api';
import { useAuth } from '@/contexts/AuthContext';
import { getApiErrorCode, getApiErrorMessage } from '@/lib/apiError';

type VerificationStatus = 'loading' | 'success' | 'error' | 'expired';

interface VerifyEmailChangeProps {
  token?: string;
}

export function VerifyEmailChange({ token: propToken }: VerifyEmailChangeProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [message, setMessage] = useState('');
  const [newEmail, setNewEmail] = useState('');
  // O link é de uso único: confirma uma vez só, mesmo que o efeito rode de novo
  const hasVerified = useRef(false);

  // O link do email traz o token na query (?token=...)
  const token = propToken || searchParams?.get('token') || undefined;

  useEffect(() => {
    if (hasVerified.current) return;
    hasVerified.current = true;

    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Token de verificação ausente');
        return;
      }

      try {
        const response = await profileService.verifyEmailChange(token);
        setStatus('success');
        setNewEmail(response.newEmail);
        setMessage('Seu email foi alterado com sucesso!');
        // Refresh user data to get updated email
        await refreshUser();
      } catch (error: unknown) {
        if (getApiErrorCode(error) === 'INVALID_TOKEN') {
          setStatus('expired');
          setMessage('O link de confirmação é inválido ou expirou. Solicite uma nova troca de email.');
        } else {
          setStatus('error');
          setMessage(getApiErrorMessage(error, 'Erro ao verificar email'));
        }
      }
    };

    verifyEmail();
  }, [token, refreshUser]);

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-4 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-600">Verificando seu email...</p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Email Verificado!</h2>
            <p className="text-gray-600 mb-2">{message}</p>
            {newEmail && (
              <p className="text-sm text-gray-500 mb-6">
                Seu novo email: <strong>{newEmail}</strong>
              </p>
            )}
            <Button onClick={() => router.push('/perfil')}>
              Ir para o Perfil
            </Button>
          </div>
        );

      case 'expired':
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Link Inválido ou Expirado</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <Button onClick={() => router.push('/perfil')}>
              Solicitar Novamente
            </Button>
          </div>
        );

      case 'error':
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Erro na Verificação</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="flex justify-center gap-3">
              <Link href="/perfil">
                <Button variant="secondary">Ir para o Perfil</Button>
              </Link>
              <Link href="/campanhas">
                <Button>Ver Campanhas</Button>
              </Link>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md p-6">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">
          Verificação de Email
        </h1>
        {renderContent()}
      </Card>
    </div>
  );
}

export default VerifyEmailChange;

