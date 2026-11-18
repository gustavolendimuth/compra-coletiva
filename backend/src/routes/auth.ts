import { Router, Request, Response, NextFunction } from "express";
import { PrismaClient, Prisma, LegalDocumentType, User } from "@prisma/client";
import { z } from "zod";
import crypto from "crypto";
import passport from "passport";
import { AuthService } from "../services/authService";
import { TokenService } from "../services/tokenService";
import { safeError } from "../utils/safeLog";
import { requireAuth } from "../middleware/authMiddleware";
import {
  loginRateLimiter,
  registerRateLimiter,
  passwordResetRateLimiter,
  verificationResendRateLimiter,
} from "../middleware/rateLimiter";
import {
  REFRESH_TOKEN_COOKIE_NAME,
  getRefreshTokenCookieOptions,
  getClearCookieOptions,
} from "../utils/cookieConfig";
import { capitalizeName } from "../utils/nameFormatter";
import {
  queueWelcomeEmail,
  queuePasswordResetEmail,
  queueSignupVerificationEmail,
} from "../services/email/emailQueue";
import { EmailVerificationService } from "../services/emailVerificationService";
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
    hideNameInCampaigns: true;
  };
}>;

// ========== HELPER FUNCTIONS ==========

/**
 * Usuário devolvido no login e na confirmação de email
 */
function toAuthUser(user: User) {
  return {
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
    hideNameInCampaigns: user.hideNameInCampaigns,
    role: user.role,
    hasPassword: Boolean(user.password),
    hasGoogle: Boolean(user.googleId),
  };
}

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
  hideNameInCampaigns: z.boolean().optional().default(false),
});

const loginSchema = z.object({
  email: z.preprocess(normalizeEmail, z.string().email("Email inválido")),
  password: z.string().min(1, "Senha é obrigatória"),
});

const requestPasswordResetSchema = z.object({
  email: z.preprocess(normalizeEmail, z.string().email("Email inválido")),
});

const verifySignupEmailSchema = z.object({
  token: z.string().min(1, "Token é obrigatório"),
});

const resendVerificationSchema = z.object({
  email: z.preprocess(normalizeEmail, z.string().email("Email inválido")),
});

const PASSWORD_RESET_REQUESTED_MESSAGE =
  "Se houver uma conta com este email, enviamos um link para criar uma nova senha.";
