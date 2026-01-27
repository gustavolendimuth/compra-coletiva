import type { Metadata } from 'next';
import { UserDetailPage } from './UserDetailPage';

export const metadata: Metadata = {
  title: 'Detalhes do Usuário',
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminUserDetail({ params }: Props) {
  const { id } = await params;
  return <UserDetailPage userId={id} />;
}
