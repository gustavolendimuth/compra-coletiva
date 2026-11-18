import type { Metadata } from 'next';
import { ResetPasswordPage } from './ResetPasswordPage';

export const metadata: Metadata = {
  title: 'Redefinir senha',
  robots: {
    index: false,
    follow: false,
  },
  // O token vai na URL: não deixar vazar no Referer de links e recursos externos
  referrer: 'no-referrer',
};

export default function ResetPasswordRoute() {
  return <ResetPasswordPage />;
}
