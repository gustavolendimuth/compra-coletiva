import { Router } from 'express';
import { prisma } from '../index';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { z } from 'zod';
import { ShippingCalculator } from '../services/shippingCalculator';

const router = Router();

const createOrderSchema = z.object({
  campaignId: z.string(),
  customerName: z.string().min(1),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().min(1)
  })).min(1)
});

const updateOrderSchema = z.object({
  customerName: z.string().min(1).optional(),
  isPaid: z.boolean().optional(),
  isSeparated: z.boolean().optional()
});

const addItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().min(1)
});

// GET /api/orders?campaignId=xxx - Lista pedidos de uma campanha
router.get('/', asyncHandler(async (req, res) => {
  const { campaignId } = req.query;

  if (!campaignId || typeof campaignId !== 'string') {
    throw new AppError(400, 'campaignId is required');
  }

  const orders = await prisma.order.findMany({
    where: { campaignId },
    include: {
      items: {
        include: {
          product: true
        }
      }
    },
    orderBy: { createdAt: 'asc' }
  });

  res.json(orders);
}));

// GET /api/orders/:id - Busca um pedido específico
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: true
        }
      }
    }
  });

  if (!order) {
    throw new AppError(404, 'Order not found');
  }

  res.json(order);
}));

// POST /api/orders - Cria um novo pedido
router.post('/', asyncHandler(async (req, res) => {
  const data = createOrderSchema.parse(req.body);

  // Busca produtos para calcular preços
  const productIds = data.items.map(item => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } }
  });

  const productMap = new Map(products.map(p => [p.id, p]));

  // Cria o pedido com itens
  const order = await prisma.order.create({
    data: {
      campaignId: data.campaignId,
      customerName: data.customerName,
      items: {
        create: data.items.map(item => {
          const product = productMap.get(item.productId);
          if (!product) {
            throw new AppError(400, `Product ${item.productId} not found`);
          }
          return {
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: product.price,
            subtotal: product.price * item.quantity
          };
        })
      }
    },
    include: {
      items: {
        include: {
          product: true
        }
      }
    }
  });

  // Recalcula subtotal e frete
  await ShippingCalculator.recalculateOrderSubtotal(order.id);

  // Busca pedido atualizado
  const updatedOrder = await prisma.order.findUnique({
    where: { id: order.id },
    include: {
      items: {
        include: {
          product: true
        }
      }
    }
  });

  res.status(201).json(updatedOrder);
}));

// PATCH /api/orders/:id - Atualiza um pedido
router.patch('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = updateOrderSchema.parse(req.body);

  const order = await prisma.order.update({
    where: { id },
    data,
    include: {
      items: {
        include: {
          product: true
        }
      }
    }
  });

  res.json(order);
}));

// POST /api/orders/:id/items - Adiciona item ao pedido
router.post('/:id/items', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = addItemSchema.parse(req.body);

  const product = await prisma.product.findUnique({
    where: { id: data.productId }
  });

  if (!product) {
    throw new AppError(404, 'Product not found');
  }

  await prisma.orderItem.create({
    data: {
      orderId: id,
      productId: data.productId,
      quantity: data.quantity,
      unitPrice: product.price,
      subtotal: product.price * data.quantity
    }
  });

  await ShippingCalculator.recalculateOrderSubtotal(id);

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: true
        }
      }
    }
  });

  res.json(order);
}));

// DELETE /api/orders/:id/items/:itemId - Remove item do pedido
router.delete('/:id/items/:itemId', asyncHandler(async (req, res) => {
  const { id, itemId } = req.params;

  await prisma.orderItem.delete({
    where: { id: itemId }
  });

  await ShippingCalculator.recalculateOrderSubtotal(id);

  res.status(204).send();
}));

// DELETE /api/orders/:id - Remove um pedido
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await prisma.order.findUnique({
    where: { id }
  });

  if (!order) {
    throw new AppError(404, 'Order not found');
  }

  await prisma.order.delete({
    where: { id }
  });

  // Redistribui frete após remoção
  await ShippingCalculator.distributeShipping(order.campaignId);

  res.status(204).send();
}));

export default router;
