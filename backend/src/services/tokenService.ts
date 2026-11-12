import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { REFRESH_TOKEN_TTL_DAYS, REFRESH_TOKEN_TTL_MS } from '../config/session';
import { getSecret } from '../config/secrets';

const prisma = new PrismaClient();

// Segredos validados no boot (config/secrets); só HS256 é aceito na verificação
const JWT_ALGORITHM: jwt.Algorithm = 'HS256';
const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export type RefreshTokenConsumption =
  | { outcome: 'consumed'; payload: TokenPayload }
  | { outcome: 'invalid' }
  | { outcome: 'reused'; userId: string };

export class TokenService {
  /**
   * SHA-256 hex de um token (o que fica gravado no banco)
   */
  static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Gera um access token (curta duração)
   */
  static generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, getSecret('JWT_ACCESS_SECRET'), {
      algorithm: JWT_ALGORITHM,
      expiresIn: JWT_ACCESS_EXPIRES_IN,
    } as jwt.SignOptions);
  }

  /**
   * Gera um refresh token (longa duração)
   */
  static generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, getSecret('JWT_REFRESH_SECRET'), {
      algorithm: JWT_ALGORITHM,
      expiresIn: `${REFRESH_TOKEN_TTL_DAYS}d`,
      jwtid: crypto.randomBytes(16).toString('hex'),
    } as jwt.SignOptions);
  }

  /**
   * Gera par de tokens (access + refresh)
   */
  static generateTokenPair(payload: TokenPayload): TokenPair {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }

  /**
   * Verifica e decodifica um access token
   */
  static verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, getSecret('JWT_ACCESS_SECRET'), {
        algorithms: [JWT_ALGORITHM],
      }) as TokenPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('TOKEN_EXPIRED');
      }
      throw new Error('INVALID_TOKEN');
    }
  }

  /**
   * Verifica e decodifica um refresh token
   */
  static verifyRefreshToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, getSecret('JWT_REFRESH_SECRET'), {
        algorithms: [JWT_ALGORITHM],
      }) as TokenPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('REFRESH_TOKEN_EXPIRED');
      }
      throw new Error('INVALID_REFRESH_TOKEN');
    }
  }

  /**
   * Salva o hash do refresh token no banco de dados
   */
  static async saveRefreshToken(userId: string, token: string): Promise<void> {
    await prisma.session.create({
      data: {
        userId,
        token: this.hashToken(token),
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      },
    });
  }

  /**
   * Consome um refresh token (rotação).
   * - assinatura inválida/expirada -> invalid
   * - assinatura válida mas ausente de `sessions` (já rotacionado) -> reused,
   *   e todas as sessões do usuário são removidas
   * - sessão expirada no banco -> invalid
   */
  static async consumeRefreshToken(token: string): Promise<RefreshTokenConsumption> {
    let payload: TokenPayload;
    try {
      payload = this.verifyRefreshToken(token);
    } catch {
      return { outcome: 'invalid' };
    }

    const tokenHash = this.hashToken(token);
    const session = await prisma.session.findUnique({ where: { token: tokenHash } });

    if (!session || session.userId !== payload.userId) {
      await this.revokeAllUserTokens(payload.userId);
      return { outcome: 'reused', userId: payload.userId };
    }

    // Remove a sessão; se outra requisição já a removeu, é reuso
    const { count } = await prisma.session.deleteMany({ where: { token: tokenHash } });
    if (count === 0) {
      await this.revokeAllUserTokens(payload.userId);
      return { outcome: 'reused', userId: payload.userId };
    }

    if (session.expiresAt < new Date()) {
      return { outcome: 'invalid' };
    }

    return { outcome: 'consumed', payload };
  }

  /**
   * Revoga um refresh token (logout)
   */
  static async revokeRefreshToken(token: string): Promise<void> {
    await prisma.session.deleteMany({
      where: { token: this.hashToken(token) },
    });
  }

  /**
   * Revoga as sessões do usuário exceto a do refresh token informado
   */
  static async revokeOtherUserTokens(userId: string, currentToken?: string): Promise<void> {
    if (!currentToken) {
      await this.revokeAllUserTokens(userId);
      return;
    }
    await prisma.session.deleteMany({
      where: { userId, token: { not: this.hashToken(currentToken) } },
    });
  }

  /**
   * Revoga todos os refresh tokens de um usuário
   */
  static async revokeAllUserTokens(userId: string): Promise<void> {
    await prisma.session.deleteMany({
      where: { userId },
    });
  }

  /**
   * Remove sessões expiradas (cleanup)
   */
  static async cleanupExpiredSessions(): Promise<number> {
    const result = await prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return result.count;
  }

  /**
   * Extrai token do header Authorization
   */
  static extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1];
  }
}
