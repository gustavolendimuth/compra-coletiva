import { Router, Request, Response } from "express";
import { PrismaClient, Prisma, LegalDocumentType } from "@prisma/client";
import { z } from "zod";
import crypto from "crypto";
import passport from "passport";
import { AuthService } from "../services/authService";
import { TokenService } from "../services/tokenService";
import { requireAuth } from "../middleware/authMiddleware";
import {
  REFRESH_TOKEN_COOKIE_NAME,
  getRefreshTokenCookieOptions,
  getClearCookieOptions,
} from "../utils/cookieConfig";
import { capitalizeName } from "../utils/nameFormatter";
import { queueWelcomeEmail, queuePasswordResetEmail } from "../services/email/emailQueue";
import { geocodingService } from "../services/geocodingService";
import {
  LEGAL_ACCEPTANCE_CONTEXT,
  LEGAL_PRIVACY_VERSION,
  LEGAL_TERMS_VERSION,
} from "../config/legal";
import { LegalAcceptanceService } from "../services/legalAcceptanceService";

const router = Router();
const prisma = new PrismaClient();
type OAuthUser = Prisma.UserGetPayload<{
  select: {
    id: true;
    name: true;
    email: true;
    role: true;
    phoneCompleted: true;
    addressCompleted: true;
    legalAcceptanceRequired: true;
  };
}>;

// ========== HELPER FUNCTIONS ==========

/**
 * Valida se o nome tem pelo menos 2 palavras (nome e sobrenome)
 */
function validateFullName(name: string): { isValid: boolean; error?: string } {
  const trimmedName = name.trim();
  const words = trimmedName.split(/\s+/).filter(word => word.length > 0);

  if (words.length < 2) {
    return {
      isValid: false,
      error: "Por favor, informe seu nome completo (nome e sobrenome)"
    };
  }

  // Validar que cada palavra tem pelo menos 2 caracteres
  const hasShortWords = words.some(word => word.length < 2);
  if (hasShortWords) {
    return {
      isValid: false,
      error: "Nome e sobrenome devem ter pelo menos 2 caracteres cada"
    };
  }

  return { isValid: true };
}

// ========== SCHEMAS DE VALIDAÇÃO ==========

// Regex para validar telefone brasileiro (somente dígitos: 10 ou 11)
const phoneDigitsRegex = /^\d{10,11}$/;

const normalizeTrimmedString = (value: unknown) => {
  if (typeof value !== "string") return value;
  return value.trim();
};

const normalizeEmail = (value: unknown) => {
  if (typeof value !== "string") return value;
  return value.trim().toLowerCase();
};

const normalizePhone = (value: unknown) => {
  if (typeof value !== "string") return value;
  const digits = value.replace(/\D/g, "");
  if (digits.length === 13 && digits.startsWith("55")) {
    return digits.slice(2);
  }
  return digits;
};

const phoneSchema = z.preprocess(
  normalizePhone,
  z
    .string()
    .min(10, "Celular deve ter pelo menos 10 dígitos")
    .max(11, "Celular deve ter no máximo 11 dígitos")
    .regex(phoneDigitsRegex, "Formato de celular inválido. Use: XX XXXXX-XXXX")
);

const registerSchema = z.object({
  name: z.preprocess(
    normalizeTrimmedString,
    z
      .string()
      .min(2, "Nome deve ter pelo menos 2 caracteres")
      .max(100, "Nome deve ter no máximo 100 caracteres")
      .refine(
        (name) => validateFullName(name).isValid,
        (name) => ({ message: validateFullName(name).error || "Nome inválido" })
      )
  ),
  email: z.preprocess(normalizeEmail, z.string().email("Email inválido")),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  phone: phoneSchema,
  acceptTerms: z
    .boolean()
    .refine(
      (value) => value === true,
      "Você precisa aceitar os Termos de Serviço para criar uma conta"
    ),
  acceptPrivacy: z
    .boolean()
    .refine(
      (value) => value === true,
      "Você precisa aceitar a Política de Privacidade para criar uma conta"
    ),
});

