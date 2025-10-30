import { Router } from 'express';
import { prisma } from '../index';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { z } from 'zod';

const router = Router();

const createCampaignSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  shippingCost: z.number().min(0).default(0)
});

const updateCampaignSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  shippingCost: z.number().min(0).optional(),
  status: z.enum(['ACTIVE', 'CLOSED', 'ARCHIVED']).optional()
});

// GET /api/campaigns - Lista todas as campanhas
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

// GET /api/campaigns/:id - Busca uma campanha específica
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

// POST /api/campaigns - Cria uma nova campanha
router.post('/', asyncHandler(async (req, res) => {
  const data = createCampaignSchema.parse(req.body);

  const campaign = await prisma.campaign.create({
    data: data as any
  });

  res.status(201).json(campaign);
}));

// PATCH /api/campaigns/:id - Atualiza uma campanha
router.patch('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = updateCampaignSchema.parse(req.body);

  const campaign = await prisma.campaign.update({
    where: { id },
    data
  });

  res.json(campaign);
}));

// DELETE /api/campaigns/:id - Remove uma campanha
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  await prisma.campaign.delete({
    where: { id }
  });

  res.status(204).send();
}));

export default router;
