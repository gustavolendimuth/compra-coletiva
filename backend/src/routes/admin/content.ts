/**
 * Admin Content Moderation Routes
 * Rotas para moderação de conteúdo (campanhas e mensagens)
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
const listCampaignsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(['ACTIVE', 'CLOSED', 'SENT', 'ARCHIVED']).optional(),
  search: z.string().optional(),
});

const listMessagesSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  minSpamScore: z.coerce.number().min(0).max(100).optional(),
});

const updateCampaignSchema = z.object({
  status: z.enum(['ACTIVE', 'CLOSED', 'SENT', 'ARCHIVED']).optional(),
});

// GET /api/admin/content/campaigns - Listar campanhas
router.get(
  '/campaigns',
  requireAuth,
  ...adminAuth(AuditAction.CAMPAIGN_LIST, AuditTargetType.CAMPAIGN),
  asyncHandler(async (req, res) => {
    const { page, limit, status, search } = listCampaignsSchema.parse(req.query);

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              products: true,
              orders: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.campaign.count({ where }),
    ]);

    res.json({
      campaigns,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  })
);

// GET /api/admin/content/campaigns/:id - Detalhes da campanha
router.get(
  '/campaigns/:id',
  requireAuth,
  ...adminAuth(AuditAction.CAMPAIGN_VIEW, AuditTargetType.CAMPAIGN),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        products: true,
        orders: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            products: true,
            orders: true,
            messages: true,
          },
        },
      },
    });

    if (!campaign) {
      throw new AppError(404, 'Campanha não encontrada');
    }

    res.json(campaign);
  })
);

// PATCH /api/admin/content/campaigns/:id - Arquivar/restaurar campanha
router.patch(
  '/campaigns/:id',
  requireAuth,
  ...adminAuth(AuditAction.CAMPAIGN_EDIT, AuditTargetType.CAMPAIGN),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = updateCampaignSchema.parse(req.body);

    const campaign = await prisma.campaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      throw new AppError(404, 'Campanha não encontrada');
    }

    const updatedCampaign = await prisma.campaign.update({
      where: { id },
      data: { status },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json({
      message: 'Campanha atualizada com sucesso',
      campaign: updatedCampaign,
    });
  })
);

// DELETE /api/admin/content/campaigns/:id - Deletar campanha
router.delete(
  '/campaigns/:id',
  requireAuth,
  ...adminAuth(AuditAction.CAMPAIGN_DELETE, AuditTargetType.CAMPAIGN),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    if (!campaign) {
      throw new AppError(404, 'Campanha não encontrada');
    }

    // Check if campaign has orders
    if (campaign._count.orders > 0) {
      throw new AppError(
        400,
        'Não é possível deletar uma campanha com pedidos. Arquive-a em vez disso.'
      );
    }

    await prisma.campaign.delete({
      where: { id },
    });

    res.json({
      message: 'Campanha deletada com sucesso',
    });
  })
);

// GET /api/admin/content/messages - Listar mensagens (com spam)
router.get(
  '/messages',
  requireAuth,
  ...adminAuth(AuditAction.MESSAGE_LIST, AuditTargetType.MESSAGE),
  asyncHandler(async (req, res) => {
    const { page, limit, minSpamScore = 50 } = listMessagesSchema.parse(req.query);

    const where: any = {
      spamScore: {
        gte: minSpamScore,
      },
    };

    const [messages, total] = await Promise.all([
      prisma.campaignMessage.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              spamScore: true,
            },
          },
          campaign: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { spamScore: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.campaignMessage.count({ where }),
    ]);

    res.json({
      messages,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  })
);

// DELETE /api/admin/content/messages/:id - Deletar mensagem
router.delete(
  '/messages/:id',
  requireAuth,
  ...adminAuth(AuditAction.MESSAGE_DELETE, AuditTargetType.MESSAGE),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const message = await prisma.campaignMessage.findUnique({
      where: { id },
    });

    if (!message) {
      throw new AppError(404, 'Mensagem não encontrada');
    }

    await prisma.campaignMessage.delete({
      where: { id },
    });

    res.json({
      message: 'Mensagem deletada com sucesso',
    });
  })
);

export default router;