const loginSchema = z.object({
  email: z.preprocess(normalizeEmail, z.string().email("Email inválido")),
  password: z.string().min(1, "Senha é obrigatória"),
});

const requestPasswordResetSchema = z.object({
  email: z.preprocess(normalizeEmail, z.string().email("Email inválido")),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token é obrigatório"),
  newPassword: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

const updateProfileSchema = z.object({
  name: z
    .preprocess(
      normalizeTrimmedString,
      z
        .string()
        .min(2, "Nome deve ter pelo menos 2 caracteres")
        .max(100, "Nome deve ter no máximo 100 caracteres")
        .refine(
          (name) => validateFullName(name).isValid,
          (name) => ({
            message: validateFullName(name).error || "Nome inválido",
          })
        )
    )
    .optional(),
  phone: phoneSchema.optional(),
  currentPassword: z.string().optional(),
  newPassword: z
    .string()
    .min(6, "Nova senha deve ter pelo menos 6 caracteres")
    .optional(),
});

const completePhoneSchema = z.object({
  phone: phoneSchema,
});

// ========== ROTAS ==========

/**
 * GET /api/auth/check-name?name=NomeDoUsuario
 * Verifica se um nome já existe no banco de dados
 */
router.get("/check-name", async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.query;

    if (!name || typeof name !== 'string') {
      res.status(400).json({
        error: "VALIDATION_ERROR",
        message: "Nome é obrigatório",
      });
      return;
    }

    // Conta quantos usuários não-legados têm esse nome
    const count = await prisma.user.count({
      where: {
        name: capitalizeName(name),
        isLegacyUser: false,
      },
    });

    res.status(200).json({
      exists: count > 0,
      count,
      suggestion: count > 0
        ? "Já existe um usuário com esse nome. Considere adicionar um sobrenome ou inicial para evitar confusões."
        : null,
    });
  } catch (error) {
    console.error("Erro ao verificar nome:", error);
    res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Erro ao verificar nome",
    });
  }
});

/**
 * POST /api/auth/register
 * Registra um novo usuário
 */
router.post("/register", async (req: Request, res: Response): Promise<void> => {
  try {
    // Valida dados
    const validationResult = registerSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        error: "VALIDATION_ERROR",
        message: "Dados inválidos",
        details: validationResult.error.errors,
      });
      return;
    }

    const { name, email, password, phone } = validationResult.data;

    // Valida email
    if (!AuthService.validateEmail(email)) {
      res.status(400).json({
        error: "INVALID_EMAIL",
        message: "Formato de email inválido",
      });
      return;
    }

    // Valida senha
    const passwordValidation = AuthService.validatePassword(password);
    if (!passwordValidation.valid) {
      res.status(400).json({
        error: "WEAK_PASSWORD",
        message: "Senha não atende aos requisitos mínimos",
        details: passwordValidation.errors,
      });
      return;
    }

    // Verifica se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(409).json({
        error: "EMAIL_ALREADY_EXISTS",
        message: "Este email já está cadastrado",
      });
      return;
    }

    // Hash da senha
    const hashedPassword = await AuthService.hashPassword(password);

    const acceptedAt = new Date();

    // Cria usuário já com aceite legal registrado
    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          name: capitalizeName(name),
          email,
          password: hashedPassword,
          phone,
          phoneCompleted: true, // Email/password users provide phone during registration
          addressCompleted: false, // Users need to complete address after first login
          role: "CUSTOMER", // Default role
          legalAcceptanceRequired: false,
          termsAcceptedAt: acceptedAt,
          termsAcceptedVersion: LEGAL_TERMS_VERSION,
          privacyAcceptedAt: acceptedAt,
          privacyAcceptedVersion: LEGAL_PRIVACY_VERSION,
        },
      });

      await Promise.all([
        LegalAcceptanceService.recordAcceptance({
          userId: createdUser.id,
          documentType: LegalDocumentType.TERMS,
          documentVersion: LEGAL_TERMS_VERSION,
          context: LEGAL_ACCEPTANCE_CONTEXT.REGISTER,
          req,
          tx,
        }),
        LegalAcceptanceService.recordAcceptance({
          userId: createdUser.id,
          documentType: LegalDocumentType.PRIVACY,
          documentVersion: LEGAL_PRIVACY_VERSION,
          context: LEGAL_ACCEPTANCE_CONTEXT.REGISTER,
          req,
          tx,
        }),
      ]);

      return createdUser;
    });

    // Gera tokens
    const tokens = TokenService.generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Salva refresh token
    await TokenService.saveRefreshToken(user.id, tokens.refreshToken);

    // Enfileirar email de boas-vindas (não bloqueia o fluxo)
    try {
      await queueWelcomeEmail(user.id, user.name, user.email);
      console.log(`[Auth] Welcome email queued for user ${user.id}`);
    } catch (emailError) {
      console.error('[Auth] Failed to queue welcome email:', emailError);
      // Não falha o registro se o email falhar
    }

    // Set refresh token as HttpOnly cookie
    res.cookie(
      REFRESH_TOKEN_COOKIE_NAME,
      tokens.refreshToken,
      getRefreshTokenCookieOptions()
    );

    res.status(201).json({
      message: "Usuário criado com sucesso",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        phoneCompleted: user.phoneCompleted,
        addressCompleted: user.addressCompleted,
        legalAcceptanceRequired: user.legalAcceptanceRequired,
        termsAcceptedAt: user.termsAcceptedAt,
        termsAcceptedVersion: user.termsAcceptedVersion,
        privacyAcceptedAt: user.privacyAcceptedAt,
        privacyAcceptedVersion: user.privacyAcceptedVersion,
        salesDisclaimerAcceptedAt: user.salesDisclaimerAcceptedAt,
        salesDisclaimerAcceptedVersion: user.salesDisclaimerAcceptedVersion,
        role: user.role,
      },
      accessToken: tokens.accessToken,
    });
  } catch (error) {
    console.error("Erro ao registrar usuário:", error);
    res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Erro ao criar usuário",
    });
  }
});

