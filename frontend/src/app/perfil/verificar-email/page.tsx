import type { Metadata } from 'next';
import { VerifyEmailPage } from './VerifyEmailPage';

export const metadata: Metadata = {
  title: 'Verificar Email',
};

export default function VerifyEmail() {
  return <VerifyEmailPage />;
}
