import { UserRole, ImageStorageType } from "@prisma/client";

declare global {
  namespace Express {
    // Define o tipo User explicitamente baseado no schema
    // Isso evita problemas com os tipos utilitários do Prisma v5.22+
    interface User {
      id: string;
      email: string;
      password: string | null;
      name: string;
      phone: string | null;
      phoneCompleted: boolean;
      role: UserRole;
      googleId: string | null;
      isLegacyUser: boolean;
      createdAt: Date;
      updatedAt: Date;

      // Avatar/Profile Picture
      avatarUrl: string | null;
      avatarKey: string | null;
      avatarStorageType: ImageStorageType | null;

      // Email Change (pending verification)
      pendingEmail: string | null;
      pendingEmailToken: string | null;
      pendingEmailExpires: Date | null;

      // Soft Delete
      deletedAt: Date | null;
      deletedReason: string | null;

      // Reputation & Rate Limiting
      messageCount: number;
      answeredCount: number;
      spamScore: number;
      lastMessageAt: Date | null;
      isBanned: boolean;
    }

    interface Request {
      user?: User;
    }
  }
}

export {};
