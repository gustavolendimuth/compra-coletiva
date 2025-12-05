import { Router, Request, Response } from 'express';
import { PrismaClient, FeedbackType, FeedbackStatus } from '@prisma/client';
import { z } from 'zod';
import { requireAuth, requireRole, optionalAuth } from '../middleware/authMiddleware';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createFeedbackSchema = z.object({
  type: z.enum(['BUG', 'SUGGESTION', 'IMPROVEMENT', 'OTHER']),
  title: z.string().min(5, 'Título deve ter no mínimo 5 caracteres').max(200),
  description: z.string().min(10, 'Descrição deve ter no mínimo 10 caracteres').max(5000),
  email: z.string().email('Email inválido').optional(),
});

const updateFeedbackStatusSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED']),
  adminNotes: z.string().max(2000).optional(),
});

/**
 * POST /api/feedback
 * Cria novo feedback (autenticado ou anônimo)
 */
router.post(
  '/',
  optionalAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const data = createFeedbackSchema.parse(req.body);

    // Se não estiver autenticado, email é obrigatório
    if (!req.user && !data.email) {
      return res.status(400).json({
        error: 'EMAIL_REQUIRED',
        message: 'Email é obrigatório para feedback anônimo',
      });
    }

    const feedback = await prisma.feedback.create({
      data: {
        type: data.type as FeedbackType,
        title: data.title,
        description: data.description,
        email: data.email,
        userId: req.user?.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json(feedback);
  })
);

/**
 * GET /api/feedback
 * Lista todos os feedbacks (apenas ADMIN)
 */
router.get(
  '/',
  requireAuth,
  requireRole('ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const { type, status, limit = '50', offset = '0' } = req.query;

    const where: any = {};
    if (type) where.type = type;
    if (status) where.status = status;

    const [feedbacks, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
      }),
      prisma.feedback.count({ where }),
    ]);

    res.json({
      feedbacks,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
  })
);

/**
 * GET /api/feedback/my
 * Lista feedbacks do usuário autenticado
 */
router.get(
  '/my',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const feedbacks = await prisma.feedback.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });

    res.json(feedbacks);
  })
);

/**
 * GET /api/feedback/stats
 * Estatísticas de feedback (apenas ADMIN)
 */
router.get(
  '/stats',
  requireAuth,
  requireRole('ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const [byType, byStatus, recentCount] = await Promise.all([
      prisma.feedback.groupBy({
        by: ['type'],
        _count: true,
      }),
      prisma.feedback.groupBy({
        by: ['status'],
        _count: true,
      }),
      prisma.feedback.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Últimos 7 dias
          },
        },
      }),
    ]);

    res.json({
      byType,
      byStatus,
      recentCount,
    });
  })
);

/**
 * PATCH /api/feedback/:id
 * Atualiza status do feedback (apenas ADMIN)
 */
router.patch(
  '/:id',
  requireAuth,
  requireRole('ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = updateFeedbackStatusSchema.parse(req.body);

    const feedback = await prisma.feedback.findUnique({
      where: { id },
    });

    if (!feedback) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Feedback não encontrado',
      });
    }

    const updated = await prisma.feedback.update({
      where: { id },
      data: {
        status: data.status as FeedbackStatus,
        adminNotes: data.adminNotes,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json(updated);
  })
);

/**
 * DELETE /api/feedback/:id
 * Deleta feedback (apenas ADMIN)
 */
router.delete(
  '/:id',
  requireAuth,
  requireRole('ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const feedback = await prisma.feedback.findUnique({
      where: { id },
    });

    if (!feedback) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Feedback não encontrado',
      });
    }

    await prisma.feedback.delete({
      where: { id },
    });

    res.status(204).send();
  })
);

export default router;
