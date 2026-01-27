'use client';

import { UserDetail } from '@/views/admin/UserDetail';

interface UserDetailPageProps {
  userId: string;
}

export function UserDetailPage({ userId }: UserDetailPageProps) {
  return <UserDetail userId={userId} />;
}
