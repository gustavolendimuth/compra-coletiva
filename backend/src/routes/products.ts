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
router.post('/', asyncHandler(async (req, res) => {
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
    data: data as any
  });

  res.status(201).json(product);
}));

// PATCH /api/products/:id - Atualiza um produto
router.patch('/:id', asyncHandler(async (req, res) => {
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
router.delete('/:id', asyncHandler(async (req, res) => {
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
