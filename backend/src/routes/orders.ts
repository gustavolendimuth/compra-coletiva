import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../index';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { requireAuth, optionalAuth, requireOrderOwnership, requireOrderOrCampaignOwnership } from '../middleware/authMiddleware';
import { z } from 'zod';
import { ShippingCalculator } from '../services/shippingCalculator';
import { lockCampaignRow, lockOrderRow } from '../services/orderLocks';
import { emitOrderCreated, emitOrderUpdated, emitOrderDeleted, emitOrderStatusChanged } from '../services/socketService';
import { Money } from '../utils/money';
import { CampaignStatusService } from '../services/campaignStatusService';
import { uploadPaymentProof, handleUploadError } from '../middleware/uploadMiddleware';
import { buildPaymentProofUrl, PaymentProofStorage } from '../services/paymentProofStorage';
import { detectFileType } from '../utils/fileSignature';
import fs from 'fs';
import { capitalizeName } from '../utils/nameFormatter';
import { queueOrderCreatedEmail } from '../services/email/emailQueue';
import { getCampaignParticipantDisplayName } from '../utils/campaignParticipantName';
import { LEGAL_SALES_DISCLAIMER_VERSION } from '../config/legal';
import { LegalAcceptanceService } from '../services/legalAcceptanceService';

const router = Router();

const PAID_ORDER_LOCKED_MESSAGE = 'Pedido já pago não pode ser alterado';
const PAID_ORDER_DELETE_MESSAGE = 'Pedido já pago não pode ser removido';
const DUPLICATE_ORDER_MESSAGE = 'Você já tem um pedido nesta campanha. Atualize a página e tente novamente.';

// strict=false: o Zod infere campos como opcionais; o schema já garantiu os dois
type OrderItemInput = { productId?: string; quantity?: number };

/**
 * Trava a campanha até o fim da transação e exige status ACTIVE no momento da escrita.
 */
async function assertCampaignOpenForOrders(
  tx: Prisma.TransactionClient,
  campaignId: string,
  closedMessage: string
): Promise<void> {
  const status = await lockCampaignRow(tx, campaignId);
  if (!status) {
    throw new AppError(404, 'Campaign not found');
  }
  if (status !== 'ACTIVE') {
    throw new AppError(400, closedMessage);
  }
}

/**
 * Trava o pedido até o fim da transação e recusa pedido já pago (vale para qualquer ator).
 */
async function assertOrderNotPaid(tx: Prisma.TransactionClient, orderId: string): Promise<void> {
  const order = await lockOrderRow(tx, orderId);
  if (!order) {
    throw new AppError(404, 'Order not found');
  }
  if (order.isPaid) {
    throw new AppError(400, PAID_ORDER_LOCKED_MESSAGE);
  }
}

/**
 * Monta as linhas de itens só com produtos da própria campanha; produto de outra campanha (ou inexistente) = 400.
 */
async function buildCampaignItemRows(
  tx: Prisma.TransactionClient,
  campaignId: string,
  items: OrderItemInput[]
): Promise<Array<{ productId: string; quantity: number; unitPrice: number; subtotal: number }>> {
  const productIds = [...new Set(items.map((item) => item.productId))];
  const products = await tx.product.findMany({
    where: { id: { in: productIds }, campaignId },
    select: { id: true, price: true }
  });
  const productMap = new Map(products.map((product) => [product.id, product]));

  const missing = productIds.find((productId) => !productMap.has(productId));
  if (missing) {
    throw new AppError(400, `Produto ${missing} não pertence a esta campanha`);
  }

  return items.map((item) => {
    const product = productMap.get(item.productId!)!;
    return {
      productId: item.productId!,
      quantity: item.quantity!,
      unitPrice: product.price,
      subtotal: Money.multiply(product.price, item.quantity)
    };
  });
}

const createOrderSchema = z.object({
  campaignId: z.string(),
  userId: z.string().optional(),
  customer: z.object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().toLowerCase().email(),
    phone: z.string().trim().optional()
  }).optional(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().min(1)
  })).min(0).optional().default([]) // Permite criar pedidos vazios
});

const updateOrderSchema = z.object({
  isPaid: z.boolean().optional(),
  isSeparated: z.boolean().optional()
});

const updateOrderWithItemsSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().min(1)
  })).min(1).optional()
});

const updatePaymentSchema = z.object({
  isPaid: z.enum(['true', 'false'], {
    errorMap: () => ({ message: 'isPaid é obrigatório ("true" ou "false")' })
  })
});

const addItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().min(1)
});

// GET /api/orders/public?campaignId=xxx - Transparência pública com nome reduzido ou apelido + agregados
router.get('/public', optionalAuth, asyncHandler(async (req, res) => {
  const { campaignId } = req.query;

  if (!campaignId || typeof campaignId !== 'string') {
    throw new AppError(400, 'campaignId is required');
  }

  const isAuthenticated = !!req.user;

  const orders = await prisma.order.findMany({
    where: { campaignId },
    select: {
      id: true,
      userId: true,
      isPaid: true,
      subtotal: true,
      shippingFee: true,
      total: true,
      createdAt: true,
      items: {
        select: {
          quantity: true,
          unitPrice: true,
          subtotal: true,
          product: {
            select: { name: true },
          },
        },
      },
      customer: {
        select: {
          name: true,
          hideNameInCampaigns: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  const publicOrders = orders.map((order) => {
    const quantityTotal = order.items.reduce((sum, item) => sum + item.quantity, 0);
    const base = {
      alias: getCampaignParticipantDisplayName({
        fullName: order.customer?.name,
        hideNameInCampaigns: order.customer?.hideNameInCampaigns ?? true,
        userId: order.userId,
        campaignId,
      }),
      isPaid: order.isPaid,
      subtotal: order.subtotal,
      shippingFee: order.shippingFee,
      total: order.total,
      itemsCount: order.items.length,
      quantityTotal,
      createdAt: order.createdAt,
    };

    if (isAuthenticated) {
      // id e userId só no pedido do próprio requisitante
      const ownOrderIdentity =
        order.userId === req.user!.id ? { id: order.id, userId: order.userId } : {};
      return {
        ...base,
        ...ownOrderIdentity,
        items: order.items.map((item) => ({
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
          product: item.product,
        })),
      };
    }

    return base;
  });

  const totals = publicOrders.reduce(
    (acc, order) => {
      acc.orders += 1;
      acc.totalWithShipping += order.total;
      acc.totalWithoutShipping += order.subtotal;
      acc.totalShipping += order.shippingFee;
      acc.totalItems += order.itemsCount;
      acc.totalQuantity += order.quantityTotal;
      if (order.isPaid) {
        acc.paidTotal += order.total;
      } else {
        acc.unpaidTotal += order.total;
      }
      return acc;
    },
    {
      orders: 0,
      totalWithShipping: 0,
      totalWithoutShipping: 0,
      totalShipping: 0,
      totalItems: 0,
      totalQuantity: 0,
      paidTotal: 0,
      unpaidTotal: 0,
    }
  );

  res.json({
    campaignId,
    totals,
    orders: publicOrders,
  });
}));

// GET /api/orders/my?campaignId=xxx - Pedido do usuário autenticado na campanha
router.get('/my', requireAuth, asyncHandler(async (req, res) => {
  const { campaignId } = req.query;

  if (!campaignId || typeof campaignId !== 'string') {
    throw new AppError(400, 'campaignId is required');
  }

  const order = await prisma.order.findFirst({
    where: {
      campaignId,
      userId: req.user!.id,
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  res.json(order);
}));

// GET /api/orders?campaignId=xxx - Lista completa para gestão (criador/admin)
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const { campaignId } = req.query;
  const requestId = Math.random().toString(36).slice(2, 8);
  const totalStart = Date.now();

  if (!campaignId || typeof campaignId !== 'string') {
    throw new AppError(400, 'campaignId is required');
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { creatorId: true },
  });

  if (!campaign) {
    throw new AppError(404, 'Campaign not found');
  }

  const isAdmin = req.user!.role === 'ADMIN';
  const isCreator = campaign.creatorId === req.user!.id;

  if (!isAdmin && !isCreator) {
    throw new AppError(403, 'Você não tem permissão para visualizar os pedidos desta campanha');
  }

  const fetchStart = Date.now();
  const orders = await prisma.order.findMany({
    where: { campaignId },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
  const fetchMs = Date.now() - fetchStart;

  const itemsCount = orders.reduce((sum, order) => sum + (order.items?.length || 0), 0);
  const totalMs = Date.now() - totalStart;
  console.log(
    `[Perf] GET /api/orders campaignId=${campaignId} user=${req.user!.id} role=${req.user!.role} orders=${orders.length} items=${itemsCount} fetchMs=${fetchMs} totalMs=${totalMs} req=${requestId}`
  );

  res.json(orders);
}));

// GET /api/orders/:id - Busca um pedido específico
router.get('/:id', requireAuth, requireOrderOrCampaignOwnership, asyncHandler(async (req, res) => {
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
  const isAdmin = req.user!.role === 'ADMIN';

  // Verifica se o grupo está ativo
  const campaign = await prisma.campaign.findUnique({
    where: { id: data.campaignId }
  });

  if (!campaign) {
    throw new AppError(404, 'Campaign not found');
  }

  const canCreateForAnotherUser = isAdmin || campaign.creatorId === req.user!.id;

  if (!canCreateForAnotherUser && (data.userId || data.customer)) {
    throw new AppError(403, 'Only admins or campaign creator can create orders for another user');
  }

  if (canCreateForAnotherUser && data.userId && data.customer) {
    throw new AppError(400, 'Provide either userId or customer, not both');
  }

  if (
    req.user!.role !== 'ADMIN' &&
    !LegalAcceptanceService.hasAcceptedCurrentSalesDisclaimer(
      req.user!,
      LEGAL_SALES_DISCLAIMER_VERSION
    )
  ) {
    res.status(403).json({
      error: 'SALES_DISCLAIMER_REQUIRED',
      message:
        'Você precisa confirmar ciência da isenção de responsabilidade sobre vendas antes de criar pedidos.',
      requiredVersion: LEGAL_SALES_DISCLAIMER_VERSION,
    });
    return;
  }

  const normalizePhone = (value?: string): string | undefined => {
    if (!value) return undefined;
    const digits = value.replace(/\D/g, '');
    if (!digits) return undefined;
    if (digits.length === 13 && digits.startsWith('55')) {
      return digits.slice(2);
    }
    return digits;
  };

  const resolveTargetUserId = async (): Promise<string> => {
    if (!canCreateForAnotherUser) return req.user!.id;

    if (data.userId) {
      const existingUser = await prisma.user.findUnique({
        where: { id: data.userId },
        select: { id: true, deletedAt: true }
      });

      if (!existingUser || existingUser.deletedAt) {
        throw new AppError(404, 'User not found');
      }

      return existingUser.id;
    }

    if (!data.customer) return req.user!.id;

    const existingByEmail = await prisma.user.findUnique({
      where: { email: data.customer.email },
      select: { id: true, deletedAt: true }
    });

    if (existingByEmail) {
      if (existingByEmail.deletedAt) {
        throw new AppError(400, 'Cannot create order for a deleted user');
      }
      return existingByEmail.id;
    }

    try {
      const createdLegacyUser = await prisma.user.create({
        data: {
          name: capitalizeName(data.customer.name),
          email: data.customer.email,
          phone: normalizePhone(data.customer.phone),
          phoneCompleted: !!normalizePhone(data.customer.phone),
          addressCompleted: false,
          role: 'CUSTOMER',
          isLegacyUser: true
        },
        select: { id: true }
      });

      return createdLegacyUser.id;
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const user = await prisma.user.findUnique({
          where: { email: data.customer.email },
          select: { id: true, deletedAt: true }
        });
        if (user && !user.deletedAt) {
          return user.id;
        }
      }
      throw error;
    }
  };

  const targetUserId = await resolveTargetUserId();

  if (campaign.status !== 'ACTIVE') {
    throw new AppError(400, 'Cannot create orders in a closed or sent group');
  }

  const closedMessage = 'Cannot create orders in a closed or sent group';
  let orderId: string;
  let isNewOrder = false;

  try {
    // Status da campanha, pagamento e itens conferidos e gravados sob lock, junto com os totais
    orderId = await prisma.$transaction(async (tx) => {
      await assertCampaignOpenForOrders(tx, data.campaignId, closedMessage);

      const itemRows = data.items.length > 0
        ? await buildCampaignItemRows(tx, data.campaignId, data.items)
        : [];

      // Pedido existente do par (campanha, usuário): substitui os itens
      const existingOrder = await tx.order.findFirst({
        where: {
          campaignId: data.campaignId,
          userId: targetUserId
        },
        select: { id: true }
      });

      let id: string;
      if (existingOrder) {
        await assertOrderNotPaid(tx, existingOrder.id);
        await tx.orderItem.deleteMany({
          where: { orderId: existingOrder.id }
        });
        if (itemRows.length > 0) {
          await tx.orderItem.createMany({
            data: itemRows.map((row) => ({ ...row, orderId: existingOrder.id }))
          });
        }
        id = existingOrder.id;
      } else {
        // Pedido não existe - criar novo (pode ser vazio)
        isNewOrder = true;
        const created = await tx.order.create({
          data: {
            campaignId: data.campaignId,
            userId: targetUserId,
            items: itemRows.length > 0 ? { create: itemRows } : undefined
          },
          select: { id: true }
        });
        id = created.id;
      }

      await ShippingCalculator.recalculateCampaignTotals(tx, data.campaignId);
      return id;
    });
  } catch (error: unknown) {
    // Corrida com outra requisição do mesmo usuário: o índice único (campaignId, userId) barrou a duplicata
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new AppError(409, DUPLICATE_ORDER_MESSAGE);
    }
    throw error;
  }

  const order = { id: orderId };

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
    emitOrderCreated(data.campaignId, order.id);

    if (updatedOrder?.customer?.email && campaign.slug) {
      try {
        await queueOrderCreatedEmail(
          updatedOrder.customer.id,
          updatedOrder.customer.name,
          updatedOrder.customer.email,
          campaign.name,
          campaign.slug,
          updatedOrder.id
        );
      } catch (emailError) {
        console.error('[Orders] Failed to queue order created email:', emailError);
      }
    }
  } else {
    emitOrderUpdated(data.campaignId, order.id);
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

  // Pagamento e separação: só criador da campanha ou ADMIN (participante usa /:id/payment com comprovante)
  if ((data.isPaid !== undefined || data.isSeparated !== undefined) && req.user!.role !== 'ADMIN') {
    const current = await prisma.order.findUnique({
      where: { id },
      select: { campaign: { select: { creatorId: true } } }
    });

    if (!current) {
      throw new AppError(404, 'Order not found');
    }

    if (current.campaign.creatorId !== req.user!.id) {
      throw new AppError(403, 'Apenas o criador da campanha ou um administrador pode alterar pagamento ou separação');
    }
  }

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
    emitOrderStatusChanged(order.campaignId, order.id);

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
    emitOrderUpdated(order.campaignId, order.id);
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
    const items = data.items;
    await prisma.$transaction(async (tx) => {
      await assertCampaignOpenForOrders(tx, currentOrder.campaignId, 'Cannot update orders in a closed or sent group');
      await assertOrderNotPaid(tx, id);

      const itemRows = await buildCampaignItemRows(tx, currentOrder.campaignId, items);

      await tx.orderItem.deleteMany({
        where: { orderId: id }
      });
      await tx.orderItem.createMany({
        data: itemRows.map((row) => ({ ...row, orderId: id }))
      });

      await ShippingCalculator.recalculateCampaignTotals(tx, currentOrder.campaignId);
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
    emitOrderUpdated(updatedOrder.campaignId, updatedOrder.id);
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

  await prisma.$transaction(async (tx) => {
    await assertCampaignOpenForOrders(tx, order.campaignId, 'Cannot add items to orders in a closed or sent group');
    await assertOrderNotPaid(tx, id);

    const [itemRow] = await buildCampaignItemRows(tx, order.campaignId, [data]);
    await tx.orderItem.create({
      data: { ...itemRow, orderId: id }
    });

    await ShippingCalculator.recalculateCampaignTotals(tx, order.campaignId);
  });

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
    emitOrderUpdated(updatedOrder.campaignId, updatedOrder.id);
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

  await prisma.$transaction(async (tx) => {
    await assertCampaignOpenForOrders(tx, order.campaignId, 'Cannot remove items from orders in a closed or sent group');
    await assertOrderNotPaid(tx, id);

    // Só remove se o item pertence a este pedido (evita IDOR por itemId de outro pedido)
    const { count } = await tx.orderItem.deleteMany({
      where: { id: itemId, orderId: id }
    });

    if (count === 0) {
      throw new AppError(404, 'Order item not found');
    }

    await ShippingCalculator.recalculateCampaignTotals(tx, order.campaignId);
  });

  // Emite evento de atualização
  emitOrderUpdated(order.campaignId, id);

  res.status(204).send();
}));

// GET /api/orders/:id/payment-proof - Comprovante (dono do pedido, criador da campanha ou admin)
router.get('/:id/payment-proof', requireAuth, requireOrderOrCampaignOwnership, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await prisma.order.findUnique({
    where: { id },
    select: { paymentProofKey: true, paymentProofStorageType: true },
  });

  if (!order || !order.paymentProofKey || !order.paymentProofStorageType) {
    throw new AppError(404, 'Payment proof not found');
  }

  res.setHeader('Cache-Control', 'private, no-store');

  if (order.paymentProofStorageType === 'S3') {
    const signedUrl = await PaymentProofStorage.getSignedUrl(order.paymentProofKey);
    res.redirect(302, signedUrl);
    return;
  }

  const localPath = PaymentProofStorage.resolveLocalPath(order.paymentProofKey);
  if (!localPath) {
    throw new AppError(404, 'Payment proof not found');
  }

  // Content-Type pelo conteúdo: arquivo legado com extensão enganosa nunca sai como HTML
  const buffer = fs.readFileSync(localPath);
  const detected = detectFileType(buffer);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (detected) {
    res.type(detected.mime);
  } else {
    res.type('application/octet-stream');
    res.setHeader('Content-Disposition', 'attachment');
  }
  res.status(200).send(buffer);
}));

// PATCH /api/orders/:id/payment - Atualiza status de pagamento com comprovante
router.patch('/:id/payment',
  requireAuth,
  requireOrderOrCampaignOwnership,
  uploadPaymentProof,
  handleUploadError,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { isPaid } = updatePaymentSchema.parse(req.body); // multipart: "true" | "false"

    const order = await prisma.order.findUnique({
      where: { id },
      include: { campaign: true }
    });

    if (!order) {
      throw new AppError(404, 'Order not found');
    }

    // Admin e criador da campanha marcam/desmarcam com ou sem comprovante;
    // o participante só marca como pago enviando o comprovante
    const isCampaignCreator = order.campaign.creatorId === req.user!.id;
    const isAdminUser = req.user!.role === 'ADMIN';
    const isParticipant = !isAdminUser && !isCampaignCreator;
    if (isParticipant && isPaid === 'false') {
      throw new AppError(403, 'Apenas o criador da campanha ou um administrador pode desmarcar o pagamento');
    }
    if (isParticipant && isPaid === 'true' && !req.file) {
      throw new AppError(400, 'Comprovante de pagamento é obrigatório');
    }

    let updateData: Prisma.OrderUpdateInput = {
      isPaid: isPaid === 'true'
    };

    // Se está marcando como pago, faz upload do comprovante (privado)
    if (isPaid === 'true' && req.file) {
      // Upload primeiro: arquivo inválido (400) não apaga o comprovante anterior
      const uploadResult = await PaymentProofStorage.upload(req.file);

      // Deleta comprovante anterior se existir
      if (order.paymentProofKey && order.paymentProofStorageType) {
        await PaymentProofStorage.delete(
          order.paymentProofKey,
          order.paymentProofStorageType
        );
      }

      updateData.paymentProofUrl = buildPaymentProofUrl(id);
      updateData.paymentProofKey = uploadResult.key;
      updateData.paymentProofStorageType = uploadResult.storageType;
    }

    // Se está desmarcando como pago, remove comprovante
    if (isPaid === 'false' && order.paymentProofKey && order.paymentProofStorageType) {
      await PaymentProofStorage.delete(
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
    emitOrderStatusChanged(order.campaignId, updatedOrder.id);

    {
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
router.delete('/:id', requireAuth, requireOrderOrCampaignOwnership, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isAdmin = req.user!.role === 'ADMIN';

  const order = await prisma.order.findUnique({
    where: { id },
    include: { campaign: true }
  });

  if (!order) {
    throw new AppError(404, 'Order not found');
  }

  if (order.campaign.status !== 'ACTIVE' && !isAdmin) {
    throw new AppError(400, 'Cannot delete orders from a closed or sent group');
  }

  // Pedido pago não some (dono e criador); ADMIN mantém o delete
  if (order.isPaid && !isAdmin) {
    throw new AppError(400, PAID_ORDER_DELETE_MESSAGE);
  }

  // O criador passa pelo guard só para receber o 400 acima; apagar pedido alheio continua proibido
  if (order.userId !== req.user!.id && !isAdmin) {
    throw new AppError(403, 'Você não tem permissão para remover este pedido');
  }

  await prisma.order.delete({
    where: { id }
  });

  // Redistribui frete após remoção
  await ShippingCalculator.distributeShipping(order.campaignId);

  // Emite evento de exclusão
  emitOrderDeleted(order.campaignId, id);

  res.status(204).send();
}));

export default router;
