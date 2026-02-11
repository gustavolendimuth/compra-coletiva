/**
 * Admin Dashboard Routes
 * Rotas para estatísticas e dashboard do admin
 */

import { Router } from 'express';
import { prisma } from '../../index';
import { asyncHandler } from '../../middleware/errorHandler';
import { requireAuth } from '../../middleware/authMiddleware';
import { adminAuth } from '../../middleware/adminMiddleware';
import { AuditAction, AuditTargetType } from '@prisma/client';

const router = Router();

// GET /api/admin/dashboard/stats - Estatísticas gerais
router.get(
  '/stats',
  requireAuth,
  ...adminAuth(AuditAction.SYSTEM_VIEW, AuditTargetType.SYSTEM),
  asyncHandler(async (req, res) => {
    const [
      totalUsers,
      totalCampaigns,
      totalOrders,
      totalRevenue,
      activeCampaigns,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.campaign.count(),
      prisma.order.count(),
      prisma.order.aggregate({
        where: { isPaid: true },
        _sum: { total: true },
      }),
      prisma.campaign.count({
        where: { status: 'ACTIVE' },
      }),
      prisma.user.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      }),
    ]);

    res.json({
      stats: {
        users: {
          total: totalUsers,
        },
        campaigns: {
          total: totalCampaigns,
          active: activeCampaigns,
        },
        orders: {
          total: totalOrders,
        },
        revenue: {
          total: totalRevenue._sum.total || 0,
        },
      },
      recentUsers,
    });
  })
);

// GET /api/admin/dashboard/activity - Atividade recente
router.get(
  '/activity',
  requireAuth,
  ...adminAuth(AuditAction.SYSTEM_VIEW, AuditTargetType.SYSTEM),
  asyncHandler(async (req, res) => {
    const [recentCampaigns, recentOrders] = await Promise.all([
      prisma.campaign.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          name: true,
          status: true,
          createdAt: true,
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          total: true,
          isPaid: true,
          createdAt: true,
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          campaign: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
    ]);

    res.json({
      recentCampaigns,
      recentOrders,
    });
  })
);

export default router;
