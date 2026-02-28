import { Router } from 'express';
import { prisma } from '../index';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { requireAuth } from '../middleware/authMiddleware';
import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

const router = Router();

// Middleware para verificar ownership da campanha via campaignId no body
const requireCampaignOwnershipViaBody = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Autenticação necessária' });
      return;
    }

    if (req.user.role === 'ADMIN') {
      next();
      return;
    }

    const { campaignId } = req.body;
    if (!campaignId) {
      res.status(400).json({ error: 'BAD_REQUEST', message: 'campaignId é obrigatório' });
      return;
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { creatorId: true },
    });

    if (!campaign) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Campanha não encontrada' });
      return;
    }

    if (campaign.creatorId !== req.user.id) {
      res.status(403).json({ error: 'FORBIDDEN', message: 'Você não pode adicionar produtos a esta campanha' });
      return;
    }

    next();
  } catch (error) {
    console.error('Erro ao verificar ownership:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro ao verificar permissões' });
  }
};

// Middleware para verificar ownership via productId
const requireProductOwnership = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Autenticação necessária' });
      return;
    }

    if (req.user.role === 'ADMIN') {
      next();
      return;
    }

    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: { campaign: { select: { creatorId: true } } },
    });

    if (!product) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Produto não encontrado' });
      return;
    }

    if (product.campaign.creatorId !== req.user.id) {
      res.status(403).json({ error: 'FORBIDDEN', message: 'Você não pode modificar este produto' });
      return;
    }

    next();
  } catch (error) {
    console.error('Erro ao verificar ownership:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro ao verificar permissões' });
  }
};

const createProductSchema = z.object({
  campaignId: z.string(),
  name: z.string().min(1),
  price: z.number().min(0),
  weight: z.number().min(0)
});

const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  price: z.number().min(0).optional(),
  weight: z.number().min(0).optional()
});

// GET /api/products?campaignId=xxx - Lista produtos de um grupo
router.get('/', asyncHandler(async (req, res) => {
  const { campaignId } = req.query;

  if (!campaignId || typeof campaignId !== 'string') {
    throw new AppError(400, 'campaignId is required');
  }

  const products = await prisma.product.findMany({
    where: { campaignId },
    orderBy: { createdAt: 'asc' }
  });

  res.json(products);
}));

// GET /api/products/:id - Busca um produto específico
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await prisma.product.findUnique({
    where: { id }
  });

  if (!product) {
    throw new AppError(404, 'Product not found');
  }

  res.json(product);
}));

// POST /api/products - Cria um novo produto
router.post('/', requireAuth, requireCampaignOwnershipViaBody, asyncHandler(async (req, res) => {
  const data = createProductSchema.parse(req.body);

  // Verifica se o grupo está ativo
  const campaign = await prisma.campaign.findUnique({
    where: { id: data.campaignId }
  });

  if (!campaign) {
    throw new AppError(404, 'Campaign not found');
  }

  if (campaign.status !== 'ACTIVE') {
    throw new AppError(400, 'Cannot add products to a closed or sent group');
  }

  const product = await prisma.product.create({
    data: {
      campaignId: data.campaignId,
      name: data.name,
      price: data.price,
      weight: data.weight,
    }
  });

  res.status(201).json(product);
}));

// PATCH /api/products/:id - Atualiza um produto
router.patch('/:id', requireAuth, requireProductOwnership, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = updateProductSchema.parse(req.body);

  // Busca o produto e verifica o status do grupo
  const product = await prisma.product.findUnique({
    where: { id },
    include: { campaign: true }
  });

  if (!product) {
    throw new AppError(404, 'Product not found');
  }

  if (product.campaign.status !== 'ACTIVE') {
    throw new AppError(400, 'Cannot update products in a closed or sent group');
  }

  const updatedProduct = await prisma.product.update({
    where: { id },
    data
  });

  res.json(updatedProduct);
}));

// DELETE /api/products/:id - Remove um produto
router.delete('/:id', requireAuth, requireProductOwnership, asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Busca o produto e verifica o status do grupo
  const product = await prisma.product.findUnique({
    where: { id },
    include: { campaign: true }
  });

  if (!product) {
    throw new AppError(404, 'Product not found');
  }

  if (product.campaign.status !== 'ACTIVE') {
    throw new AppError(400, 'Cannot delete products from a closed or sent group');
  }

  await prisma.product.delete({
    where: { id }
  });

  res.status(204).send();
}));

export default router;
