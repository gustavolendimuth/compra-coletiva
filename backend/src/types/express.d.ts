import { UserRole } from '@prisma/client';

declare global {
  namespace Express {
    // Define o tipo User explicitamente baseado no schema
    // Isso evita problemas com os tipos utilitários do Prisma v5.22+
    interface User {
      id: string;
      email: string;
      password: string | null;
      name: string;
      role: UserRole;
      googleId: string | null;
      createdAt: Date;
      updatedAt: Date;
    }

    interface Request {
      user?: User;
    }
  }
}

export {};
