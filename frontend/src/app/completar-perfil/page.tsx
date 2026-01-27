import type { Metadata } from 'next';
import { CompleteProfilePage } from './CompleteProfilePage';

export const metadata: Metadata = {
  title: 'Completar Perfil - Compra Coletiva',
  robots: {
    index: false,
    follow: false,
  },
};

export default function CompleteProfile() {
  return <CompleteProfilePage />;
}
