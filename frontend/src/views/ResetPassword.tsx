'use client';

/**
 * ResetPassword View
 * Opened from the password reset email: sets a new password and sends the user to login.
 */

import { FormEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, Button, Input } from '@/components/ui';
import { ForgotPasswordForm } from '@/components/auth';
import { authApi } from '@/lib/authApi';
import { getApiErrorCode, getApiErrorDetails, getApiErrorMessage } from '@/lib/apiError';
import { getPasswordErrors, PASSWORD_RULES_HINT } from '@/lib/passwordRules';

const LOGIN_PATH = '/campanhas?requireLogin=true';

// Erros do backend em que o link não serve mais: só resta pedir outro
const INVALID_LINK_CODES = new Set(['INVALID_TOKEN', 'TOKEN_EXPIRED', 'TOKEN_ALREADY_USED']);

export function ResetPassword() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams?.get('token') ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [confirmError, setConfirmError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitDetails, setSubmitDetails] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [invalidLinkMessage, setInvalidLinkMessage] = useState(
    token ? '' : 'Link de redefinição incompleto.'
  );

  const goToLogin = () => router.push(LOGIN_PATH);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitDetails([]);

    const errors = getPasswordErrors(newPassword);
    const mismatch = confirmPassword !== newPassword ? 'As senhas não coincidem' : '';
    setPasswordErrors(errors);
    setConfirmError(mismatch);
    if (errors.length > 0 || mismatch) return;

    setIsSubmitting(true);
    try {
      await authApi.resetPassword(token, newPassword);
      setIsDone(true);
    } catch (error: unknown) {
      const message = getApiErrorMessage(error, 'Não foi possível redefinir a senha. Tente novamente.');
      const code = getApiErrorCode(error);
      if (code && INVALID_LINK_CODES.has(code)) {
        setInvalidLinkMessage(message);
        return;
      }
      setSubmitError(message);
      const details = getApiErrorDetails<unknown>(error);
      if (Array.isArray(details)) {
        setSubmitDetails(details.filter((item): item is string => typeof item === 'string'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <Card className="w-full max-w-md p-6">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">Redefinir senha</h1>

        {isDone ? (
          <div className="text-center py-4" data-testid="reset-password-success">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-gray-900 mb-2">Senha alterada</p>
            <p className="text-gray-600 mb-6">Entre com seu email e a nova senha.</p>
            <Button className="w-full" onClick={goToLogin}>Ir para o login</Button>
          </div>
        ) : invalidLinkMessage ? (
          <div className="space-y-6" data-testid="reset-password-invalid-link">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-gray-700" role="alert">{invalidLinkMessage}</p>
            </div>
            <ForgotPasswordForm
              title="Pedir um novo link"
              backLabel="Ir para o login"
              onBackToLogin={goToLogin}
            />
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-4" data-testid="reset-password-form">
            <div>
              <Input
                id="reset-new-password"
                type="password"
                label="Nova senha"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isSubmitting}
                autoComplete="new-password"
                helperText={passwordErrors.length === 0 ? PASSWORD_RULES_HINT : undefined}
                aria-invalid={passwordErrors.length > 0 ? true : undefined}
                aria-describedby={passwordErrors.length > 0 ? 'reset-new-password-errors' : undefined}
              />
              {passwordErrors.length > 0 && (
                <ul id="reset-new-password-errors" className="mt-1.5 space-y-0.5 text-sm text-red-600">
                  {passwordErrors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              )}
            </div>

            <Input
              id="reset-confirm-password"
              type="password"
              label="Confirmar nova senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isSubmitting}
              autoComplete="new-password"
              error={confirmError}
              aria-invalid={confirmError ? true : undefined}
            />

            {submitError && (
              <div role="alert" className="text-sm text-red-600">
                <p>{submitError}</p>
                {submitDetails.length > 0 && (
                  <ul className="mt-1 list-disc pl-5">
                    {submitDetails.map((detail) => (
                      <li key={detail}>{detail}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Redefinir senha'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}

export default ResetPassword;