const RESET_LINK_USED_MESSAGE =
  "Este link de redefinição já foi usado. Peça um novo link se precisar trocar a senha de novo.";

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
  hideNameInCampaigns: z.boolean().optional(),
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
    console.error("Erro ao verificar nome:", safeError(error));
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
router.post("/register", registerRateLimiter, async (req: Request, res: Response): Promise<void> => {
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

    const { name, email, password, phone, hideNameInCampaigns } = validationResult.data;

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

    // Resposta igual exista ou não a conta: o cadastro não revela emails cadastrados
    const pendingResponse = {
      message: "Enviamos um link de confirmação para o seu email. Abra-o para ativar sua conta.",
      email,
    };

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    // Conta já verificada: não envia nada (o dono entra pelo login)
    if (existingUser?.emailVerifiedAt) {
      res.status(202).json(pendingResponse);
      return;
    }

    // Hash da senha
    const hashedPassword = await AuthService.hashPassword(password);

    const acceptedAt = new Date();
    const userData = {
      name: capitalizeName(name),
      password: hashedPassword,
      phone,
      phoneCompleted: true, // Email/password users provide phone during registration
      hideNameInCampaigns,
      legalAcceptanceRequired: false,
      termsAcceptedAt: acceptedAt,
      termsAcceptedVersion: LEGAL_TERMS_VERSION,
      privacyAcceptedAt: acceptedAt,
      privacyAcceptedVersion: LEGAL_PRIVACY_VERSION,
    };

    // Conta pendente (cadastro não confirmado ou usuário legado criado por organizador):
    // os dados do cadastro mais recente substituem os anteriores, e só quem abrir o link
    // enviado ao email ativa a conta.
    const { user, verificationToken } = await prisma.$transaction(async (tx) => {
      const savedUser = existingUser
        ? await tx.user.update({
            where: { id: existingUser.id },
            data: { ...userData, isLegacyUser: false },
          })
        : await tx.user.create({
            data: {
              ...userData,
              email,
              addressCompleted: false, // Users need to complete address after first login
              role: "CUSTOMER", // Default role
            },
          });

      await Promise.all([
        LegalAcceptanceService.recordAcceptance({
          userId: savedUser.id,
          documentType: LegalDocumentType.TERMS,
          documentVersion: LEGAL_TERMS_VERSION,
          context: LEGAL_ACCEPTANCE_CONTEXT.REGISTER,
          req,
          tx,
        }),
        LegalAcceptanceService.recordAcceptance({
          userId: savedUser.id,
          documentType: LegalDocumentType.PRIVACY,
          documentVersion: LEGAL_PRIVACY_VERSION,
          context: LEGAL_ACCEPTANCE_CONTEXT.REGISTER,
          req,
          tx,
        }),
      ]);

      const token = await EmailVerificationService.issueToken(savedUser.id, tx);
      return { user: savedUser, verificationToken: token };
    });

    try {
      await queueSignupVerificationEmail(user.id, user.name, user.email, verificationToken);
    } catch (emailError) {
      console.error('[Auth] Failed to queue signup verification email:', safeError(emailError));
      // O usuário pode pedir reenvio pela tela de login
    }

    res.status(202).json(pendingResponse);
  } catch (error) {
    console.error("Erro ao registrar usuário:", safeError(error));
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
router.post("/login", loginRateLimiter, async (req: Request, res: Response): Promise<void> => {
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

    // Conta só com Google responde igual a senha errada: não revela que o email existe
    if (!user || !user.password) {
      res.status(401).json({
        error: "INVALID_CREDENTIALS",
        message: "Email ou senha incorretos",
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

    // Só depois da senha certa: quem não sabe a senha não descobre o estado da conta
    if (!user.emailVerifiedAt) {
      res.status(403).json({
        error: "EMAIL_NOT_VERIFIED",
        message: "Confirme seu email para entrar. Procure o link que enviamos no cadastro.",
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
      user: toAuthUser(user),
      accessToken: tokens.accessToken,
    });
  } catch (error) {
    console.error("Erro ao fazer login:", safeError(error));
    res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Erro ao processar login",
    });
  }
});

/**
 * POST /api/auth/verify-email
 * Confirma o email do cadastro e já abre a sessão
 */
router.post("/verify-email", async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = verifySignupEmailSchema.safeParse(req.body);
    const user = parsed.success
      ? await EmailVerificationService.consumeToken(parsed.data.token)
      : null;

    if (!user) {
      res.status(400).json({
        error: "INVALID_TOKEN",
        message: "Link de confirmação inválido ou expirado",
      });
      return;
    }

    try {
      await queueWelcomeEmail(user.id, user.name, user.email);
    } catch (emailError) {
      console.error('[Auth] Failed to queue welcome email:', safeError(emailError));
      // Não falha a confirmação se o email falhar
    }

    const tokens = TokenService.generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
    await TokenService.saveRefreshToken(user.id, tokens.refreshToken);
    res.cookie(
      REFRESH_TOKEN_COOKIE_NAME,
      tokens.refreshToken,
      getRefreshTokenCookieOptions()
    );

    res.status(200).json({
      message: "Email confirmado com sucesso",
      user: toAuthUser(user),
      accessToken: tokens.accessToken,
    });
  } catch (error) {
    console.error("Erro ao confirmar email:", safeError(error));
    res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Erro ao confirmar email",
    });
  }
});

/**
 * POST /api/auth/resend-verification
 * Reenvia o link de confirmação (resposta igual exista ou não a conta)
 */
