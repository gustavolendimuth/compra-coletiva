import { Router, Request, Response } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { z } from "zod";
import crypto from "crypto";
import { requireAuth } from "../middleware/authMiddleware";
import { AuthService } from "../services/authService";
import { ImageUploadService } from "../services/imageUploadService";
import { uploadAvatar, handleUploadError } from "../middleware/uploadMiddleware";
import { capitalizeName } from "../utils/nameFormatter";
import { queueEmailVerificationEmail } from "../services/email/emailQueue";

const router = Router();
const prisma = new PrismaClient();

// ========== VALIDATION SCHEMAS ==========

const phoneRegex = /^(\d{2}\s?\d{4,5}-?\d{4}|\d{10,11})$/;

const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres")
    .optional(),
  phone: z
    .string()
    .min(10, "Celular deve ter pelo menos 10 dígitos")
    .max(15, "Celular deve ter no máximo 15 caracteres")
    .regex(phoneRegex, "Formato de celular inválido. Use: XX XXXXX-XXXX")
    .optional(),
  currentPassword: z.string().optional(),
  newPassword: z
    .string()
    .min(6, "Nova senha deve ter pelo menos 6 caracteres")
    .optional(),
});

const changeEmailSchema = z.object({
  newEmail: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória para confirmar"),
});

const verifyEmailSchema = z.object({
  token: z.string().min(1, "Token é obrigatório"),
});

const deleteAccountSchema = z.object({
  password: z.string().optional(),
  reason: z.string().max(500).optional(),
});

// ========== PROFILE UPDATE ==========

/**
 * PATCH /api/profile
 * Atualiza perfil do usuário (nome, telefone e/ou senha)
 */
router.patch(
  "/",
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
          phoneCompleted: updatedUser.phoneCompleted,
          avatarUrl: updatedUser.avatarUrl,
          role: updatedUser.role,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: "VALIDATION_ERROR",
          message: "Dados inválidos",
          details: error.errors,
        });
        return;
      }
      console.error("Erro ao atualizar perfil:", error);
      res.status(500).json({
        error: "INTERNAL_ERROR",
        message: "Erro ao atualizar perfil",
      });
    }
  }
);

// ========== AVATAR MANAGEMENT ==========

/**
 * POST /api/profile/avatar
 * Upload de avatar do usuário
 */
router.post(
  "/avatar",
  requireAuth,
  uploadAvatar,
  handleUploadError,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({
          error: "NO_FILE",
          message: "Nenhum arquivo enviado",
        });
        return;
      }

      // Busca avatar atual para deletar depois
      const currentUser = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { avatarKey: true, avatarStorageType: true },
      });

      // Upload do novo avatar
      const uploadResult = await ImageUploadService.uploadImage(req.file, "avatars");

      // Atualiza usuário com novo avatar
      const updatedUser = await prisma.user.update({
        where: { id: req.user!.id },
        data: {
          avatarUrl: uploadResult.imageUrl,
          avatarKey: uploadResult.imageKey,
          avatarStorageType: uploadResult.storageType,
        },
      });

      // Deleta avatar antigo se existia
      if (currentUser?.avatarKey && currentUser?.avatarStorageType) {
        await ImageUploadService.deleteImage(
          currentUser.avatarKey,
          currentUser.avatarStorageType
        );
      }

      res.json({
        message: "Avatar atualizado com sucesso",
        avatarUrl: updatedUser.avatarUrl,
      });
    } catch (error) {
      console.error("Erro ao atualizar avatar:", error);
      res.status(500).json({
        error: "INTERNAL_ERROR",
        message: "Erro ao atualizar avatar",
      });
    }
  }
);

/**
 * DELETE /api/profile/avatar
 * Remove avatar do usuário
 */
