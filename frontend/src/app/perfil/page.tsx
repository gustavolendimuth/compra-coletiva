import type { Metadata } from 'next';
import { ProfilePage } from './ProfilePage';

export const metadata: Metadata = {
  title: 'Meu Perfil',
};

export default function Profile() {
  return <ProfilePage />;
}
