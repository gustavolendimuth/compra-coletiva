'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { Input, Button, Divider, GoogleButton } from '../ui';

interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<void>;
  onGoogleLogin: () => void;
  isLoading: boolean;
}

/**
 * LoginForm Component
 *
 * Login form with email/password and Google OAuth.
 * Uses design system ui/ components.
 * Mobile-first with proper touch targets.
 */
export const LoginForm = ({ onSubmit, onGoogleLogin, isLoading }: LoginFormProps) => {
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
        
        <p className="text-xs text-gray-600 text-center">
          Ao usar o Google, você concorda com nossos{' '}
          <Link
            href="/termos"
            className="text-blue-600 hover:text-blue-700 font-medium"
            target="_blank"
            rel="noopener noreferrer"
          >
            Termos
          </Link>
          {' '}e{' '}
          <Link
            href="/privacidade"
            className="text-blue-600 hover:text-blue-700 font-medium"
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