/**
 * POST /api/auth/login
 * Faz login de um usuário
 */
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    // Valida dados
    const validationResult = loginSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        error: "VALIDATION_ERROR",
        message: "Dados inválidos",
        details: validationResult.error.errors,
      });
      return;
    }

    const { email, password } = validationResult.data;

    // Busca usuário
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(401).json({
        error: "INVALID_CREDENTIALS",
        message: "Email ou senha incorretos",
      });
      return;
    }

    // Verifica se o usuário tem senha (pode ser OAuth user)
    if (!user.password) {
      res.status(401).json({
        error: "NO_PASSWORD",
        message:
          'Este usuário foi criado via Google. Use "Continuar com Google"',
      });
      return;
    }

    // Verifica senha
    const isPasswordValid = await AuthService.verifyPassword(
      password,
      user.password
    );

    if (!isPasswordValid) {
      res.status(401).json({
        error: "INVALID_CREDENTIALS",
        message: "Email ou senha incorretos",
      });
      return;
    }

    // Gera tokens
    const tokens = TokenService.generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Salva refresh token
    await TokenService.saveRefreshToken(user.id, tokens.refreshToken);

    // Set refresh token as HttpOnly cookie
    res.cookie(
      REFRESH_TOKEN_COOKIE_NAME,
      tokens.refreshToken,
      getRefreshTokenCookieOptions()
    );

    res.status(200).json({
      message: "Login realizado com sucesso",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        phoneCompleted: user.phoneCompleted,
        addressCompleted: user.addressCompleted,
        legalAcceptanceRequired: user.legalAcceptanceRequired,
        termsAcceptedAt: user.termsAcceptedAt,
        termsAcceptedVersion: user.termsAcceptedVersion,
        privacyAcceptedAt: user.privacyAcceptedAt,
        privacyAcceptedVersion: user.privacyAcceptedVersion,
        salesDisclaimerAcceptedAt: user.salesDisclaimerAcceptedAt,
        salesDisclaimerAcceptedVersion: user.salesDisclaimerAcceptedVersion,
        role: user.role,
      },
      accessToken: tokens.accessToken,
    });
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Erro ao processar login",
    });
  }
});

/**
 * POST /api/auth/refresh
 * Renova o access token usando refresh token
 * Lê refresh token apenas de cookie HttpOnly
 */
