import crypto from "crypto";
import type { Prisma, User } from "@prisma/client";
import { prisma } from "../index";
import { TokenService } from "./tokenService";

type Db = Prisma.TransactionClient | typeof prisma;

// Link de confirmação vale 24 h, como o da troca de email
export const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Verificação do email do cadastro: o banco guarda só o SHA-256 do token,
 * o token cru vai apenas no email.
 */
export class EmailVerificationService {
  /**
   * Gera um token novo para o usuário (invalida o anterior) e devolve o token cru.
   */
  static async issueToken(userId: string, db: Db = prisma): Promise<string> {
    const token = crypto.randomBytes(32).toString("hex");
    await db.user.update({
      where: { id: userId },
      data: {
        emailVerificationToken: TokenService.hashToken(token),
        emailVerificationExpires: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
      },
    });
    return token;
  }

  /**
   * Consome o token de forma atômica: só uma requisição concorrente vence.
   * Devolve o usuário verificado, ou null se o token é inválido, expirou ou já foi usado.
   */
  static async consumeToken(token: string): Promise<User | null> {
    const tokenHash = TokenService.hashToken(token);
    const user = await prisma.user.findUnique({ where: { emailVerificationToken: tokenHash } });
    if (!user) {
      return null;
    }

    const now = new Date();
    const { count } = await prisma.user.updateMany({
      where: {
        id: user.id,
        emailVerificationToken: tokenHash,
        emailVerificationExpires: { gt: now },
        deletedAt: null,
      },
      data: {
        emailVerifiedAt: now,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });
    if (count !== 1) {
      return null;
    }
    return { ...user, emailVerifiedAt: now, emailVerificationToken: null, emailVerificationExpires: null };
  }
}
