import { Router } from 'express';
import { prisma } from '../index';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { Money } from '../utils/money';
import { requireAuth } from '../middleware/authMiddleware';
import { OrderCleanupService } from '../services/orderCleanupService';
import { z } from 'zod';

const router = Router();

interface ValidationResult {
  campaignId: string;
  campaignName: string;
  passed: boolean;
  checks: {
    shippingDistribution: { passed: boolean; expected: number; actual: number };
    totalCalculation: { passed: boolean; expected: number; actual: number };
    paidUnpaidSum: { passed: boolean; expected: number; actual: number };
  };
}

router.get('/campaign/:campaignId', requireAuth, asyncHandler(async (req, res) => {
  const { campaignId } = req.params;

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { orders: true }
  });

  if (!campaign) {
    throw new AppError(404, 'Campaign not found');
  }

  const sumSubtotals = Money.sum(campaign.orders.map(o => o.subtotal));
  const sumShippingFees = Money.sum(campaign.orders.map(o => o.shippingFee));
  const sumTotals = Money.sum(campaign.orders.map(o => o.total));
  const sumPaid = Money.sum(campaign.orders.filter(o => o.isPaid).map(o => o.total));
  const sumUnpaid = Money.sum(campaign.orders.filter(o => !o.isPaid).map(o => o.total));

  const expectedTotal = Money.add(sumSubtotals, campaign.shippingCost);

  const result: ValidationResult = {
    campaignId: campaign.id,
    campaignName: campaign.name,
    passed: false,
    checks: {
      shippingDistribution: {
        passed: Money.equals(sumShippingFees, campaign.shippingCost),
        expected: campaign.shippingCost,
        actual: sumShippingFees
      },
      totalCalculation: {
        passed: Money.equals(sumTotals, expectedTotal),
        expected: expectedTotal,
        actual: sumTotals
      },
      paidUnpaidSum: {
        passed: Money.equals(sumTotals, Money.add(sumPaid, sumUnpaid)),
        expected: sumTotals,
        actual: Money.add(sumPaid, sumUnpaid)
      }
    }
  };

  result.passed =
    result.checks.shippingDistribution.passed &&
    result.checks.totalCalculation.passed &&
    result.checks.paidUnpaidSum.passed;

  res.json(result);
}));

// GET /api/validation/empty-orders - Get statistics about empty orders
router.get('/empty-orders', requireAuth, asyncHandler(async (req, res) => {
  // Only allow campaign creators and admins to view stats
  if (req.user?.role !== 'ADMIN') {
    // Check if user is creator of any campaign
    const userCampaigns = await prisma.campaign.count({
      where: { creatorId: req.user!.id }
    });

    if (userCampaigns === 0) {
      throw new AppError(403, 'Only campaign creators and admins can view empty order statistics');
    }
  }

  const stats = await OrderCleanupService.getEmptyOrdersStats();
  res.json(stats);
}));

const cleanupSchema = z.object({
  ageInHours: z.number().min(1).max(168).optional().default(24) // Max 1 week
});

// DELETE /api/validation/empty-orders - Clean up empty orders
router.delete('/empty-orders', requireAuth, asyncHandler(async (req, res) => {
  // Only allow admins to run cleanup
  if (req.user?.role !== 'ADMIN') {
    throw new AppError(403, 'Only admins can run order cleanup');
  }

  const { ageInHours } = cleanupSchema.parse(req.body);
  const deletedCount = await OrderCleanupService.cleanupEmptyOrders(ageInHours);

  res.json({
    success: true,
    deletedCount,
    ageInHours,
  });
}));

export default router;
