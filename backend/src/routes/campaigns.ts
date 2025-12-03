import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../index';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { requireAuth, requireRole, requireCampaignOwnership, optionalAuth } from '../middleware/authMiddleware';
import { z } from 'zod';
import { InvoiceGenerator } from '../services/invoiceGenerator';
import { ShippingCalculator } from '../services/shippingCalculator';

const router = Router();

// Schema para listagem com pagination e filtros
const listCampaignsSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(12),
  search: z.string().optional(),
  status: z.enum(['ACTIVE', 'CLOSED', 'SENT', 'ARCHIVED']).optional(),
  creatorId: z.string().optional(),
  fromSellers: z.preprocess(
    (val) => val === 'true' || val === true,
    z.boolean().optional()
  ),
  similarProducts: z.preprocess(
    (val) => val === 'true' || val === true,
    z.boolean().optional()
  )
});

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

// Função auxiliar para buscar IDs de campanhas usando unaccent (busca sem acentos)
async function searchCampaignIds(searchTerm: string): Promise<string[]> {
  const results = await prisma.$queryRaw<{ id: string }[]>`
    SELECT DISTINCT c.id
    FROM campaigns c
    LEFT JOIN products p ON p."campaignId" = c.id
    WHERE
      unaccent(lower(c.name)) LIKE unaccent(lower(${'%' + searchTerm + '%'}))
      OR unaccent(lower(COALESCE(c.description, ''))) LIKE unaccent(lower(${'%' + searchTerm + '%'}))
      OR unaccent(lower(p.name)) LIKE unaccent(lower(${'%' + searchTerm + '%'}))
  `;
  return results.map(r => r.id);
}

// Função para buscar sugestões de campanhas similares (quando a busca não retorna resultados)
async function getSuggestions(
  searchTerm: string,
  excludeIds: string[],
  limit: number
): Promise<string[]> {
  // Dividir o termo de busca em palavras e buscar cada uma individualmente
  const words = searchTerm.toLowerCase().split(/\s+/).filter(w => w.length > 2);

  if (words.length === 0) return [];

  // Criar condições WHERE para cada palavra
  const wordConditions = words.map(word => Prisma.sql`
    (
      unaccent(lower(c.name)) LIKE unaccent(lower(${'%' + word + '%'}))
      OR unaccent(lower(COALESCE(c.description, ''))) LIKE unaccent(lower(${'%' + word + '%'}))
      OR EXISTS (
        SELECT 1 FROM products p
        WHERE p."campaignId" = c.id
        AND unaccent(lower(p.name)) LIKE unaccent(lower(${'%' + word + '%'}))
      )
    )
  `);

  // Buscar campanhas que contenham qualquer uma das palavras
  const excludeCondition = excludeIds.length > 0
    ? Prisma.sql`AND c.id NOT IN (${Prisma.join(excludeIds.map(id => Prisma.sql`${id}`))})`
    : Prisma.sql``;

  const results = await prisma.$queryRaw<{ id: string; createdAt: Date }[]>`
    SELECT DISTINCT c.id, c."createdAt"
    FROM campaigns c
    WHERE (${Prisma.join(wordConditions, Prisma.sql` OR `)})
    ${excludeCondition}
    ORDER BY c."createdAt" DESC
    LIMIT ${limit}
  `;

  return results.map(r => r.id);
}

