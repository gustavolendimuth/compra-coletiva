import { Router } from 'express';
import { prisma } from '../index';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { requireAuth, requireRole, requireCampaignOwnership, optionalAuth } from '../middleware/authMiddleware';
import { z } from 'zod';
import { InvoiceGenerator } from '../services/invoiceGenerator';
import { ShippingCalculator } from '../services/shippingCalculator';

const router = Router();

const createCampaignSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  deadline: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return undefined;
      // Accept datetime formats with or without timezone
      if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(val)) {
        return val;
      }
      return val;
    },
    z.string().optional()
  ),
  shippingCost: z.number().min(0).default(0)
});

const updateCampaignSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  deadline: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return null;
      // Accept datetime formats with or without timezone
      if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(val)) {
        return val;
      }
      return val;
    },
    z.string().nullable().optional()
  ),
  shippingCost: z.number().min(0).optional(),
  status: z.enum(['ACTIVE', 'CLOSED', 'SENT', 'ARCHIVED']).optional()
});

const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'CLOSED', 'SENT', 'ARCHIVED'])
});

// GET /api/campaigns - Lista todos os grupos
router.get('/', asyncHandler(async (req, res) => {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { products: true, orders: true }
      }
    }
  });

  res.json(campaigns);
}));

// GET /api/campaigns/:id - Busca um grupo específico
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      products: true,
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

  res.json(campaign);
}));

// POST /api/campaigns - Cria um novo grupo
router.post('/', requireAuth, requireRole('CAMPAIGN_CREATOR', 'ADMIN'), asyncHandler(async (req, res) => {
  const data = createCampaignSchema.parse(req.body);

  // Convert deadline string to Date object for Prisma
  const prismaData: any = { ...data };
  if (data.deadline) {
    prismaData.deadline = new Date(data.deadline);
  }

  // Adiciona o creatorId do usuário autenticado
  prismaData.creatorId = req.user!.id;

  const campaign = await prisma.campaign.create({
    data: prismaData
  });

  res.status(201).json(campaign);
}));

// PATCH /api/campaigns/:id - Atualiza um grupo
router.patch('/:id', requireAuth, requireCampaignOwnership, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const data = updateCampaignSchema.parse(req.body);

  // Convert deadline string to Date object for Prisma
  const prismaData: any = { ...data };
  if (data.deadline !== undefined) {
    prismaData.deadline = data.deadline ? new Date(data.deadline) : null;
  }

  const campaign = await prisma.campaign.update({
    where: { id },
    data: prismaData
  });

  // Se o shippingCost foi atualizado, redistribuir frete para todos os pedidos
  if (data.shippingCost !== undefined) {
    await ShippingCalculator.distributeShipping(id);
  }

  res.json(campaign);
}));

// PATCH /api/campaigns/:id/status - Atualiza apenas o status do grupo
router.patch('/:id/status', requireAuth, requireCampaignOwnership, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = updateStatusSchema.parse(req.body);

  const campaign = await prisma.campaign.update({
    where: { id },
    data: { status }
  });

  res.json(campaign);
}));

// DELETE /api/campaigns/:id - Remove um grupo
router.delete('/:id', requireAuth, requireCampaignOwnership, asyncHandler(async (req, res) => {
  const { id } = req.params;

  await prisma.campaign.delete({
    where: { id }
  });

  res.status(204).send();
}));

// GET /api/campaigns/:id/supplier-invoice - Gera fatura para fornecedor em PDF
router.get('/:id/supplier-invoice', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const pdfBuffer = await InvoiceGenerator.generateSupplierInvoice(id);

  // Get campaign name for filename
  const campaign = await prisma.campaign.findUnique({
    where: { id },
    select: { name: true }
  });

  const filename = `fatura-fornecedor-${campaign?.name.replace(/[^a-z0-9]/gi, '-').toLowerCase() || id}.pdf`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(pdfBuffer);
}));

export default router;
