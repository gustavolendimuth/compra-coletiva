import type { Metadata } from 'next';
import { UsersPage } from './UsersPage';

export const metadata: Metadata = {
  title: 'Usuários',
};

export default function AdminUsers() {
  return <UsersPage />;
}
