import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import crypto from 'crypto';
import passport from 'passport';
import { AuthService } from '../services/authService';
import { TokenService } from '../services/tokenService';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();
const prisma = new PrismaClient();

// ========== SCHEMAS DE VALIDAÇÃO ==========

const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token é obrigatório'),
});

const requestPasswordResetSchema = z.object({
  email: z.string().email('Email inválido'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
  newPassword: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, 'Nova senha deve ter pelo menos 6 caracteres').optional(),
});

// ========== ROTAS ==========

/**
 * POST /api/auth/register
 * Registra um novo usuário
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    // Valida dados
    const validationResult = registerSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Dados inválidos',
        details: validationResult.error.errors,
      });
      return;
    }

    const { name, email, password } = validationResult.data;

    // Valida email
    if (!AuthService.validateEmail(email)) {
      res.status(400).json({
        error: 'INVALID_EMAIL',
        message: 'Formato de email inválido',
      });
      return;
    }

    // Valida senha
    const passwordValidation = AuthService.validatePassword(password);
    if (!passwordValidation.valid) {
      res.status(400).json({
        error: 'WEAK_PASSWORD',
        message: 'Senha não atende aos requisitos mínimos',
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
        error: 'EMAIL_ALREADY_EXISTS',
        message: 'Este email já está cadastrado',
      });
      return;
    }

    // Verifica se nome já existe (apenas para usuários não-legados)
    const existingName = await prisma.user.findFirst({
      where: {
        name,
        isLegacyUser: false
      },
    });

    if (existingName) {
      res.status(409).json({
        error: 'NAME_ALREADY_EXISTS',
        message: 'Este nome já está em uso. Por favor, escolha outro nome',
      });
      return;
    }

    // Hash da senha
    const hashedPassword = await AuthService.hashPassword(password);

    // Cria usuário
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'CUSTOMER', // Default role
      },
    });

    // Gera tokens
    const tokens = TokenService.generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Salva refresh token
    await TokenService.saveRefreshToken(user.id, tokens.refreshToken);

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      ...tokens,
    });
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Erro ao criar usuário',
    });
  }
});

/**
 * POST /api/auth/login
 * Faz login de um usuário
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    // Valida dados
    const validationResult = loginSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Dados inválidos',
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
        error: 'INVALID_CREDENTIALS',
        message: 'Email ou senha incorretos',
      });
      return;
    }

    // Verifica se o usuário tem senha (pode ser OAuth user)
    if (!user.password) {
      res.status(401).json({
        error: 'NO_PASSWORD',
        message: 'Este usuário foi criado via Google. Use "Continuar com Google"',
      });
      return;
    }

    // Verifica senha
    const isPasswordValid = await AuthService.verifyPassword(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'Email ou senha incorretos',
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

    res.status(200).json({
      message: 'Login realizado com sucesso',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      ...tokens,
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Erro ao processar login',
    });
  }
});

/**
 * POST /api/auth/refresh
 * Renova o access token usando refresh token
 */
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    // Valida dados
    const validationResult = refreshSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Refresh token não fornecido',
      });
      return;
    }

    const { refreshToken } = validationResult.data;

    // Verifica se refresh token existe no banco
    const isValid = await TokenService.validateRefreshToken(refreshToken);

    if (!isValid) {
      res.status(401).json({
        error: 'INVALID_REFRESH_TOKEN',
        message: 'Refresh token inválido ou expirado',
      });
      return;
    }

    // Decodifica refresh token
    let payload;
    try {
      payload = TokenService.verifyRefreshToken(refreshToken);
    } catch (error) {
      res.status(401).json({
        error: 'INVALID_REFRESH_TOKEN',
        message: 'Refresh token inválido',
      });
      return;
    }

    // Busca usuário atualizado
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      res.status(401).json({
        error: 'USER_NOT_FOUND',
        message: 'Usuário não encontrado',
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
      message: 'Token renovado com sucesso',
      accessToken: newAccessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Erro ao renovar token:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Erro ao renovar token',
    });
  }
});

/**
 * POST /api/auth/logout
 * Faz logout revogando o refresh token
 */
router.post('/logout', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await TokenService.revokeRefreshToken(refreshToken);
    }

    res.status(200).json({
      message: 'Logout realizado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Erro ao processar logout',
    });
  }
});

/**
 * GET /api/auth/me
 * Retorna dados do usuário autenticado
 */
router.get('/me', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Usuário não autenticado',
      });
      return;
    }

    res.status(200).json({
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        createdAt: req.user.createdAt,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar dados do usuário:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Erro ao buscar dados do usuário',
    });
  }
});

// ========== GOOGLE OAUTH ==========

/**
 * GET /api/auth/google
 * Inicia o fluxo de autenticação do Google OAuth
 */
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false,
}));