router.post("/refresh", async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];

    if (!refreshToken) {
      res.status(400).json({
        error: "VALIDATION_ERROR",
        message: "Refresh token não fornecido",
      });
      return;
    }

    // Verifica se refresh token existe no banco
    const isValid = await TokenService.validateRefreshToken(refreshToken);

    if (!isValid) {
      res.status(401).json({
        error: "INVALID_REFRESH_TOKEN",
        message: "Refresh token inválido ou expirado",
      });
      return;
    }

    // Decodifica refresh token
    let payload;
    try {
      payload = TokenService.verifyRefreshToken(refreshToken);
    } catch {
      res.status(401).json({
        error: "INVALID_REFRESH_TOKEN",
        message: "Refresh token inválido",
      });
      return;
    }

    // Busca usuário atualizado
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      res.status(401).json({
        error: "USER_NOT_FOUND",
        message: "Usuário não encontrado",
      });
      return;
    }

    // Gera novo access token
    const newAccessToken = TokenService.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.status(200).json({
      message: "Token renovado com sucesso",
      accessToken: newAccessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        phoneCompleted: user.phoneCompleted,
        addressCompleted: user.addressCompleted,
        legalAcceptanceRequired: user.legalAcceptanceRequired,
        termsAcceptedAt: user.termsAcceptedAt,
        termsAcceptedVersion: user.termsAcceptedVersion,
        privacyAcceptedAt: user.privacyAcceptedAt,
        privacyAcceptedVersion: user.privacyAcceptedVersion,
        salesDisclaimerAcceptedAt: user.salesDisclaimerAcceptedAt,
        salesDisclaimerAcceptedVersion: user.salesDisclaimerAcceptedVersion,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Erro ao renovar token:", error);
    res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Erro ao renovar token",
    });
  }
});

/**
 * POST /api/auth/logout
 * Faz logout revogando o refresh token
 * Lê refresh token apenas de cookie HttpOnly
 */
router.post(
  "/logout",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];

      if (refreshToken) {
        await TokenService.revokeRefreshToken(refreshToken);
      }

      // Clear the refresh token cookie
      res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, getClearCookieOptions());

      res.status(200).json({
        message: "Logout realizado com sucesso",
      });
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      res.status(500).json({
        error: "INTERNAL_ERROR",
        message: "Erro ao processar logout",
      });
    }
  }
);

/**
 * GET /api/auth/me
 * Retorna dados do usuário autenticado
 */
router.get(
  "/me",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          error: "UNAUTHORIZED",
          message: "Usuário não autenticado",
        });
        return;
      }

      res.status(200).json({
        user: {
          id: req.user.id,
          name: req.user.name,
          email: req.user.email,
          phone: req.user.phone,
          phoneCompleted: req.user.phoneCompleted,
          addressCompleted: req.user.addressCompleted,
          legalAcceptanceRequired: req.user.legalAcceptanceRequired,
          termsAcceptedAt: req.user.termsAcceptedAt,
          termsAcceptedVersion: req.user.termsAcceptedVersion,
          privacyAcceptedAt: req.user.privacyAcceptedAt,
          privacyAcceptedVersion: req.user.privacyAcceptedVersion,
          salesDisclaimerAcceptedAt: req.user.salesDisclaimerAcceptedAt,
          salesDisclaimerAcceptedVersion: req.user.salesDisclaimerAcceptedVersion,
          role: req.user.role,
          createdAt: req.user.createdAt,
          defaultZipCode: req.user.defaultZipCode,
          defaultAddress: req.user.defaultAddress,
          defaultAddressNumber: req.user.defaultAddressNumber,
          defaultNeighborhood: req.user.defaultNeighborhood,
          defaultCity: req.user.defaultCity,
          defaultState: req.user.defaultState,
          defaultLatitude: req.user.defaultLatitude,
          defaultLongitude: req.user.defaultLongitude,
        },
      });
    } catch (error) {
      console.error("Erro ao buscar dados do usuário:", error);
      res.status(500).json({
        error: "INTERNAL_ERROR",
        message: "Erro ao buscar dados do usuário",
      });
    }
  }
);

