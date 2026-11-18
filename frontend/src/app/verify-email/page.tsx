import type { Metadata } from 'next';
import { VerifySignupEmailPage } from './VerifySignupEmailPage';

export const metadata: Metadata = {
  title: 'Confirmar email',
  robots: {
    index: false,
    follow: false,
  },
};

export default function VerifySignupEmail() {
  return <VerifySignupEmailPage />;
}
