import { FormEvent, useState } from 'react';
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

      <GoogleButton onClick={onGoogleLogin} isLoading={isLoading} />
    </form>
  );
};

export default LoginForm;
