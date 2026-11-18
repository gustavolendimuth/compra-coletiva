'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { Input, Button, Divider, GoogleButton } from '../ui';

interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<void>;
  onGoogleLogin: () => void;
  onForgotPassword?: (email: string) => void;
  isLoading: boolean;
}

/**
 * LoginForm Component
 *
 * Login form with email/password and Google OAuth.
 * Uses design system ui/ components.
 * Mobile-first with proper touch targets.
 */
export const LoginForm = ({ onSubmit, onGoogleLogin, onForgotPassword, isLoading }: LoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await onSubmit(email, password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        id="login-email"
        type="email"
        label="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        disabled={isLoading}
        autoComplete="email"
      />

      <Input
        id="login-password"
        type="password"
        label="Senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        disabled={isLoading}
        autoComplete="current-password"
      />

      {onForgotPassword && (
        <div className="-mt-2 text-right">
          <button
            type="button"
            onClick={() => onForgotPassword(email.trim())}
            disabled={isLoading}
            className="text-sm font-medium text-sky-600 hover:text-sky-800 underline underline-offset-2 disabled:opacity-50"
          >
            Esqueci minha senha
          </button>
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? 'Entrando...' : 'Entrar'}
      </Button>

      <Divider text="Ou continue com" />

      <div className="space-y-3">
        <GoogleButton onClick={onGoogleLogin} isLoading={isLoading} />
        
        <p className="text-xs text-sky-600 text-center">
          Ao usar o Google, você concorda com nossos{' '}
          <Link
            href="/termos"
            className="text-sky-600 hover:text-sky-800 font-medium underline underline-offset-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            Termos
          </Link>
          {' '}e{' '}
          <Link
            href="/privacidade"
            className="text-sky-600 hover:text-sky-800 font-medium underline underline-offset-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            Privacidade
          </Link>
          .
        </p>
      </div>
    </form>
  );
};

export default LoginForm;