/**
 * GET /api/auth/google/callback
 * Callback do Google OAuth
 */
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=auth_failed`);
        return;
      }

      const user = req.user as any;

      // Gera tokens
      const tokens = TokenService.generateTokenPair({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      // Salva refresh token
      await TokenService.saveRefreshToken(user.id, tokens.refreshToken);

      // Redireciona para o frontend com tokens
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(
        `${frontendUrl}/auth/callback?` +
        `accessToken=${tokens.accessToken}&` +
        `refreshToken=${tokens.refreshToken}&` +
        `userId=${encodeURIComponent(user.id)}&` +
        `userName=${encodeURIComponent(user.name)}&` +
        `userEmail=${encodeURIComponent(user.email)}&` +
        `userRole=${user.role}`
      );
    } catch (error) {
      console.error('Erro no callback do Google:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/login?error=auth_failed`);
    }
  }
);

// ========== PASSWORD RESET ==========

/**
 * POST /api/auth/request-password-reset
 * Solicita reset de senha (gera token)
 */
router.post('/request-password-reset', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = requestPasswordResetSchema.parse(req.body);

    // Busca usuário
    const user = await prisma.user.findUnique({ where: { email } });

    // Por segurança, sempre retorna sucesso (não revela se email existe)
    if (!user) {
      res.json({
        message: 'Se o email existir em nossa base, você receberá instruções para resetar sua senha'
      });
      return;
    }

    // Verifica se usuário tem senha (pode ser OAuth)
    if (!user.password) {
      res.status(400).json({
        error: 'NO_PASSWORD',
        message: 'Este usuário foi criado via Google. Use "Continuar com Google" para fazer login',
      });
      return;
    }

    // Gera token único
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    // Salva token no banco
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // TODO: Enviar email com link de reset
    // Link seria: ${FRONTEND_URL}/reset-password?token=${token}
    console.log(`🔑 Password reset token para ${email}: ${token}`);
    console.log(`Link: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`);

    res.json({
      message: 'Se o email existir em nossa base, você receberá instruções para resetar sua senha',
      // Em desenvolvimento, retornar o token (remover em produção)
      ...(process.env.NODE_ENV === 'development' && { token })
    });
  } catch (error) {
    console.error('Erro ao solicitar reset de senha:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Erro ao processar solicitação',
    });
  }
});

/**
 * POST /api/auth/reset-password
 * Reseta a senha usando o token
 */
router.post('/reset-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = resetPasswordSchema.parse(req.body);

    // Busca token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      res.status(400).json({
        error: 'INVALID_TOKEN',
        message: 'Token inválido ou expirado',
      });
      return;
    }

    // Verifica se token já foi usado
    if (resetToken.used) {
      res.status(400).json({
        error: 'TOKEN_ALREADY_USED',
        message: 'Este token já foi utilizado',
      });
      return;
    }

    // Verifica se token expirou
    if (resetToken.expiresAt < new Date()) {
      res.status(400).json({
        error: 'TOKEN_EXPIRED',
        message: 'Token expirado. Solicite um novo reset de senha',
      });
      return;
    }

    // Valida nova senha
    const passwordValidation = AuthService.validatePassword(newPassword);
    if (!passwordValidation.valid) {
      res.status(400).json({
        error: 'WEAK_PASSWORD',
        message: 'Senha não atende aos requisitos mínimos',
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

    res.json({ message: 'Senha alterada com sucesso' });
  } catch (error) {
    console.error('Erro ao resetar senha:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Erro ao resetar senha',
    });
  }
});

// ========== PROFILE MANAGEMENT ==========

/**
 * PATCH /api/auth/profile
 * Atualiza perfil do usuário (nome e/ou senha)
 */
router.patch('/profile', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, currentPassword, newPassword } = updateProfileSchema.parse(req.body);

    const updates: any = {};

    // Atualiza nome se fornecido
    if (name) {
      // Verifica se nome já existe (exceto se for o próprio usuário, apenas para usuários não-legados)
      const existingName = await prisma.user.findFirst({
        where: {
          name,
          isLegacyUser: false,
          NOT: { id: req.user!.id }
        },
      });

      if (existingName) {
        res.status(409).json({
          error: 'NAME_ALREADY_EXISTS',
          message: 'Este nome já está em uso. Por favor, escolha outro nome',
        });
        return;
      }

      updates.name = name;
    }

    // Atualiza senha se fornecida
    if (newPassword) {
      if (!currentPassword) {
        res.status(400).json({
          error: 'CURRENT_PASSWORD_REQUIRED',
          message: 'Senha atual é necessária para alterar a senha',
        });
        return;
      }

      // Busca usuário
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
      });

      if (!user || !user.password) {
        res.status(400).json({
          error: 'NO_PASSWORD',
          message: 'Usuário não possui senha (conta OAuth)',
        });
        return;
      }

      // Verifica senha atual
      const isValid = await AuthService.verifyPassword(currentPassword, user.password);

      if (!isValid) {
        res.status(401).json({
          error: 'INVALID_CURRENT_PASSWORD',
          message: 'Senha atual incorreta',
        });
        return;
      }

      // Valida nova senha
      const passwordValidation = AuthService.validatePassword(newPassword);
      if (!passwordValidation.valid) {
        res.status(400).json({
          error: 'WEAK_PASSWORD',
          message: 'Nova senha não atende aos requisitos mínimos',
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
      message: 'Perfil atualizado com sucesso',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Erro ao atualizar perfil',
    });
  }
});

export default router;
