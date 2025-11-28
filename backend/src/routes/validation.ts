import { Router } from 'express';
import { prisma } from '../index';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { Money } from '../utils/money';
import { requireAuth } from '../middleware/authMiddleware';

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

export default router;