// GET /api/campaigns - Lista campanhas com pagination e filtros
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const { cursor, limit, search, status, creatorId, fromSellers, similarProducts } =
    listCampaignsSchema.parse(req.query);

  // Construir where clause dinâmica
  let where: Prisma.CampaignWhereInput = {};
  let searchCampaignIdList: string[] | null = null;

  // Filtro de status
  if (status) {
    where.status = status;
  }

  // Filtro de criador (minhas campanhas)
  if (creatorId) {
    where.creatorId = creatorId;
  }

  // Busca textual com unaccent (ignora acentos)
  if (search && search.trim()) {
    const searchTerm = search.trim();
    searchCampaignIdList = await searchCampaignIds(searchTerm);

    if (searchCampaignIdList.length === 0) {
      // Se não encontrou nada, buscar sugestões
      const suggestionIds = await getSuggestions(searchTerm, [], 6);

      if (suggestionIds.length > 0) {
        // Retornar sugestões com flag indicando que são sugestões
        const suggestions = await prisma.campaign.findMany({
          where: { id: { in: suggestionIds } },
          orderBy: { createdAt: 'desc' },
          include: {
            creator: { select: { id: true, name: true } },
            products: {
              take: 4,
              select: { id: true, name: true, price: true },
              orderBy: { createdAt: 'asc' }
            },
            _count: { select: { products: true, orders: true } }
          }
        });

        return res.json({
          data: [],
          suggestions,
          nextCursor: null,
          hasMore: false,
          total: 0
        });
      }

      return res.json({ data: [], suggestions: [], nextCursor: null, hasMore: false, total: 0 });
    }

    where.id = { in: searchCampaignIdList };
  }

  // Filtro: campanhas de vendedores que o usuário já comprou
  if (fromSellers && req.user) {
    const purchasedCampaigns = await prisma.order.findMany({
      where: { userId: req.user.id },
      select: { campaign: { select: { creatorId: true } } },
      distinct: ['campaignId']
    });
    const sellerIds = [...new Set(
      purchasedCampaigns
        .map(p => p.campaign.creatorId)
        .filter((id): id is string => id !== null)
    )];

    if (sellerIds.length > 0) {
      where.creatorId = { in: sellerIds };
    } else {
      return res.json({ data: [], suggestions: [], nextCursor: null, hasMore: false, total: 0 });
    }
  }

  // Filtro: campanhas com produtos similares aos que o usuário já comprou
  if (similarProducts && req.user) {
    const purchasedProducts = await prisma.orderItem.findMany({
      where: { order: { userId: req.user.id } },
      select: { product: { select: { name: true } } },
      distinct: ['productId']
    });

    if (purchasedProducts.length > 0) {
      const keywords = [...new Set(
        purchasedProducts
          .flatMap(p => p.product.name.toLowerCase().split(/\s+/))
          .filter(word => word.length > 2)
      )].slice(0, 10);

      if (keywords.length > 0) {
        where.products = {
          some: {
            OR: keywords.map(kw => ({ name: { contains: kw, mode: 'insensitive' as const } }))
          }
        };
      }
    } else {
      return res.json({ data: [], suggestions: [], nextCursor: null, hasMore: false, total: 0 });
    }
  }

  // Query com cursor pagination
  const campaigns = await prisma.campaign.findMany({
    where,
    take: limit + 1,
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : 0,
    orderBy: { createdAt: 'desc' },
    include: {
      creator: { select: { id: true, name: true } },
      products: {
        take: 4,
        select: { id: true, name: true, price: true },
        orderBy: { createdAt: 'asc' }
      },
      _count: { select: { products: true, orders: true } }
    }
  });

  const hasMore = campaigns.length > limit;
  const data = hasMore ? campaigns.slice(0, -1) : campaigns;
  const nextCursor = hasMore && data.length > 0 ? data[data.length - 1].id : null;

  const total = await prisma.campaign.count({ where });

  // Se temos resultados de busca mas poucos, adicionar sugestões
  let suggestions: typeof data = [];
  if (search && search.trim() && data.length > 0 && data.length < 6) {
    const existingIds = data.map(c => c.id);
    const suggestionIds = await getSuggestions(search.trim(), existingIds, 6 - data.length);

    if (suggestionIds.length > 0) {
      suggestions = await prisma.campaign.findMany({
        where: { id: { in: suggestionIds } },
        orderBy: { createdAt: 'desc' },
        include: {
          creator: { select: { id: true, name: true } },
          products: {
            take: 4,
            select: { id: true, name: true, price: true },
            orderBy: { createdAt: 'asc' }
          },
          _count: { select: { products: true, orders: true } }
        }
      });
    }
  }

  res.json({ data, suggestions, nextCursor, hasMore, total });
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
router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const data = createCampaignSchema.parse(req.body);

  // Convert deadline string to Date object for Prisma
  const prismaData: any = { ...data };
  if (data.deadline) {
    prismaData.deadline = new Date(data.deadline);
  }

  // Adiciona o creatorId do usuário autenticado
  prismaData.creatorId = req.user!.id;

  // Use transaction to upgrade role and create campaign atomically
  const campaign = await prisma.$transaction(async (tx) => {
    // Upgrade user to CAMPAIGN_CREATOR if they're currently a CUSTOMER
    if (req.user!.role === 'CUSTOMER') {
      await tx.user.update({
        where: { id: req.user!.id },
        data: { role: 'CAMPAIGN_CREATOR' }
      });
    }

    // Create the campaign
    return await tx.campaign.create({
      data: prismaData
    });
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
router.get('/:id/supplier-invoice', requireAuth, requireCampaignOwnership, asyncHandler(async (req, res) => {
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
