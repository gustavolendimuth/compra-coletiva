'use client';

/**
 * VerifySignupEmail View
 * Opened from the signup confirmation email: confirms the email and starts the session.
 */

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, Button } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { authStorage } from '@/lib/authStorage';
import { getApiErrorMessage } from '@/lib/apiError';
import { getSafeRedirectPath } from '@/lib/safeRedirectPath';

type VerificationStatus = 'loading' | 'success' | 'error';

export function VerifySignupEmail() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { verifyEmail } = useAuth();
  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [message, setMessage] = useState('');
  // O link só pode ser usado uma vez: evita a segunda chamada do efeito em dev (StrictMode)
  const startedRef = useRef(false);

  const token = searchParams?.get('token');

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const confirm = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Link de confirmação incompleto. Abra o link do email de novo.');
        return;
      }

      try {
        const redirectedToProfile = await verifyEmail(token);
        setStatus('success');
        if (redirectedToProfile) return;

        const returnUrl = getSafeRedirectPath(authStorage.getReturnUrl()) || '/campanhas';
        authStorage.clearReturnUrl();
        router.replace(returnUrl);
      } catch (error: unknown) {
        setStatus('error');
        setMessage(getApiErrorMessage(error, 'Não foi possível confirmar seu email.'));
      }
    };

    confirm();
  }, [token, verifyEmail, router]);


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md p-6">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">Confirmação de email</h1>

        {status === 'loading' && (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-4 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-600">Confirmando seu email...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center py-8">
            <p className="text-gray-600">Email confirmado! Redirecionando...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center py-8" data-testid="verify-email-error">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-gray-600 mb-2">{message}</p>
            <p className="text-sm text-gray-500 mb-6">
              Se o link expirou, entre com seu email e senha para pedir um novo.
            </p>
            <Button onClick={() => router.push('/campanhas?requireLogin=true')}>Ir para o login</Button>
          </div>
        )}
      </Card>
    </div>
  );
}

export default VerifySignupEmail;
