import { Router } from 'express';
import { prisma } from '../index';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { requireAuth, requireOrderOwnership, optionalAuth } from '../middleware/authMiddleware';
import { z } from 'zod';
import { ShippingCalculator } from '../services/shippingCalculator';
import { emitOrderCreated, emitOrderUpdated, emitOrderDeleted, emitOrderStatusChanged } from '../services/socketService';

const router = Router();

const createOrderSchema = z.object({
  campaignId: z.string(),
  customerName: z.string().min(1).optional(), // Opcional, usa user.name se não fornecido
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

const updateOrderWithItemsSchema = z.object({
  customerName: z.string().min(1).optional(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().min(1)
  })).min(1).optional()
});

const addItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().min(1)
});

// GET /api/orders?campaignId=xxx - Lista pedidos de um grupo
// Opcional auth: Se autenticado e não for admin/criador, mostra apenas seus pedidos
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const { campaignId } = req.query;

  if (!campaignId || typeof campaignId !== 'string') {
    throw new AppError(400, 'campaignId is required');
  }

  // Se usuário autenticado, verifica permissões
  let whereClause: any = { campaignId };

  if (req.user) {
    // Admin e criador da campanha veem todos os pedidos
    if (req.user.role !== 'ADMIN') {
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        select: { creatorId: true },
      });

      // Se não for criador da campanha, mostra apenas seus próprios pedidos
      if (campaign?.creatorId !== req.user.id) {
        whereClause.userId = req.user.id;
      }
    }
  }

  const orders = await prisma.order.findMany({
    where: whereClause,
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
router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const data = createOrderSchema.parse(req.body);

  // Verifica se o grupo está ativo
  const campaign = await prisma.campaign.findUnique({
    where: { id: data.campaignId }
  });

  if (!campaign) {
    throw new AppError(404, 'Campaign not found');
  }

  if (campaign.status !== 'ACTIVE') {
    throw new AppError(400, 'Cannot create orders in a closed or sent group');
  }

  // Busca produtos para calcular preços
  const productIds = data.items.map(item => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } }
  });

  type ProductType = typeof products[number];
  const productMap = new Map<string, ProductType>(products.map(p => [p.id, p]));

  // Usa nome fornecido ou nome do usuário
  const customerName = data.customerName || req.user!.name;

  // Cria o pedido com itens
  const order = await prisma.order.create({
    data: {
      campaignId: data.campaignId,
      customerName,
      userId: req.user!.id, // Adiciona userId do usuário autenticado
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

  // Emite evento de criação
  emitOrderCreated(data.campaignId, updatedOrder);

  res.status(201).json(updatedOrder);
}));

// PATCH /api/orders/:id - Atualiza um pedido (apenas campos simples)
router.patch('/:id', requireAuth, requireOrderOwnership, asyncHandler(async (req, res) => {
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
      },
      campaign: true
    }
  });

  // Se mudou status de pagamento ou separação, emite evento específico
  if (data.isPaid !== undefined || data.isSeparated !== undefined) {
    emitOrderStatusChanged(order.campaignId, {
      orderId: order.id,
      isPaid: order.isPaid,
      isSeparated: order.isSeparated,
      customerName: order.customerName
    });
  } else {
    // Caso contrário, emite atualização geral
    emitOrderUpdated(order.campaignId, order);
  }

  res.json(order);
}));

// PUT /api/orders/:id - Atualiza um pedido completo (com itens)
router.put('/:id', requireAuth, requireOrderOwnership, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = updateOrderWithItemsSchema.parse(req.body);

  // Busca o pedido atual
  const currentOrder = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      campaign: true
    }
  });

  if (!currentOrder) {
    throw new AppError(404, 'Order not found');
  }

  if (currentOrder.campaign.status !== 'ACTIVE') {
    throw new AppError(400, 'Cannot update orders in a closed or sent group');
  }

  // Se há itens para atualizar
  if (data.items) {
    // Busca produtos para calcular preços
    const productIds = data.items.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } }
    });

    type ProductType = typeof products[number];
    const productMap = new Map<string, ProductType>(products.map(p => [p.id, p]));

    // Remove itens antigos e cria novos em uma transação
    await prisma.$transaction(async (tx) => {
      // Remove todos os itens antigos
      await tx.orderItem.deleteMany({
        where: { orderId: id }
      });

      // Cria novos itens
      await tx.orderItem.createMany({
        data: data.items!.map(item => {
          const product = productMap.get(item.productId);
          if (!product) {
            throw new AppError(400, `Product ${item.productId} not found`);
          }
          return {
            orderId: id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: product.price,
            subtotal: product.price * item.quantity
          };
        })
      });

      // Atualiza nome do cliente se fornecido
      if (data.customerName) {
        await tx.order.update({
          where: { id },
          data: { customerName: data.customerName }
        });
      }
    });

    // Recalcula subtotal e frete
    await ShippingCalculator.recalculateOrderSubtotal(id);
  } else if (data.customerName) {
    // Apenas atualiza o nome se não há itens
    await prisma.order.update({
      where: { id },
      data: { customerName: data.customerName }
    });
  }

  // Busca pedido atualizado
  const updatedOrder = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: true
        }
      },
      campaign: true
    }
  });

  // Emite evento de atualização
  if (updatedOrder) {
    emitOrderUpdated(updatedOrder.campaignId, updatedOrder);
  }

  res.json(updatedOrder);
}));

// POST /api/orders/:id/items - Adiciona item ao pedido
router.post('/:id/items', requireAuth, requireOrderOwnership, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = addItemSchema.parse(req.body);

  // Verifica o status da campanha
  const order = await prisma.order.findUnique({
    where: { id },
    include: { campaign: true }
  });

  if (!order) {
    throw new AppError(404, 'Order not found');
  }

  if (order.campaign.status !== 'ACTIVE') {
    throw new AppError(400, 'Cannot add items to orders in a closed or sent group');
  }

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

  const updatedOrder = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: true
        }
      },
      campaign: true
    }
  });

  // Emite evento de atualização
  if (updatedOrder) {
    emitOrderUpdated(updatedOrder.campaignId, updatedOrder);
  }

  res.json(updatedOrder);
}));

// DELETE /api/orders/:id/items/:itemId - Remove item do pedido
router.delete('/:id/items/:itemId', requireAuth, requireOrderOwnership, asyncHandler(async (req, res) => {
  const { id, itemId } = req.params;

  // Verifica o status da campanha
  const order = await prisma.order.findUnique({
    where: { id },
    include: { campaign: true }
  });

  if (!order) {
    throw new AppError(404, 'Order not found');
  }

  if (order.campaign.status !== 'ACTIVE') {
    throw new AppError(400, 'Cannot remove items from orders in a closed or sent group');
  }

  await prisma.orderItem.delete({
    where: { id: itemId }
  });

  await ShippingCalculator.recalculateOrderSubtotal(id);

  // Emite evento de atualização
  emitOrderUpdated(order.campaignId, { orderId: id });

  res.status(204).send();
}));

// DELETE /api/orders/:id - Remove um pedido
router.delete('/:id', requireAuth, requireOrderOwnership, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { campaign: true }
  });

  if (!order) {
    throw new AppError(404, 'Order not found');
  }

  if (order.campaign.status !== 'ACTIVE') {
    throw new AppError(400, 'Cannot delete orders from a closed or sent group');
  }

  await prisma.order.delete({
    where: { id }
  });

  // Redistribui frete após remoção
  await ShippingCalculator.distributeShipping(order.campaignId);

  // Emite evento de exclusão
  emitOrderDeleted(order.campaignId, { orderId: id });

  res.status(204).send();
}));

export default router;