router.post(
  "/resend-verification",
  verificationResendRateLimiter,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const parsed = resendVerificationSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: "VALIDATION_ERROR",
          message: "Email inválido",
        });
        return;
      }

      const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });

      // Só cadastro pendente com senha recebe link (legado sem senha se ativa pelo cadastro)
      if (user && !user.emailVerifiedAt && user.password && !user.deletedAt) {
        const token = await EmailVerificationService.issueToken(user.id);
        try {
          await queueSignupVerificationEmail(user.id, user.name, user.email, token);
        } catch (emailError) {
          console.error('[Auth] Failed to queue signup verification email:', safeError(emailError));
        }
      }

      res.json({
        message: "Se houver um cadastro pendente para este email, enviamos um novo link de confirmação.",
      });
    } catch (error) {
      console.error("Erro ao reenviar confirmação de email:", safeError(error));
      res.status(500).json({
        error: "INTERNAL_ERROR",
        message: "Erro ao processar solicitação",
      });
    }
  }
);

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

    // Rotação: consome o refresh atual (reuso revoga todas as sessões)
    const consumption = await TokenService.consumeRefreshToken(refreshToken);

    if (consumption.outcome !== "consumed") {
      res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, getClearCookieOptions());
      res.status(401).json({
        error: "INVALID_REFRESH_TOKEN",
        message: "Refresh token inválido ou expirado",
      });
      return;
    }

    // Busca usuário atualizado
    const user = await prisma.user.findUnique({
      where: { id: consumption.payload.userId },
    });

    if (!user || user.deletedAt) {
      res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, getClearCookieOptions());
      res.status(401).json({
        error: "USER_NOT_FOUND",
        message: "Usuário não encontrado",
      });
      return;
    }

    // Gera novo par e grava o novo refresh (rotação)
    const tokens = TokenService.generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
    await TokenService.saveRefreshToken(user.id, tokens.refreshToken);
    res.cookie(
      REFRESH_TOKEN_COOKIE_NAME,
      tokens.refreshToken,
      getRefreshTokenCookieOptions()
    );
    const newAccessToken = tokens.accessToken;

    res.status(200).json({
      message: "Token renovado com sucesso",
      accessToken: newAccessToken,
      user: toAuthUser(user),
    });
  } catch (error) {
    console.error("Erro ao renovar token:", safeError(error));
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
      console.error("Erro ao fazer logout:", safeError(error));
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
          hideNameInCampaigns: req.user.hideNameInCampaigns,
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
          hasPassword: Boolean(req.user.password),
          hasGoogle: Boolean(req.user.googleId),
        },
      });
    } catch (error) {
      console.error("Erro ao buscar dados do usuário:", safeError(error));
      res.status(500).json({
        error: "INTERNAL_ERROR",
        message: "Erro ao buscar dados do usuário",
      });
    }
  }
);

// ========== GOOGLE OAUTH ==========

const OAUTH_STATE_COOKIE_NAME = "oauthState";
// Marca que o fluxo em curso é "vincular Google" à conta logada
const OAUTH_LINK_COOKIE_NAME = "oauthLink";
const OAUTH_STATE_MAX_AGE_MS = 10 * 60 * 1000;

const getOAuthStateCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/api/auth/google",
});

const getFrontendUrl = () => process.env.FRONTEND_URL || "http://localhost:5173";

const isSameState = (expected: unknown, received: unknown): boolean => {
  if (typeof expected !== "string" || typeof received !== "string") return false;
  if (!expected || expected.length !== received.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));
};

// Conta logada no navegador, pelo refresh token do cookie (sem rotacioná-lo)
const findLoggedInUserId = async (req: Request): Promise<string | null> => {
  const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];
  return typeof refreshToken === "string" && refreshToken
    ? TokenService.findActiveSessionUserId(refreshToken)
    : null;
};

const linkResultUrl = (result: string) =>
  `${getFrontendUrl()}/perfil?google=${encodeURIComponent(result)}`;

/**
 * GET /api/auth/google
 * Inicia o fluxo de autenticação do Google OAuth com `state` anti-CSRF.
 * `?intent=link` vincula o Google à conta logada em vez de fazer login.
 */
router.get("/google", async (req: Request, res: Response, next) => {
  const isLink = req.query.intent === "link";
  if (isLink) {
    try {
      if (!(await findLoggedInUserId(req))) {
        res.redirect(linkResultUrl("auth_required"));
        return;
      }
    } catch (error) {
      console.error("Erro ao iniciar vínculo com Google:", safeError(error));
      res.redirect(linkResultUrl("failed"));
      return;
    }
  }

  const state = crypto.randomBytes(32).toString("hex");
  const cookieOptions = { ...getOAuthStateCookieOptions(), maxAge: OAUTH_STATE_MAX_AGE_MS };
  res.cookie(OAUTH_STATE_COOKIE_NAME, state, cookieOptions);
  if (isLink) {
    res.cookie(OAUTH_LINK_COOKIE_NAME, "1", cookieOptions);
  } else {
    res.clearCookie(OAUTH_LINK_COOKIE_NAME, getOAuthStateCookieOptions());
  }

  passport.authenticate(isLink ? "google-link" : "google", {
    scope: ["profile", "email"],
    session: false,
    state,
    ...(isLink && { prompt: "select_account" }),
  })(req, res, next);
});

