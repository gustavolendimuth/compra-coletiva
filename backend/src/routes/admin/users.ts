/**
 * Admin Users Routes
 * Rotas para gestão de usuários pelo admin
 */

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../index';
import { asyncHandler, AppError } from '../../middleware/errorHandler';
import { requireAuth } from '../../middleware/authMiddleware';
import { adminAuth } from '../../middleware/adminMiddleware';
import { AuditAction, AuditTargetType } from '@prisma/client';

const router = Router();

// Validation schemas
const listUsersSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  role: z.enum(['ADMIN', 'CAMPAIGN_CREATOR', 'CUSTOMER']).optional(),
  isBanned: z.coerce.boolean().optional(),
});

const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  role: z.enum(['ADMIN', 'CAMPAIGN_CREATOR', 'CUSTOMER']).optional(),
});

const banUserSchema = z.object({
  reason: z.string().optional(),
});

// GET /api/admin/users - Listar usuários
router.get(
  '/',
  requireAuth,
  ...adminAuth(AuditAction.USER_LIST, AuditTargetType.USER),
  asyncHandler(async (req, res) => {
    const { page, limit, search, role, isBanned } = listUsersSchema.parse(req.query);

    const where: any = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (isBanned !== undefined) {
      where.isBanned = isBanned;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isBanned: true,
          isLegacyUser: true,
          createdAt: true,
          spamScore: true,
          messageCount: true,
          answeredCount: true,
          _count: {
            select: {
              campaigns: true,
              orders: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  })
);

// GET /api/admin/users/:id - Detalhes do usuário
router.get(
  '/:id',
  requireAuth,
  ...adminAuth(AuditAction.USER_VIEW, AuditTargetType.USER),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        campaigns: {
          select: {
            id: true,
            name: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        orders: {
          select: {
            id: true,
            total: true,
            isPaid: true,
            createdAt: true,
            campaign: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            campaigns: true,
            orders: true,
            sentCampaignMessages: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError(404, 'Usuário não encontrado');
    }

    res.json(user);
  })
);

// PATCH /api/admin/users/:id - Editar usuário
router.patch(
  '/:id',
  requireAuth,
  ...adminAuth(AuditAction.USER_EDIT, AuditTargetType.USER),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = updateUserSchema.parse(req.body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new AppError(404, 'Usuário não encontrado');
    }

    // Prevent admin from removing their own admin role
    if (id === req.user!.id && data.role && data.role !== 'ADMIN') {
      throw new AppError(400, 'Você não pode remover sua própria permissão de admin');
    }

    // Check if email is already in use
    if (data.email && data.email !== existingUser.email) {
      const emailExists = await prisma.user.findFirst({
        where: {
          email: data.email,
          id: { not: id },
        },
      });

      if (emailExists) {
        throw new AppError(400, 'Este email já está em uso');
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isBanned: true,
        createdAt: true,
      },
    });

    res.json(updatedUser);
  })
);

// POST /api/admin/users/:id/ban - Banir usuário
router.post(
  '/:id/ban',
  requireAuth,
  ...adminAuth(AuditAction.USER_BAN, AuditTargetType.USER),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = banUserSchema.parse(req.body);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new AppError(404, 'Usuário não encontrado');
    }

    // Prevent admin from banning themselves
    if (id === req.user!.id) {
      throw new AppError(400, 'Você não pode banir a si mesmo');
    }

    // Prevent banning other admins
    if (user.role === 'ADMIN') {
      throw new AppError(400, 'Você não pode banir outro administrador');
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isBanned: true },
      select: {
        id: true,
        name: true,
        email: true,
        isBanned: true,
      },
    });

    res.json({
      message: 'Usuário banido com sucesso',
      user: updatedUser,
    });
  })
);

// POST /api/admin/users/:id/unban - Desbanir usuário
router.post(
  '/:id/unban',
  requireAuth,
  ...adminAuth(AuditAction.USER_UNBAN, AuditTargetType.USER),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new AppError(404, 'Usuário não encontrado');
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isBanned: false },
      select: {
        id: true,
        name: true,
        email: true,
        isBanned: true,
      },
    });

    res.json({
      message: 'Usuário desbanido com sucesso',
      user: updatedUser,
    });
  })
);

// DELETE /api/admin/users/:id - Deletar usuário (soft delete)
router.delete(
  '/:id',
  requireAuth,
  ...adminAuth(AuditAction.USER_DELETE, AuditTargetType.USER),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new AppError(404, 'Usuário não encontrado');
    }

    // Prevent admin from deleting themselves
    if (id === req.user!.id) {
      throw new AppError(400, 'Você não pode deletar sua própria conta como admin');
    }

    // Prevent deleting other admins
    if (user.role === 'ADMIN') {
      throw new AppError(400, 'Você não pode deletar outro administrador');
    }

    // Soft delete with anonymization
    const randomEmail = `deleted_${Date.now()}_${Math.random().toString(36).substring(7)}@deleted.local`;

    await prisma.user.update({
      where: { id },
      data: {
        name: 'Usuário Excluído',
        email: randomEmail,
        deletedAt: new Date(),
        deletedReason: 'Deletado por administrador',
        isBanned: true,
      },
    });

    res.json({
      message: 'Usuário deletado com sucesso',
    });
  })
);

export default router;
