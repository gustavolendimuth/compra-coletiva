import { Router } from 'express';
import { prisma } from '../index';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { generatePublicAlias } from '../utils/publicAlias';

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
    customerAlias: string;
    total: number;
    isPaid: boolean;
  }>;
}

// GET /api/analytics/campaign/:campaignId - Analytics de uma campanha
router.get('/campaign/:campaignId', asyncHandler(async (req, res) => {
  const { campaignId } = req.params;
  const requestId = Math.random().toString(36).slice(2, 8);
  const totalStart = Date.now();

  const fetchStart = Date.now();
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
  const fetchMs = Date.now() - fetchStart;

  if (!campaign) {
    const totalMs = Date.now() - totalStart;
    console.log(
      `[Perf] GET /api/analytics/campaign/${campaignId} not_found fetchMs=${fetchMs} totalMs=${totalMs} req=${requestId}`
    );
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
  let itemsCount = 0;
  const computeStart = Date.now();

  for (const order of campaign.orders) {
    analytics.totalWithoutShipping += order.subtotal;
    analytics.totalWithShipping += order.total;

    if (order.isPaid) {
      analytics.totalPaid += order.total;
    } else {
      analytics.totalUnpaid += order.total;
    }

    // Agrega por cliente
    const customerAlias = generatePublicAlias(order.userId, campaignId);

    if (!customerMap.has(customerAlias)) {
      customerMap.set(customerAlias, {
        total: 0,
        isPaid: order.isPaid
      });
    }
    const customerData = customerMap.get(customerAlias)!;
    customerData.total += order.total;

    // Agrega por produto
    for (const item of order.items) {
      analytics.totalQuantity += item.quantity;
      itemsCount += 1;

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

  analytics.byCustomer = Array.from(customerMap.entries()).map(([customerAlias, data]) => ({
    customerAlias,
    total: data.total,
    isPaid: data.isPaid
  }));

  const computeMs = Date.now() - computeStart;
  const totalMs = Date.now() - totalStart;
  console.log(
    `[Perf] GET /api/analytics/campaign/${campaignId} orders=${campaign.orders.length} items=${itemsCount} products=${analytics.byProduct.length} customers=${analytics.byCustomer.length} fetchMs=${fetchMs} computeMs=${computeMs} totalMs=${totalMs} req=${requestId}`
  );

  res.json(analytics);
}));

export default router;
