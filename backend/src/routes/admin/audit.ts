/**
 * Admin Audit Routes
 * Rotas para visualização de logs de auditoria
 */

import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, AppError } from '../../middleware/errorHandler';
import { requireAuth } from '../../middleware/authMiddleware';
import { adminAuth } from '../../middleware/adminMiddleware';
import { AuditAction, AuditTargetType } from '@prisma/client';
import { AuditService } from '../../services/auditService';

const router = Router();

// Validation schemas
const listAuditLogsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  adminId: z.string().optional(),
  action: z.nativeEnum(AuditAction).optional(),
  targetType: z.nativeEnum(AuditTargetType).optional(),
  targetId: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

// GET /api/admin/audit - Listar logs de auditoria
router.get(
  '/',
  requireAuth,
  ...adminAuth(AuditAction.AUDIT_VIEW, AuditTargetType.SYSTEM),
  asyncHandler(async (req, res) => {
    const filters = listAuditLogsSchema.parse(req.query);

    const result = await AuditService.search(filters);

    res.json(result);
  })
);

// GET /api/admin/audit/:id - Detalhes do log
router.get(
  '/:id',
  requireAuth,
  ...adminAuth(AuditAction.AUDIT_VIEW, AuditTargetType.SYSTEM),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const log = await AuditService.findById(id);

    if (!log) {
      throw new AppError(404, 'Log não encontrado');
    }

    res.json(log);
  })
);

// GET /api/admin/audit/stats - Estatísticas de auditoria
router.get(
  '/stats/summary',
  requireAuth,
  ...adminAuth(AuditAction.AUDIT_VIEW, AuditTargetType.SYSTEM),
  asyncHandler(async (req, res) => {
    const { startDate, endDate } = z
      .object({
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
      })
      .parse(req.query);

    const stats = await AuditService.getStats(startDate, endDate);

    res.json(stats);
  })
);

// GET /api/admin/audit/admin/:adminId - Logs de um admin específico
router.get(
  '/admin/:adminId',
  requireAuth,
  ...adminAuth(AuditAction.AUDIT_VIEW, AuditTargetType.SYSTEM),
  asyncHandler(async (req, res) => {
    const { adminId } = req.params;
    const { limit } = z
      .object({
        limit: z.coerce.number().int().positive().max(100).default(50),
      })
      .parse(req.query);

    const logs = await AuditService.findByAdmin(adminId, limit);

    res.json(logs);
  })
);

// GET /api/admin/audit/target/:targetType/:targetId - Logs de um target específico
router.get(
  '/target/:targetType/:targetId',
  requireAuth,
  ...adminAuth(AuditAction.AUDIT_VIEW, AuditTargetType.SYSTEM),
  asyncHandler(async (req, res) => {
    const { targetType, targetId } = req.params;
    const { limit } = z
      .object({
        limit: z.coerce.number().int().positive().max(100).default(50),
      })
      .parse(req.query);

    const logs = await AuditService.findByTarget(
      targetType as AuditTargetType,
      targetId,
      limit
    );

    res.json(logs);
  })
);

export default router;