router.delete(
  "/avatar",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { avatarKey: true, avatarStorageType: true },
      });

      if (!user?.avatarKey) {
        res.status(400).json({
          error: "NO_AVATAR",
          message: "Usuário não possui avatar",
        });
        return;
      }

      // Deleta arquivo
      if (user.avatarStorageType) {
        await ImageUploadService.deleteImage(user.avatarKey, user.avatarStorageType);
      }

      // Remove referência do banco
      await prisma.user.update({
        where: { id: req.user!.id },
        data: {
          avatarUrl: null,
          avatarKey: null,
          avatarStorageType: null,
        },
      });

      res.json({
        message: "Avatar removido com sucesso",
      });
    } catch (error) {
      console.error("Erro ao remover avatar:", error);
      res.status(500).json({
        error: "INTERNAL_ERROR",
        message: "Erro ao remover avatar",
      });
    }
  }
);

// ========== EMAIL CHANGE ==========

/**
 * POST /api/profile/change-email
 * Solicita troca de email (envia verificação para novo email)
 */
router.post(
  "/change-email",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { newEmail, password } = changeEmailSchema.parse(req.body);

      // Busca usuário
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
      });

      if (!user) {
        res.status(404).json({
          error: "USER_NOT_FOUND",
          message: "Usuário não encontrado",
        });
        return;
      }

      // Verifica se o novo email é diferente
      if (user.email === newEmail) {
        res.status(400).json({
          error: "SAME_EMAIL",
          message: "O novo email é igual ao atual",
        });
        return;
      }

      // Verifica se o email já está em uso
      const existingUser = await prisma.user.findUnique({
        where: { email: newEmail },
      });

      if (existingUser) {
        res.status(400).json({
          error: "EMAIL_IN_USE",
          message: "Este email já está em uso",
        });
        return;
      }

      // Verifica senha (obrigatório para usuários com senha)
      if (user.password) {
        const isValid = await AuthService.verifyPassword(password, user.password);
        if (!isValid) {
          res.status(401).json({
            error: "INVALID_PASSWORD",
            message: "Senha incorreta",
          });
          return;
        }
      }

      // Gera token de verificação
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

      // Salva token no banco
      await prisma.user.update({
        where: { id: user.id },
        data: {
          pendingEmail: newEmail,
          pendingEmailToken: token,
          pendingEmailExpires: expiresAt,
        },
      });

      // Envia email de verificação
      try {
        await queueEmailVerificationEmail(user.id, newEmail, token);
      } catch (emailError) {
        console.error("Erro ao enviar email de verificação:", emailError);
        // Não falha a requisição, apenas loga o erro
      }

      res.json({
        message: "Email de verificação enviado para o novo endereço",
        expiresAt,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: "VALIDATION_ERROR",
          message: "Dados inválidos",
          details: error.errors,
        });
        return;
      }
      console.error("Erro ao solicitar troca de email:", error);
      res.status(500).json({
        error: "INTERNAL_ERROR",
        message: "Erro ao processar solicitação",
      });
    }
  }
);

/**
 * POST /api/profile/verify-email
 * Confirma troca de email com token
 */
router.post(
  "/verify-email",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { token } = verifyEmailSchema.parse(req.body);

      // Busca usuário pelo token
      const user = await prisma.user.findFirst({
        where: {
          pendingEmailToken: token,
          pendingEmailExpires: {
            gt: new Date(),
          },
        },
      });

      if (!user || !user.pendingEmail) {
        res.status(400).json({
          error: "INVALID_TOKEN",
          message: "Token inválido ou expirado",
        });
        return;
      }

      // Verifica novamente se o email não foi usado
      const existingUser = await prisma.user.findUnique({
        where: { email: user.pendingEmail },
      });

      if (existingUser) {
        res.status(400).json({
          error: "EMAIL_IN_USE",
          message: "Este email já está em uso",
        });
        return;
      }

      // Atualiza email
      await prisma.user.update({
        where: { id: user.id },
        data: {
          email: user.pendingEmail,
          pendingEmail: null,
          pendingEmailToken: null,
          pendingEmailExpires: null,
        },
      });

      res.json({
        message: "Email atualizado com sucesso",
        newEmail: user.pendingEmail,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: "VALIDATION_ERROR",
          message: "Dados inválidos",
          details: error.errors,
        });
        return;
      }
      console.error("Erro ao verificar email:", error);
      res.status(500).json({
        error: "INTERNAL_ERROR",
        message: "Erro ao processar verificação",
      });
    }
  }
);

