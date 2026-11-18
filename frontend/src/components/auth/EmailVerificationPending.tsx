'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { authApi } from '../../lib/authApi';
import { getApiErrorMessage } from '../../lib/apiError';
import { Button } from '../ui';

interface EmailVerificationPendingProps {
  email: string;
  onBackToLogin: () => void;
}

/**
 * EmailVerificationPending Component
 *
 * Shown after signup (and on login with an unconfirmed email):
 * the account only activates through the link sent to the email.
 */
export const EmailVerificationPending = ({ email, onBackToLogin }: EmailVerificationPendingProps) => {
  const [isResending, setIsResending] = useState(false);

  const handleResend = async () => {
    setIsResending(true);
    try {
      const { message } = await authApi.resendVerification(email);
      toast.success(message);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Erro ao reenviar o link'));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="text-center space-y-4" data-testid="email-verification-pending">
      <div className="w-14 h-14 mx-auto rounded-full bg-sky-100 flex items-center justify-center">
        <svg className="w-7 h-7 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>

      <h2 className="text-xl font-bold text-sky-900">Confirme seu email</h2>

      <p className="text-sm text-sky-700">
        Enviamos um link de confirmação para <strong className="break-all">{email}</strong>.
        Abra o email e clique no link para ativar sua conta.
      </p>

      <p className="text-xs text-sky-600">
        Não chegou? Confira a caixa de spam ou peça um novo link. O link vale por 24 horas.
      </p>

      <div className="space-y-2 pt-2">
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={handleResend}
          disabled={isResending}
        >
          {isResending ? 'Reenviando...' : 'Reenviar link'}
        </Button>
        <Button type="button" variant="ghost" className="w-full" onClick={onBackToLogin}>
          Voltar para o login
        </Button>
      </div>
    </div>
  );
};
