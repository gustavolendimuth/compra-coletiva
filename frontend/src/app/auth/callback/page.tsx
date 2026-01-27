import type { Metadata } from 'next';
import { AuthCallbackPage } from './AuthCallbackPage';

export const metadata: Metadata = {
  title: 'Autenticação...',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AuthCallback() {
  return <AuthCallbackPage />;
}