// ========== ACCOUNT DELETION ==========

/**
 * DELETE /api/profile
 * Soft delete da conta (anonimiza dados)
 */
router.delete(
  "/",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { password, reason } = deleteAccountSchema.parse(req.body);

      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
      });

      if (!user) {
        res.status(404).json({
          error: "USER_NOT_FOUND",
          message: "Usuário não encontrado",
        });
        return;
      }

      // Verifica senha (obrigatório para usuários com senha)
      if (user.password) {
        if (!password) {
          res.status(400).json({
            error: "PASSWORD_REQUIRED",
            message: "Senha é obrigatória para excluir a conta",
          });
          return;
        }

        const isValid = await AuthService.verifyPassword(password, user.password);
        if (!isValid) {
          res.status(401).json({
            error: "INVALID_PASSWORD",
            message: "Senha incorreta",
          });
          return;
        }
      }

      // Gera email anônimo único
      const anonymousEmail = `deleted_${user.id}@deleted.local`;

      // Anonimiza e marca como deletado
      await prisma.user.update({
        where: { id: user.id },
        data: {
          name: "Usuário Excluído",
          email: anonymousEmail,
          password: null,
          phone: null,
          googleId: null,
          avatarUrl: null,
          avatarKey: null,
          avatarStorageType: null,
          deletedAt: new Date(),
          deletedReason: reason,
          // Limpa dados de verificação pendente
          pendingEmail: null,
          pendingEmailToken: null,
          pendingEmailExpires: null,
        },
      });

      // Deleta avatar se existir
      if (user.avatarKey && user.avatarStorageType) {
        await ImageUploadService.deleteImage(user.avatarKey, user.avatarStorageType);
      }

      // Invalida todas as sessões
      await prisma.session.deleteMany({
        where: { userId: user.id },
      });

      // Deleta tokens de reset de senha
      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id },
      });

      res.json({
        message: "Conta excluída com sucesso",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: "VALIDATION_ERROR",
          message: "Dados inválidos",
          details: error.errors,
        });
        return;
      }
      console.error("Erro ao excluir conta:", error);
      res.status(500).json({
        error: "INTERNAL_ERROR",
        message: "Erro ao excluir conta",
      });
    }
  }
);

// ========== DATA EXPORT (LGPD) ==========

/**
 * GET /api/profile/export
 * Exporta dados do usuário (LGPD compliance)
 */
router.get(
  "/export",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        include: {
          orders: {
            include: {
              items: {
                include: {
                  product: true,
                },
              },
              messages: true,
            },
          },
          campaigns: {
            select: {
              id: true,
              name: true,
              slug: true,
              status: true,
              createdAt: true,
            },
          },
          notifications: {
            select: {
              id: true,
              type: true,
              title: true,
              message: true,
              read: true,
              createdAt: true,
            },
          },
          feedback: {
            select: {
              id: true,
              type: true,
              title: true,
              description: true,
              status: true,
              createdAt: true,
            },
          },
          emailPreference: true,
          sentCampaignMessages: {
            select: {
              id: true,
              question: true,
              answer: true,
              createdAt: true,
            },
          },
        },
      });

      if (!user) {
        res.status(404).json({
          error: "USER_NOT_FOUND",
          message: "Usuário não encontrado",
        });
        return;
      }

      // Remove campos sensíveis
      const { password, pendingEmailToken, ...userData } = user;

      res.json({
        exportedAt: new Date().toISOString(),
        userData,
      });
    } catch (error) {
      console.error("Erro ao exportar dados:", error);
      res.status(500).json({
        error: "INTERNAL_ERROR",
        message: "Erro ao exportar dados",
      });
    }
  }
);

export default router;
