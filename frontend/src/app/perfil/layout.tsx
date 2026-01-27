import type { Metadata } from 'next';
import { ProfileLayoutClient } from './ProfileLayoutClient';

export const metadata: Metadata = {
  title: {
    template: '%s | Perfil - Compra Coletiva',
    default: 'Perfil - Compra Coletiva',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProfileLayoutClient>{children}</ProfileLayoutClient>;
}
