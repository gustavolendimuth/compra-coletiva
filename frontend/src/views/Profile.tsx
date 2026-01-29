/**
 * Profile Page
 * Página de perfil do usuário com todas as seções de edição
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui';
import { ProfileHeader } from './profile/ProfileHeader';
import { ProfileForm } from './profile/ProfileForm';
import { PasswordSection } from './profile/PasswordSection';
import { EmailSection } from './profile/EmailSection';
import { EmailPreferencesSection } from './profile/EmailPreferencesSection';
import { DeleteAccountSection } from './profile/DeleteAccountSection';
import { ProfileAddressSection } from '@/components/profile/ProfileAddressSection';
import type { StoredUser } from '@/api/types';

export function Profile() {
  const { user, refreshUser } = useAuth();
  const [localUser, setLocalUser] = useState<(StoredUser & { avatarUrl?: string }) | null>(null);

  useEffect(() => {
    if (user) {
      setLocalUser(user as StoredUser & { avatarUrl?: string });
    }
  }, [user]);

  if (!localUser) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleUserUpdate = (updatedUser: StoredUser) => {
    setLocalUser(updatedUser as StoredUser & { avatarUrl?: string });
    refreshUser();
  };

  const handleAvatarUpdate = (avatarUrl: string | null) => {
    setLocalUser((prev) => prev ? { ...prev, avatarUrl: avatarUrl || undefined } : null);
    refreshUser();
  };

  // Check if user has password (users created via Google OAuth don't have one)
  const hasPassword = (localUser as any).hasPassword ?? true;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-8 space-y-6">
      <Card className="overflow-hidden">
        <ProfileHeader user={localUser} onAvatarUpdate={handleAvatarUpdate} />
      </Card>

      <ProfileForm user={localUser} onUpdate={handleUserUpdate} />

      <EmailSection currentEmail={localUser.email} hasPassword={hasPassword} />

      <PasswordSection hasPassword={hasPassword} />

      <EmailPreferencesSection />

      <ProfileAddressSection />

      <DeleteAccountSection hasPassword={hasPassword} />
    </div>
  );
}

export default Profile;