/**
 * Callback do fluxo "vincular Google": não abre sessão nova, só volta ao perfil
 * com o resultado em `?google=`.
 */
const handleGoogleLinkCallback = async (req: Request, res: Response, next: NextFunction) => {
  let userId: string | null;
  try {
    userId = await findLoggedInUserId(req);
  } catch (error) {
    console.error("Erro ao vincular conta Google:", safeError(error));
    res.redirect(linkResultUrl("failed"));
    return;
  }
  if (!userId) {
    res.redirect(linkResultUrl("auth_required"));
    return;
  }
  req.oauthLinkUserId = userId;

  passport.authenticate(
    "google-link",
    { session: false },
    (err: unknown, user: OAuthUser | false, info?: { message?: string }) => {
      if (err) {
        console.error("Erro ao vincular conta Google:", safeError(err));
        res.redirect(linkResultUrl("failed"));
        return;
      }
      res.redirect(linkResultUrl(user ? "linked" : info?.message ?? "failed"));
    }
  )(req, res, next);
};

/**
 * GET /api/auth/google/callback
 * Callback do Google OAuth
 * Valida `state`, grava o refresh token em cookie HttpOnly e redireciona
 * para /auth/callback sem nenhum dado na URL (a página chama /refresh)
 */
router.get("/google/callback", async (req: Request, res: Response, next) => {
  const frontendUrl = getFrontendUrl();
  const expectedState = req.cookies?.[OAUTH_STATE_COOKIE_NAME];
  const isLink = req.cookies?.[OAUTH_LINK_COOKIE_NAME] === "1";
  res.clearCookie(OAUTH_STATE_COOKIE_NAME, getOAuthStateCookieOptions());
  res.clearCookie(OAUTH_LINK_COOKIE_NAME, getOAuthStateCookieOptions());

  if (!isSameState(expectedState, req.query.state)) {
    res.redirect(
      isLink ? linkResultUrl("oauth_state") : `${frontendUrl}/auth/callback?error=oauth_state`
    );
    return;
  }

  if (isLink) {
    await handleGoogleLinkCallback(req, res, next);
    return;
  }

  passport.authenticate(
    "google",
    { session: false },
    async (err: unknown, user: OAuthUser | false, info?: { message?: string }) => {
      try {
        if (!err && !user && info?.message === "email_not_verified") {
          res.redirect(`${frontendUrl}/auth/callback?error=email_not_verified`);
          return;
        }

        if (err || !user) {
          if (err) console.error("Erro no callback do Google:", safeError(err));
          res.redirect(`${frontendUrl}/login?error=auth_failed`);
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

        // Sem token nem dados do usuário na URL
        res.redirect(`${frontendUrl}/auth/callback`);
      } catch (error) {
        console.error("Erro no callback do Google:", safeError(error));
        res.redirect(`${frontendUrl}/login?error=auth_failed`);
      }
    }
  )(req, res, next);
});

// ========== PASSWORD RESET ==========

/**
 * POST /api/auth/request-password-reset
 * Solicita reset de senha (gera token)
 */
router.post(
  "/request-password-reset",
  passwordResetRateLimiter,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const validationResult = requestPasswordResetSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          error: "VALIDATION_ERROR",
          message: "Email inválido",
        });
        return;
      }
      const { email } = validationResult.data;

      const user = await prisma.user.findUnique({ where: { email } });

      // Mesma resposta para qualquer email (não revela se existe). Conta só com
      // Google também recebe o link: é assim que ela cria uma senha.
      if (!user || user.deletedAt) {
        res.json({ message: PASSWORD_RESET_REQUESTED_MESSAGE });
        return;
      }

      // Gera token único
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

      // Salva só o hash do token no banco; o token cru vai apenas no e-mail
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: TokenService.hashToken(token),
          expiresAt,
        },
      });

      // Enfileirar email de reset de senha
      try {
        await queuePasswordResetEmail(user.id, user.name, user.email, token);
        console.log(`[Auth] Password reset email queued for user ${user.id}`);
      } catch (emailError) {
        console.error('[Auth] Failed to queue password reset email:', safeError(emailError));
        // Não falha a requisição se o email falhar
      }

      // Log para desenvolvimento
      if (process.env.NODE_ENV === "development") {
        console.log(`🔑 Password reset token para o usuário ${user.id}: ${token}`);
        console.log(
          `Link: ${
            process.env.FRONTEND_URL || "http://localhost:5173"
          }/reset-password?token=${token}`
        );
      }

      res.json({
        message: PASSWORD_RESET_REQUESTED_MESSAGE,
        ...(process.env.EXPOSE_RESET_TOKEN_IN_RESPONSE === "true" &&
          process.env.NODE_ENV !== "production" && { token }),
      });
    } catch (error) {
      console.error("Erro ao solicitar reset de senha:", safeError(error));
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
      const validationResult = resetPasswordSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          error: "VALIDATION_ERROR",
          message: validationResult.error.errors[0]?.message ?? "Dados inválidos",
        });
        return;
      }
      const { token, newPassword } = validationResult.data;

      // Busca token
      const resetToken = await prisma.passwordResetToken.findUnique({
        where: { token: TokenService.hashToken(token) },
        include: { user: true },
      });

      if (!resetToken || resetToken.user.deletedAt) {
        res.status(400).json({
          error: "INVALID_TOKEN",
          message: "Este link de redefinição não é válido. Peça um novo link.",
        });
        return;
      }

      if (resetToken.used) {
        res.status(400).json({
          error: "TOKEN_ALREADY_USED",
          message: RESET_LINK_USED_MESSAGE,
        });
        return;
      }

      if (resetToken.expiresAt < new Date()) {
        res.status(400).json({
          error: "TOKEN_EXPIRED",
          message: "Este link de redefinição expirou. Peça um novo link.",
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

      // Consome o token de forma atômica: só uma requisição concorrente vence
      const consumed = await prisma.$transaction(async (tx) => {
        const { count } = await tx.passwordResetToken.updateMany({
          where: { id: resetToken.id, used: false, expiresAt: { gt: new Date() } },
          data: { used: true },
        });
        if (count !== 1) {
          return false;
        }

        // O link do reset chegou ao email: isso também comprova a posse do email
        await tx.user.update({
          where: { id: resetToken.userId },
          data: {
            password: hashedPassword,
            emailVerifiedAt: resetToken.user.emailVerifiedAt ?? new Date(),
            emailVerificationToken: null,
            emailVerificationExpires: null,
          },
        });
        // Derruba todas as sessões e invalida outros tokens de reset pendentes
        await tx.session.deleteMany({ where: { userId: resetToken.userId } });
        await tx.passwordResetToken.deleteMany({
          where: { userId: resetToken.userId, id: { not: resetToken.id } },
        });
        return true;
      });

      if (!consumed) {
        res.status(400).json({
          error: "TOKEN_ALREADY_USED",
          message: RESET_LINK_USED_MESSAGE,
        });
        return;
      }

      res.json({ message: "Senha alterada com sucesso" });
    } catch (error) {
      console.error("Erro ao resetar senha:", safeError(error));
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
      const { name, phone, currentPassword, newPassword, hideNameInCampaigns } =
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

      if (typeof hideNameInCampaigns === "boolean") {
        updates.hideNameInCampaigns = hideNameInCampaigns;
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

      // Troca de senha derruba as outras sessões; a atual continua válida
      if (updates.password) {
        await TokenService.revokeOtherUserTokens(
          req.user!.id,
          req.cookies?.[REFRESH_TOKEN_COOKIE_NAME]
        );
      }

      res.json({
        message: "Perfil atualizado com sucesso",
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          hideNameInCampaigns: updatedUser.hideNameInCampaigns,
          role: updatedUser.role,
        },
      });
    } catch (error) {
      console.error("Erro ao atualizar perfil:", safeError(error));
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
      const { phone } = completePhoneSchema.parse(req.body);

      console.log("[CompletePhone] Validação OK, atualizando usuário:", {
        userId: req.user!.id,
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
          hideNameInCampaigns: true,
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
      console.error("[CompletePhone] Erro ao completar telefone:", safeError(error));

      if (error instanceof z.ZodError) {
        console.error("[CompletePhone] Erro de validação:", error.errors.map((issue) => issue.message));
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
        console.warn("[CompleteAddress] Falha na geocodificação:", safeError(geoError));
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
          hideNameInCampaigns: true,
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
      console.error("[CompleteAddress] Erro ao completar endereço:", safeError(error));

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
