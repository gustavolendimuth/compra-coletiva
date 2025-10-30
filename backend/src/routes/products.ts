import { Router } from 'express';
import { prisma } from '../index';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { z } from 'zod';

const router = Router();

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

// GET /api/products?campaignId=xxx - Lista produtos de uma campanha
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
router.post('/', asyncHandler(async (req, res) => {
  const data = createProductSchema.parse(req.body);

  const product = await prisma.product.create({
    data: data as any
  });

  res.status(201).json(product);
}));

// PATCH /api/products/:id - Atualiza um produto
router.patch('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = updateProductSchema.parse(req.body);

  const product = await prisma.product.update({
    where: { id },
    data
  });

  res.json(product);
}));

// DELETE /api/products/:id - Remove um produto
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  await prisma.product.delete({
    where: { id }
  });

  res.status(204).send();
}));

export default router;