// ========== GOOGLE OAUTH ==========

/**
 * GET /api/auth/google
 * Inicia o fluxo de autenticação do Google OAuth
 */
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

/**
 * GET /api/auth/google/callback
 * Callback do Google OAuth
 * Sets refresh token as HttpOnly cookie and passes only access token in URL
 */
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login",
  }),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.redirect(
          `${
            process.env.FRONTEND_URL || "http://localhost:5173"
          }/login?error=auth_failed`
        );
        return;
      }

      const user = req.user as OAuthUser;

      // Gera tokens
      const tokens = TokenService.generateTokenPair({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      // Salva refresh token
      await TokenService.saveRefreshToken(user.id, tokens.refreshToken);

      // Set refresh token as HttpOnly cookie
      res.cookie(
        REFRESH_TOKEN_COOKIE_NAME,
        tokens.refreshToken,
        getRefreshTokenCookieOptions()
      );

      // Redireciona para o frontend apenas com access token (refresh token fica no cookie HttpOnly)
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      res.redirect(
        `${frontendUrl}/auth/callback?` +
          `accessToken=${tokens.accessToken}&` +
          `userId=${encodeURIComponent(user.id)}&` +
          `userName=${encodeURIComponent(user.name)}&` +
          `userEmail=${encodeURIComponent(user.email)}&` +
          `userRole=${user.role}&` +
          `phoneCompleted=${user.phoneCompleted || false}&` +
          `addressCompleted=${user.addressCompleted || false}&` +
          `legalAcceptanceRequired=${user.legalAcceptanceRequired || false}`
      );
    } catch (error) {
      console.error("Erro no callback do Google:", error);
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      res.redirect(`${frontendUrl}/login?error=auth_failed`);
    }
  }
);

// ========== PASSWORD RESET ==========

/**
 * POST /api/auth/request-password-reset
 * Solicita reset de senha (gera token)
 */
router.post(
  "/request-password-reset",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = requestPasswordResetSchema.parse(req.body);

      // Busca usuário
      const user = await prisma.user.findUnique({ where: { email } });

      // Por segurança, sempre retorna sucesso (não revela se email existe)
      if (!user) {
        res.json({
          message:
            "Se o email existir em nossa base, você receberá instruções para resetar sua senha",
        });
        return;
      }

      // Verifica se usuário tem senha (pode ser OAuth)
      if (!user.password) {
        res.status(400).json({
          error: "NO_PASSWORD",
          message:
            'Este usuário foi criado via Google. Use "Continuar com Google" para fazer login',
        });
        return;
      }

      // Gera token único
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

      // Salva token no banco
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token,
          expiresAt,
        },
      });

      // Enfileirar email de reset de senha
      try {
        await queuePasswordResetEmail(user.id, user.name, user.email, token);
        console.log(`[Auth] Password reset email queued for user ${user.id}`);
      } catch (emailError) {
        console.error('[Auth] Failed to queue password reset email:', emailError);
        // Não falha a requisição se o email falhar
      }

      // Log para desenvolvimento
      if (process.env.NODE_ENV === "development") {
        console.log(`🔑 Password reset token para ${email}: ${token}`);
        console.log(
          `Link: ${
            process.env.FRONTEND_URL || "http://localhost:5173"
          }/reset-password?token=${token}`
        );
      }

      res.json({
        message:
          "Se o email existir em nossa base, você receberá instruções para resetar sua senha",
        ...(process.env.EXPOSE_RESET_TOKEN_IN_RESPONSE === "true" && { token }),
      });
    } catch (error) {
      console.error("Erro ao solicitar reset de senha:", error);
      res.status(500).json({
        error: "INTERNAL_ERROR",
        message: "Erro ao processar solicitação",
      });
    }
  }
);

/**
 * POST /api/auth/reset-password
 * Reseta a senha usando o token
 */
