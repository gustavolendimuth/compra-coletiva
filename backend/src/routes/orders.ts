import { Router } from 'express';
import { prisma } from '../index';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { requireAuth, requireOrderOwnership, requireOrderOrCampaignOwnership, optionalAuth } from '../middleware/authMiddleware';
import { z } from 'zod';
import { ShippingCalculator } from '../services/shippingCalculator';
import { emitOrderCreated, emitOrderUpdated, emitOrderDeleted, emitOrderStatusChanged } from '../services/socketService';
import { Money } from '../utils/money';
import { CampaignStatusService } from '../services/campaignStatusService';
import { uploadPaymentProof, handleUploadError } from '../middleware/uploadMiddleware';
import { ImageUploadService } from '../services/imageUploadService';

const router = Router();

const createOrderSchema = z.object({
  campaignId: z.string(),
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
      },
      customer: {
        select: {
          id: true,
          name: true,
          email: true
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
      },
      customer: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  if (!order) {
    throw new AppError(404, 'Order not found');
  }

  res.json(order);
}));

// POST /api/orders - Cria um novo pedido ou adiciona itens a um existente
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

  // Verifica se já existe um pedido do usuário nesta campanha
  const existingOrder = await prisma.order.findFirst({
    where: {
      campaignId: data.campaignId,
      userId: req.user!.id
    },
    include: {
      items: true
    }
  });

  let order;
  let isNewOrder = false;

  if (existingOrder) {
    // Pedido existe - substituir/atualizar itens
    // Remove todos os itens antigos e cria novos com as quantidades enviadas
    await prisma.$transaction(async (tx) => {
      // Remove todos os itens antigos
      await tx.orderItem.deleteMany({
        where: { orderId: existingOrder.id }
      });

      // Cria novos itens com as quantidades enviadas
      await tx.orderItem.createMany({
        data: data.items.map(item => {
          const product = productMap.get(item.productId);
          if (!product) {
            throw new AppError(400, `Product ${item.productId} not found`);
          }
          return {
            orderId: existingOrder.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: product.price,
            subtotal: Money.multiply(product.price, item.quantity)
          };
        })
      });
    });

    order = existingOrder;
  } else {
    // Pedido não existe - criar novo
    isNewOrder = true;
    order = await prisma.order.create({
      data: {
        campaignId: data.campaignId,
        userId: req.user!.id, // Vincula ao usuário autenticado
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
              subtotal: Money.multiply(product.price, item.quantity)
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
  }

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
      },
      customer: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  // Emite evento apropriado
  if (isNewOrder) {
    emitOrderCreated(data.campaignId, updatedOrder);
  } else {
    emitOrderUpdated(data.campaignId, updatedOrder);
  }

  // Retorna status 200 se atualizou, 201 se criou
  res.status(isNewOrder ? 201 : 200).json({
    ...updatedOrder,
    isNewOrder
  });
}));

// PATCH /api/orders/:id - Atualiza um pedido (apenas campos simples)
router.patch('/:id', requireAuth, requireOrderOrCampaignOwnership, asyncHandler(async (req, res) => {
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
      campaign: true,
      customer: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  // Se mudou status de pagamento ou separação, emite evento específico
  if (data.isPaid !== undefined || data.isSeparated !== undefined) {
    emitOrderStatusChanged(order.campaignId, {
      orderId: order.id,
      isPaid: order.isPaid,
      isSeparated: order.isSeparated,
      customerName: order.customer.name
    });

    // Se mudou status de pagamento, verifica se deve arquivar/desarquivar a campanha
    if (data.isPaid !== undefined) {
      try {
        // Tentar arquivar (SENT → ARCHIVED se todos os pedidos estão pagos)
        const archiveResult = await CampaignStatusService.checkAndArchiveCampaign(order.campaignId);

        // Tentar desarquivar (ARCHIVED → SENT se algum pedido não está pago)
        const unarchiveResult = await CampaignStatusService.checkAndUnarchiveCampaign(order.campaignId);

        // Log resultado (apenas para debugging)
        if (archiveResult.changed) {
          console.log(`[Orders] Campaign ${order.campaignId} status changed: ${archiveResult.previousStatus} → ${archiveResult.newStatus}`);
        }
        if (unarchiveResult.changed) {
          console.log(`[Orders] Campaign ${order.campaignId} status changed: ${unarchiveResult.previousStatus} → ${unarchiveResult.newStatus}`);
        }
      } catch (error) {
        console.error('[Orders] Error in auto-status change:', error);
        // Não falhar o request - erro no auto-arquivamento não deve bloquear atualização do pedido
      }
    }
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
            subtotal: Money.multiply(product.price, item.quantity)
          };
        })
      });

    });

    // Recalcula subtotal e frete
    await ShippingCalculator.recalculateOrderSubtotal(id);
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
      campaign: true,
      customer: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
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
      subtotal: Money.multiply(product.price, data.quantity)
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
      campaign: true,
      customer: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
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

