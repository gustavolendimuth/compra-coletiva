/**
 * ProfileHeader Component
 * Avatar com opção de upload e nome do usuário
 */

import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Avatar, Button } from '@/components/ui';
import { profileService } from '@/api';
import type { StoredUser } from '@/api/types';

interface ProfileHeaderProps {
  user: StoredUser & { avatarUrl?: string };
  onAvatarUpdate: (avatarUrl: string | null) => void;
}

export function ProfileHeader({ user, onAvatarUpdate }: ProfileHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: profileService.uploadAvatar,
    onSuccess: (data) => {
      onAvatarUpdate(data.avatarUrl);
      toast.success('Avatar atualizado!');
    },
    onError: () => {
      toast.error('Erro ao atualizar avatar');
    },
    onSettled: () => {
      setIsUploading(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: profileService.deleteAvatar,
    onSuccess: () => {
      onAvatarUpdate(null);
      toast.success('Avatar removido!');
    },
    onError: () => {
      toast.error('Erro ao remover avatar');
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Apenas imagens JPEG, PNG ou WebP');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Tamanho máximo: 5MB');
      return;
    }

    setIsUploading(true);
    uploadMutation.mutate(file);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 md:p-6">
      <div className="relative">
        <Avatar
          src={user.avatarUrl}
          name={user.name}
          size="2xl"
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer hover:opacity-80 transition-opacity ring-4 ring-white shadow-lg"
        />

        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      <div className="text-center">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">{user.name}</h1>
        <p className="text-sm text-gray-500">{user.email}</p>
        <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
          {user.role === 'ADMIN' ? 'Administrador' : user.role === 'CAMPAIGN_CREATOR' ? 'Criador' : 'Cliente'}
        </span>
      </div>

      <div className="flex gap-2">
        <Button
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          Alterar foto
        </Button>
        {user.avatarUrl && (
          <Button
            variant="ghost"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            Remover
          </Button>
        )}
      </div>
    </div>
  );
}

export default ProfileHeader;
