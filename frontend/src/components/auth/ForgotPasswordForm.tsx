'use client';

import { FormEvent, useState } from 'react';
import { authApi } from '../../lib/authApi';
import { getApiErrorMessage } from '../../lib/apiError';
import { Input, Button } from '../ui';

interface ForgotPasswordFormProps {
  initialEmail?: string;
  onBackToLogin: () => void;
  title?: string;
  backLabel?: string;
}

// Mesmo formato do z.string().email() (zod 3) que o backend usa: email que ele recusa
// viraria 500 e gastaria uma das 3 tentativas por hora
const EMAIL_PATTERN = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9-]*\.)+[A-Z]{2,}$/i;

/**
 * ForgotPasswordForm Component
 *
 * Asks for the password reset link. The backend answers the same whether the
 * account exists or not, so the screen only shows the message it returns.
 */
export const ForgotPasswordForm = ({
  initialEmail = '',
  onBackToLogin,
  title = 'Recuperar senha',
  backLabel = 'Voltar para o login',
}: ForgotPasswordFormProps) => {
  const [email, setEmail] = useState(initialEmail);
  const [emailError, setEmailError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [sentMessage, setSentMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim();
    setSubmitError('');

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setEmailError('Informe um email válido');
      return;
    }
    setEmailError('');

    setIsSubmitting(true);
    try {
      const { message } = await authApi.requestPasswordReset(normalizedEmail);
      setSentMessage(message);
    } catch (error: unknown) {
      setSubmitError(getApiErrorMessage(error, 'Não foi possível enviar o link. Tente novamente.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (sentMessage !== null) {
    return (
      <div className="text-center space-y-4" data-testid="forgot-password-sent">
        <div className="w-14 h-14 mx-auto rounded-full bg-sky-100 flex items-center justify-center">
          <svg className="w-7 h-7 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-sky-900">Verifique seu email</h2>

        <p className="text-sm text-sky-700">{sentMessage}</p>

        <p className="text-xs text-sky-600">
          O link vale por 1 hora. Não chegou? Confira a caixa de spam.
        </p>

        <Button type="button" variant="ghost" className="w-full" onClick={onBackToLogin}>
          {backLabel}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4" data-testid="forgot-password-form">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-sky-900">{title}</h2>
        <p className="text-sm text-sky-700">
          Informe o email da sua conta. Enviaremos um link para você criar uma nova senha.
        </p>
      </div>

      <Input
        id="forgot-password-email"
        type="email"
        label="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={emailError}
        disabled={isSubmitting}
        autoComplete="email"
        aria-invalid={emailError ? true : undefined}
      />

      {submitError && (
        <p role="alert" className="text-sm text-red-600">
          {submitError}
        </p>
      )}

      <Button type="submit" variant="primary" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Enviando...' : 'Enviar link'}
      </Button>

      <Button type="button" variant="ghost" className="w-full" onClick={onBackToLogin}>
        {backLabel}
      </Button>
    </form>
  );
};

export default ForgotPasswordForm;