// PATCH /api/orders/:id/payment - Atualiza status de pagamento com comprovante
router.patch('/:id/payment',
  requireAuth,
  requireOrderOrCampaignOwnership,
  uploadPaymentProof,
  handleUploadError,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { isPaid } = req.body; // "true" or "false" as string

    const order = await prisma.order.findUnique({
      where: { id },
      include: { campaign: true }
    });

    if (!order) {
      throw new AppError(404, 'Order not found');
    }

    // Se está marcando como pago, exige comprovante
    if (isPaid === 'true' && !req.file) {
      throw new AppError(400, 'Comprovante de pagamento é obrigatório');
    }

    let updateData: any = {
      isPaid: isPaid === 'true'
    };

    // Se está marcando como pago, faz upload do comprovante
    if (isPaid === 'true' && req.file) {
      // Deleta comprovante anterior se existir
      if (order.paymentProofKey && order.paymentProofStorageType) {
        await ImageUploadService.deleteImage(
          order.paymentProofKey,
          order.paymentProofStorageType
        );
      }

      // Upload do novo comprovante
      const uploadResult = await ImageUploadService.uploadImage(
        req.file,
        'payment-proofs'
      );

      updateData.paymentProofUrl = uploadResult.imageUrl;
      updateData.paymentProofKey = uploadResult.imageKey;
      updateData.paymentProofStorageType = uploadResult.storageType;
    }

    // Se está desmarcando como pago, remove comprovante
    if (isPaid === 'false' && order.paymentProofKey && order.paymentProofStorageType) {
      await ImageUploadService.deleteImage(
        order.paymentProofKey,
        order.paymentProofStorageType
      );

      updateData.paymentProofUrl = null;
      updateData.paymentProofKey = null;
      updateData.paymentProofStorageType = null;
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        items: {
          include: {
            product: true
          }
        },
        campaign: true,
        customer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Emite eventos e verifica auto-arquivamento
    emitOrderStatusChanged(order.campaignId, {
      orderId: updatedOrder.id,
      isPaid: updatedOrder.isPaid,
      isSeparated: updatedOrder.isSeparated,
      customerName: updatedOrder.customer.name
    });

    if (isPaid !== undefined) {
      try {
        const archiveResult = await CampaignStatusService.checkAndArchiveCampaign(order.campaignId);
        const unarchiveResult = await CampaignStatusService.checkAndUnarchiveCampaign(order.campaignId);

        if (archiveResult.changed) {
          console.log(`[Orders] Campaign ${order.campaignId} status changed: ${archiveResult.previousStatus} → ${archiveResult.newStatus}`);
        }
        if (unarchiveResult.changed) {
          console.log(`[Orders] Campaign ${order.campaignId} status changed: ${unarchiveResult.previousStatus} → ${unarchiveResult.newStatus}`);
        }
      } catch (error) {
        console.error('[Orders] Error in auto-status change:', error);
      }
    }

    res.json(updatedOrder);
  })
);

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