router.post(
  "/reset-password",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { token, newPassword } = resetPasswordSchema.parse(req.body);

      // Busca token
      const resetToken = await prisma.passwordResetToken.findUnique({
        where: { token },
        include: { user: true },
      });

      if (!resetToken) {
        res.status(400).json({
          error: "INVALID_TOKEN",
          message: "Token inválido ou expirado",
        });
        return;
      }

      // Verifica se token já foi usado
      if (resetToken.used) {
        res.status(400).json({
          error: "TOKEN_ALREADY_USED",
          message: "Este token já foi utilizado",
        });
        return;
      }

      // Verifica se token expirou
      if (resetToken.expiresAt < new Date()) {
        res.status(400).json({
          error: "TOKEN_EXPIRED",
          message: "Token expirado. Solicite um novo reset de senha",
        });
        return;
      }

      // Valida nova senha
      const passwordValidation = AuthService.validatePassword(newPassword);
      if (!passwordValidation.valid) {
        res.status(400).json({
          error: "WEAK_PASSWORD",
          message: "Senha não atende aos requisitos mínimos",
          details: passwordValidation.errors,
        });
        return;
      }

      // Hash da nova senha
      const hashedPassword = await AuthService.hashPassword(newPassword);

      // Atualiza senha do usuário e marca token como usado
      await prisma.$transaction([
        prisma.user.update({
          where: { id: resetToken.userId },
          data: { password: hashedPassword },
        }),
        prisma.passwordResetToken.update({
          where: { id: resetToken.id },
          data: { used: true },
        }),
      ]);

      res.json({ message: "Senha alterada com sucesso" });
    } catch (error) {
      console.error("Erro ao resetar senha:", error);
      res.status(500).json({
        error: "INTERNAL_ERROR",
        message: "Erro ao resetar senha",
      });
    }
  }
);

// ========== PROFILE MANAGEMENT ==========

/**
 * PATCH /api/auth/profile
 * Atualiza perfil do usuário (nome e/ou senha)
 */
router.patch(
  "/profile",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, phone, currentPassword, newPassword } =
        updateProfileSchema.parse(req.body);

      const updates: Prisma.UserUpdateInput = {};

      // Atualiza telefone se fornecido
      if (phone) {
        updates.phone = phone;
      }

      // Atualiza nome se fornecido
      if (name) {
        updates.name = capitalizeName(name);
      }

      // Atualiza senha se fornecida
      if (newPassword) {
        if (!currentPassword) {
          res.status(400).json({
            error: "CURRENT_PASSWORD_REQUIRED",
            message: "Senha atual é necessária para alterar a senha",
          });
          return;
        }

        // Busca usuário
        const user = await prisma.user.findUnique({
          where: { id: req.user!.id },
        });

        if (!user || !user.password) {
          res.status(400).json({
            error: "NO_PASSWORD",
            message: "Usuário não possui senha (conta OAuth)",
          });
          return;
        }

        // Verifica senha atual
        const isValid = await AuthService.verifyPassword(
          currentPassword,
          user.password
        );

        if (!isValid) {
          res.status(401).json({
            error: "INVALID_CURRENT_PASSWORD",
            message: "Senha atual incorreta",
          });
          return;
        }

        // Valida nova senha
        const passwordValidation = AuthService.validatePassword(newPassword);
        if (!passwordValidation.valid) {
          res.status(400).json({
            error: "WEAK_PASSWORD",
            message: "Nova senha não atende aos requisitos mínimos",
            details: passwordValidation.errors,
          });
          return;
        }

        updates.password = await AuthService.hashPassword(newPassword);
      }

      // Atualiza usuário
      const updatedUser = await prisma.user.update({
        where: { id: req.user!.id },
        data: updates,
      });

      res.json({
        message: "Perfil atualizado com sucesso",
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          role: updatedUser.role,
        },
      });
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      res.status(500).json({
        error: "INTERNAL_ERROR",
        message: "Erro ao atualizar perfil",
      });
    }
  }
);

/**
 * PATCH /api/auth/complete-phone
 * Completa o cadastro de telefone para usuários OAuth
 */
