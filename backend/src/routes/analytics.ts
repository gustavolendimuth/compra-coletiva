import { Router } from 'express';
import { prisma } from '../index';
import { asyncHandler, AppError } from '../middleware/errorHandler';

const router = Router();

interface Analytics {
  totalQuantity: number;
  totalWithoutShipping: number;
  totalWithShipping: number;
  totalPaid: number;
  totalUnpaid: number;
  byProduct: Array<{
    productId: string;
    productName: string;
    quantity: number;
  }>;
  byCustomer: Array<{
    customerName: string;
    total: number;
    isPaid: boolean;
  }>;
}

// GET /api/analytics/campaign/:campaignId - Analytics de uma campanha
router.get('/campaign/:campaignId', asyncHandler(async (req, res) => {
  const { campaignId } = req.params;

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      orders: {
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      }
    }
  });

  if (!campaign) {
    throw new AppError(404, 'Campaign not found');
  }

  const analytics: Analytics = {
    totalQuantity: 0,
    totalWithoutShipping: 0,
    totalWithShipping: 0,
    totalPaid: 0,
    totalUnpaid: 0,
    byProduct: [],
    byCustomer: []
  };

  const productMap = new Map<string, { name: string; quantity: number }>();
  const customerMap = new Map<string, { total: number; isPaid: boolean }>();

  for (const order of campaign.orders) {
    analytics.totalWithoutShipping += order.subtotal;
    analytics.totalWithShipping += order.total;

    if (order.isPaid) {
      analytics.totalPaid += order.total;
    } else {
      analytics.totalUnpaid += order.total;
    }

    // Agrega por cliente
    if (!customerMap.has(order.customerName)) {
      customerMap.set(order.customerName, {
        total: 0,
        isPaid: order.isPaid
      });
    }
    const customerData = customerMap.get(order.customerName)!;
    customerData.total += order.total;

    // Agrega por produto
    for (const item of order.items) {
      analytics.totalQuantity += item.quantity;

      if (!productMap.has(item.productId)) {
        productMap.set(item.productId, {
          name: item.product.name,
          quantity: 0
        });
      }
      const productData = productMap.get(item.productId)!;
      productData.quantity += item.quantity;
    }
  }

  // Converte maps para arrays
  analytics.byProduct = Array.from(productMap.entries()).map(([productId, data]) => ({
    productId,
    productName: data.name,
    quantity: data.quantity
  }));

  analytics.byCustomer = Array.from(customerMap.entries()).map(([customerName, data]) => ({
    customerName,
    total: data.total,
    isPaid: data.isPaid
  }));

  res.json(analytics);
}));

export default router;