router.patch(
  "/complete-phone",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      console.log("[CompletePhone] Requisição recebida:", {
        userId: req.user!.id,
        body: req.body,
      });

      const { phone } = completePhoneSchema.parse(req.body);

      console.log("[CompletePhone] Validação OK, atualizando usuário:", {
        userId: req.user!.id,
        phone,
      });

      // Atualiza usuário com telefone e marca como completo
      const updatedUser = await prisma.user.update({
        where: { id: req.user!.id },
        data: {
          phone,
          phoneCompleted: true,
        },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          phoneCompleted: true,
          addressCompleted: true,
          legalAcceptanceRequired: true,
          termsAcceptedAt: true,
          termsAcceptedVersion: true,
          privacyAcceptedAt: true,
          privacyAcceptedVersion: true,
          salesDisclaimerAcceptedAt: true,
          salesDisclaimerAcceptedVersion: true,
        },
      });

      console.log("[CompletePhone] Usuário atualizado com sucesso:", {
        userId: updatedUser.id,
        phoneCompleted: updatedUser.phoneCompleted,
      });

      res.json({
        message: "Telefone cadastrado com sucesso",
        user: updatedUser,
      });
    } catch (error) {
      console.error("[CompletePhone] Erro ao completar telefone:", error);

      if (error instanceof z.ZodError) {
        console.error("[CompletePhone] Erro de validação:", error.errors);
        res.status(400).json({
          error: "VALIDATION_ERROR",
          message: "Formato de telefone inválido",
          details: error.errors,
        });
        return;
      }

      res.status(500).json({
        error: "INTERNAL_ERROR",
        message: "Erro ao cadastrar telefone",
      });
    }
  }
);

/**
 * PATCH /api/auth/complete-address
 * Completa o cadastro de endereço para usuários (obrigatório no primeiro login)
 */
const completeAddressSchema = z.object({
  zipCode: z.string().regex(/^\d{5}-?\d{3}$/, "CEP deve ter o formato XXXXX-XXX"),
  address: z.string().min(1, "Endereço é obrigatório"),
  addressNumber: z.string().min(1, "Número é obrigatório"),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
});

router.patch(
  "/complete-address",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const data = completeAddressSchema.parse(req.body);

      // Geocodificar para obter coordenadas e dados completos
      let latitude: number | null = null;
      let longitude: number | null = null;
      let neighborhood = data.neighborhood;
      let city = data.city;
      let state = data.state;

      try {
        const geoResult = await geocodingService.geocodeCEP(
          data.zipCode,
          data.addressNumber
        );
        latitude = geoResult.latitude;
        longitude = geoResult.longitude;
        neighborhood = neighborhood || geoResult.neighborhood;
        city = city || geoResult.city;
        state = state || geoResult.state;
      } catch (geoError) {
        console.warn("[CompleteAddress] Falha na geocodificação:", geoError);
      }

      const updatedUser = await prisma.user.update({
        where: { id: req.user!.id },
        data: {
          defaultZipCode: geocodingService.formatCEP(data.zipCode),
          defaultAddress: data.address,
          defaultAddressNumber: data.addressNumber,
          defaultNeighborhood: neighborhood,
          defaultCity: city,
          defaultState: state,
          defaultLatitude: latitude,
          defaultLongitude: longitude,
          addressCompleted: true,
        },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          phoneCompleted: true,
          addressCompleted: true,
          legalAcceptanceRequired: true,
          termsAcceptedAt: true,
          termsAcceptedVersion: true,
          privacyAcceptedAt: true,
          privacyAcceptedVersion: true,
          salesDisclaimerAcceptedAt: true,
          salesDisclaimerAcceptedVersion: true,
          defaultZipCode: true,
          defaultAddress: true,
          defaultAddressNumber: true,
          defaultNeighborhood: true,
          defaultCity: true,
          defaultState: true,
          defaultLatitude: true,
          defaultLongitude: true,
        },
      });

      res.json({
        message: "Endereço cadastrado com sucesso",
        user: updatedUser,
      });
    } catch (error) {
      console.error("[CompleteAddress] Erro ao completar endereço:", error);

      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: "VALIDATION_ERROR",
          message: "Dados de endereço inválidos",
          details: error.errors,
        });
        return;
      }

      res.status(500).json({
        error: "INTERNAL_ERROR",
        message: "Erro ao cadastrar endereço",
      });
    }
  }
);

export default router;
