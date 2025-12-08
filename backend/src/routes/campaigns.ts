import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../index";
import { asyncHandler, AppError } from "../middleware/errorHandler";
import {
  requireAuth,
  requireRole,
  requireCampaignOwnership,
  optionalAuth,
} from "../middleware/authMiddleware";
import { z } from "zod";
import { InvoiceGenerator } from "../services/invoiceGenerator";
import { ShippingCalculator } from "../services/shippingCalculator";
import { generateUniqueSlug } from "../utils/slugify";
import { uploadCampaignImage } from "../middleware/uploadMiddleware";
import { ImageUploadService } from "../services/imageUploadService";

const router = Router();

// Schema para listagem com pagination e filtros
const listCampaignsSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(12),
  search: z.string().optional(),
  status: z.enum(["ACTIVE", "CLOSED", "SENT", "ARCHIVED"]).optional(),
  creatorId: z.string().optional(),
  fromSellers: z.preprocess(
    (val) => val === "true" || val === true,
    z.boolean().optional()
  ),
  similarProducts: z.preprocess(
    (val) => val === "true" || val === true,
    z.boolean().optional()
  ),
});

const createCampaignSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  deadline: z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return undefined;
    // Accept datetime formats with or without timezone
    if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(val)) {
      return val;
    }
    return val;
  }, z.string().optional()),
  shippingCost: z.number().min(0).default(0),
});

const updateCampaignSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  deadline: z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return null;
    // Accept datetime formats with or without timezone
    if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(val)) {
      return val;
    }
    return val;
  }, z.string().nullable().optional()),
  shippingCost: z.number().min(0).optional(),
  status: z.enum(["ACTIVE", "CLOSED", "SENT", "ARCHIVED"]).optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(["ACTIVE", "CLOSED", "SENT", "ARCHIVED"]),
});

const cloneCampaignSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

// Função auxiliar para buscar IDs de campanhas usando unaccent (busca sem acentos)
async function searchCampaignIds(searchTerm: string): Promise<string[]> {
  const results = await prisma.$queryRaw<{ id: string }[]>`
    SELECT DISTINCT c.id
    FROM campaigns c
    LEFT JOIN products p ON p."campaignId" = c.id
    WHERE
      unaccent(lower(c.name)) LIKE unaccent(lower(${"%" + searchTerm + "%"}))
      OR unaccent(lower(COALESCE(c.description, ''))) LIKE unaccent(lower(${
        "%" + searchTerm + "%"
      }))
      OR unaccent(lower(p.name)) LIKE unaccent(lower(${"%" + searchTerm + "%"}))
  `;
  return results.map((r) => r.id);
}

// Função para buscar sugestões de campanhas similares (quando a busca não retorna resultados)
async function getSuggestions(
  searchTerm: string,
  excludeIds: string[],
  limit: number
): Promise<string[]> {
  // Dividir o termo de busca em palavras e buscar cada uma individualmente
  const words = searchTerm
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2);

  if (words.length === 0) return [];

  // Criar condições WHERE para cada palavra
  const wordConditions = words.map(
    (word) => Prisma.sql`
    (
      unaccent(lower(c.name)) LIKE unaccent(lower(${"%" + word + "%"}))
      OR unaccent(lower(COALESCE(c.description, ''))) LIKE unaccent(lower(${
        "%" + word + "%"
      }))
      OR EXISTS (
        SELECT 1 FROM products p
        WHERE p."campaignId" = c.id
        AND unaccent(lower(p.name)) LIKE unaccent(lower(${"%" + word + "%"}))
      )
    )
  `
  );

  // Buscar campanhas que contenham qualquer uma das palavras
  const excludeCondition =
    excludeIds.length > 0
      ? Prisma.sql`AND c.id NOT IN (${Prisma.join(
          excludeIds.map((id) => Prisma.sql`${id}`)
        )})`
      : Prisma.sql``;

  const whereCondition = Prisma.join(wordConditions, " OR ");

  const results = await prisma.$queryRaw<{ id: string; createdAt: Date }[]>`
    SELECT DISTINCT c.id, c."createdAt"
    FROM campaigns c
    WHERE (${whereCondition})
    ${excludeCondition}
    ORDER BY c."createdAt" DESC
    LIMIT ${limit}
  `;

  return results.map((r) => r.id);
}

// GET /api/campaigns - Lista campanhas com pagination e filtros
router.get(
  "/",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const {
      cursor,
      limit,
      search,
      status,
      creatorId,
      fromSellers,
      similarProducts,
    } = listCampaignsSchema.parse(req.query);

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
            orderBy: { createdAt: "desc" },
            include: {
              creator: { select: { id: true, name: true } },
              products: {
                take: 4,
                select: { id: true, name: true, price: true },
                orderBy: { createdAt: "asc" },
              },
              _count: { select: { products: true, orders: true } },
            },
          });

          return res.json({
            data: [],
            suggestions,
            nextCursor: null,
            hasMore: false,
            total: 0,
          });
        }

        return res.json({
          data: [],
          suggestions: [],
          nextCursor: null,
          hasMore: false,
          total: 0,
        });
      }

      where.id = { in: searchCampaignIdList };
    }

    // Filtro: campanhas de vendedores que o usuário já comprou
    if (fromSellers && req.user) {
      const purchasedCampaigns = await prisma.order.findMany({
        where: { userId: req.user.id },
        select: { campaign: { select: { creatorId: true } } },
        distinct: ["campaignId"],
      });
      const sellerIds = [
        ...new Set(
          purchasedCampaigns
            .map((p) => p.campaign.creatorId)
            .filter((id): id is string => id !== null)
        ),
      ];

      if (sellerIds.length > 0) {
        where.creatorId = { in: sellerIds };
      } else {
        return res.json({
          data: [],
          suggestions: [],
          nextCursor: null,
          hasMore: false,
          total: 0,
        });
      }
    }

    // Filtro: campanhas com produtos similares aos que o usuário já comprou
    if (similarProducts && req.user) {
      const purchasedProducts = await prisma.orderItem.findMany({
        where: { order: { userId: req.user.id } },
        select: { product: { select: { name: true } } },
        distinct: ["productId"],
      });

      if (purchasedProducts.length > 0) {
        const keywords = [
          ...new Set(
            purchasedProducts
              .flatMap((p) => p.product.name.toLowerCase().split(/\s+/))
              .filter((word) => word.length > 2)
          ),
        ].slice(0, 10);

        if (keywords.length > 0) {
          where.products = {
            some: {
              OR: keywords.map((kw) => ({
                name: { contains: kw, mode: "insensitive" as const },
              })),
            },
          };
        }
      } else {
        return res.json({
          data: [],
          suggestions: [],
          nextCursor: null,
          hasMore: false,
          total: 0,
        });
      }
    }

    // Query com cursor pagination
    const campaigns = await prisma.campaign.findMany({
      where,
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      orderBy: { createdAt: "desc" },
      include: {
        creator: { select: { id: true, name: true } },
        products: {
          take: 4,
          select: { id: true, name: true, price: true },
          orderBy: { createdAt: "asc" },
        },
        _count: { select: { products: true, orders: true } },
      },
    });

    const hasMore = campaigns.length > limit;
    const data = hasMore ? campaigns.slice(0, -1) : campaigns;
    const nextCursor =
      hasMore && data.length > 0 ? data[data.length - 1].id : null;

    const total = await prisma.campaign.count({ where });

    // Se temos resultados de busca mas poucos, adicionar sugestões
    let suggestions: typeof data = [];
    if (search && search.trim() && data.length > 0 && data.length < 6) {
      const existingIds = data.map((c) => c.id);
      const suggestionIds = await getSuggestions(
        search.trim(),
        existingIds,
        6 - data.length
      );

      if (suggestionIds.length > 0) {
        suggestions = await prisma.campaign.findMany({
          where: { id: { in: suggestionIds } },
          orderBy: { createdAt: "desc" },
          include: {
            creator: { select: { id: true, name: true } },
            products: {
              take: 4,
              select: { id: true, name: true, price: true },
              orderBy: { createdAt: "asc" },
            },
            _count: { select: { products: true, orders: true } },
          },
        });
      }
    }

    res.json({ data, suggestions, nextCursor, hasMore, total });
  })
);

// Helper function to find campaign by ID or slug
async function findCampaignByIdOrSlug(idOrSlug: string) {
  // Try to find by slug first (most common case for URLs)
  let campaign = await prisma.campaign.findUnique({
    where: { slug: idOrSlug },
    include: {
      products: true,
      orders: {
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      },
      _count: { select: { products: true, orders: true } },
    },
  });

  // If not found by slug, try by ID (for backward compatibility)
  if (!campaign) {
    campaign = await prisma.campaign.findUnique({
      where: { id: idOrSlug },
      include: {
        products: true,
        orders: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
        _count: { select: { products: true, orders: true } },
      },
    });
  }

  return campaign;
}

// GET /api/campaigns/:idOrSlug - Busca um grupo específico por ID ou slug
router.get(
  "/:idOrSlug",
  asyncHandler(async (req, res) => {
    const { idOrSlug } = req.params;

    const campaign = await findCampaignByIdOrSlug(idOrSlug);

    if (!campaign) {
      throw new AppError(404, "Campaign not found");
    }

    res.json(campaign);
  })
);

// POST /api/campaigns - Cria um novo grupo
router.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const data = createCampaignSchema.parse(req.body);

    // Convert deadline string to Date object for Prisma
    const prismaData: any = { ...data };
    if (data.deadline) {
      prismaData.deadline = new Date(data.deadline);
    }

    // Adiciona o creatorId do usuário autenticado
    prismaData.creatorId = req.user!.id;

    // Generate unique slug from campaign name
    prismaData.slug = await generateUniqueSlug(data.name);

    // Use transaction to upgrade role and create campaign atomically
    const campaign = await prisma.$transaction(async (tx) => {
      // Upgrade user to CAMPAIGN_CREATOR if they're currently a CUSTOMER
      if (req.user!.role === "CUSTOMER") {
        await tx.user.update({
          where: { id: req.user!.id },
          data: { role: "CAMPAIGN_CREATOR" },
        });
      }

      // Create the campaign
      return await tx.campaign.create({
        data: prismaData,
      });
    });

    res.status(201).json(campaign);
  })
);

// POST /api/campaigns/:idOrSlug/clone - Clona uma campanha com todos os produtos
router.post(
  "/:idOrSlug/clone",
  requireAuth,
  requireCampaignOwnership,
  asyncHandler(async (req, res) => {
    const { idOrSlug } = req.params;
    const data = cloneCampaignSchema.parse(req.body);

    // Buscar a campanha original com seus produtos (por ID ou slug)
    let originalCampaign = await prisma.campaign.findUnique({
      where: { slug: idOrSlug },
      include: { products: true },
    });

    if (!originalCampaign) {
      originalCampaign = await prisma.campaign.findUnique({
        where: { id: idOrSlug },
        include: { products: true },
      });
    }

    if (!originalCampaign) {
      throw new AppError(404, "Campaign not found");
    }

    // Generate unique slug for new campaign
    const newSlug = await generateUniqueSlug(data.name);

    // Criar a nova campanha e seus produtos em uma transação
    const newCampaign = await prisma.$transaction(async (tx) => {
      // Upgrade user to CAMPAIGN_CREATOR if they're currently a CUSTOMER
      if (req.user!.role === "CUSTOMER") {
        await tx.user.update({
          where: { id: req.user!.id },
          data: { role: "CAMPAIGN_CREATOR" },
        });
      }

      // Criar a nova campanha com status ACTIVE e sem deadline
      const campaign = await tx.campaign.create({
        data: {
          name: data.name,
          slug: newSlug,
          description: data.description || originalCampaign!.description,
          status: "ACTIVE",
          shippingCost: 0, // Nova campanha começa com frete zerado
          creatorId: req.user!.id,
        },
      });

      // Clonar todos os produtos da campanha original
      if (originalCampaign!.products.length > 0) {
        await tx.product.createMany({
          data: originalCampaign!.products.map((product) => ({
            campaignId: campaign.id,
            name: product.name,
            price: product.price,
            weight: product.weight,
          })),
        });
      }

      return campaign;
    });

    // Buscar a campanha criada com os produtos para retornar
    const campaignWithProducts = await prisma.campaign.findUnique({
      where: { id: newCampaign.id },
      include: {
        products: true,
        orders: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
        _count: { select: { products: true, orders: true } },
      },
    });

    res.status(201).json(campaignWithProducts);
  })
);

// PATCH /api/campaigns/:idOrSlug - Atualiza um grupo
router.patch(
  "/:idOrSlug",
  requireAuth,
  requireCampaignOwnership,
  asyncHandler(async (req, res) => {
    const { idOrSlug } = req.params;

    const data = updateCampaignSchema.parse(req.body);

    // Find campaign by slug or ID to get the actual ID
    let campaign = await prisma.campaign.findUnique({
      where: { slug: idOrSlug },
      select: { id: true },
    });

    if (!campaign) {
      campaign = await prisma.campaign.findUnique({
        where: { id: idOrSlug },
        select: { id: true },
      });
    }

    if (!campaign) {
      throw new AppError(404, "Campaign not found");
    }

    const campaignId = campaign.id;

    // Convert deadline string to Date object for Prisma
    const prismaData: any = { ...data };
    if (data.deadline !== undefined) {
      prismaData.deadline = data.deadline ? new Date(data.deadline) : null;
    }

    // If name is being updated, regenerate slug
    if (data.name) {
      prismaData.slug = await generateUniqueSlug(data.name, campaignId);
    }

    const updatedCampaign = await prisma.campaign.update({
      where: { id: campaignId },
      data: prismaData,
    });

    // Se o shippingCost foi atualizado, redistribuir frete para todos os pedidos
    if (data.shippingCost !== undefined) {
      await ShippingCalculator.distributeShipping(campaignId);
    }

    res.json(updatedCampaign);
  })
);

// PATCH /api/campaigns/:idOrSlug/status - Atualiza apenas o status do grupo
router.patch(
  "/:idOrSlug/status",
  requireAuth,
  requireCampaignOwnership,
  asyncHandler(async (req, res) => {
    const { idOrSlug } = req.params;
    const { status } = updateStatusSchema.parse(req.body);

    // Find campaign by slug or ID to get the actual ID
    let campaign = await prisma.campaign.findUnique({
      where: { slug: idOrSlug },
      select: { id: true },
    });

    if (!campaign) {
      campaign = await prisma.campaign.findUnique({
        where: { id: idOrSlug },
        select: { id: true },
      });
    }

    if (!campaign) {
      throw new AppError(404, "Campaign not found");
    }

    const updatedCampaign = await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status },
    });

    res.json(updatedCampaign);
  })
);

// DELETE /api/campaigns/:idOrSlug - Remove um grupo
router.delete(
  "/:idOrSlug",
  requireAuth,
  requireCampaignOwnership,
  asyncHandler(async (req, res) => {
    const { idOrSlug } = req.params;

    // Find campaign by slug or ID to get the actual ID
    let campaign = await prisma.campaign.findUnique({
      where: { slug: idOrSlug },
      select: { id: true },
    });

    if (!campaign) {
      campaign = await prisma.campaign.findUnique({
        where: { id: idOrSlug },
        select: { id: true },
      });
    }

    if (!campaign) {
      throw new AppError(404, "Campaign not found");
    }

    await prisma.campaign.delete({
      where: { id: campaign.id },
    });

    res.status(204).send();
  })
);

// GET /api/campaigns/:idOrSlug/supplier-invoice - Gera fatura para fornecedor em PDF
router.get(
  "/:idOrSlug/supplier-invoice",
  requireAuth,
  requireCampaignOwnership,
  asyncHandler(async (req, res) => {
    const { idOrSlug } = req.params;

    // Find campaign by slug or ID to get the actual ID
    let campaign = await prisma.campaign.findUnique({
      where: { slug: idOrSlug },
      select: { id: true, name: true },
    });

    if (!campaign) {
      campaign = await prisma.campaign.findUnique({
        where: { id: idOrSlug },
        select: { id: true, name: true },
      });
    }

    if (!campaign) {
      throw new AppError(404, "Campaign not found");
    }

    const pdfBuffer = await InvoiceGenerator.generateSupplierInvoice(campaign.id);

    const filename = `fatura-fornecedor-${
      campaign.name.replace(/[^a-z0-9]/gi, "-").toLowerCase() || campaign.id
    }.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  })
);

// POST /api/campaigns/:idOrSlug/image - Upload de imagem da campanha
router.post(
  "/:idOrSlug/image",
  requireAuth,
  requireCampaignOwnership,
  asyncHandler(async (req, res) => {
    uploadCampaignImage(req, res, async (err) => {
      if (err) {
        throw new AppError(400, err.message || "Erro ao fazer upload da imagem");
      }

      if (!req.file) {
        throw new AppError(400, "Nenhuma imagem foi enviada");
      }

      const { idOrSlug } = req.params;

      // Find campaign by slug or ID
      let campaign = await prisma.campaign.findUnique({
        where: { slug: idOrSlug },
        select: { id: true, imageKey: true, imageStorageType: true },
      });

      if (!campaign) {
        campaign = await prisma.campaign.findUnique({
          where: { id: idOrSlug },
          select: { id: true, imageKey: true, imageStorageType: true },
        });
      }

      if (!campaign) {
        throw new AppError(404, "Campaign not found");
      }

      // Upload new image
      const uploadResult = await ImageUploadService.uploadImage(req.file, "campaigns");

      // Delete old image if exists
      if (campaign.imageKey && campaign.imageStorageType) {
        await ImageUploadService.deleteImage(campaign.imageKey, campaign.imageStorageType);
      }

      // Update campaign with new image
      const updatedCampaign = await prisma.campaign.update({
        where: { id: campaign.id },
        data: {
          imageUrl: uploadResult.imageUrl,
          imageKey: uploadResult.imageKey,
          imageStorageType: uploadResult.storageType,
        },
      });

      res.json({
        message: "Imagem enviada com sucesso",
        imageUrl: updatedCampaign.imageUrl,
        storageType: uploadResult.storageType,
      });
    });
  })
);

// DELETE /api/campaigns/:idOrSlug/image - Remove imagem da campanha
router.delete(
  "/:idOrSlug/image",
  requireAuth,
  requireCampaignOwnership,
  asyncHandler(async (req, res) => {
    const { idOrSlug } = req.params;

    // Find campaign by slug or ID
    let campaign = await prisma.campaign.findUnique({
      where: { slug: idOrSlug },
      select: { id: true, imageKey: true, imageStorageType: true },
    });

    if (!campaign) {
      campaign = await prisma.campaign.findUnique({
        where: { id: idOrSlug },
        select: { id: true, imageKey: true, imageStorageType: true },
      });
    }

    if (!campaign) {
      throw new AppError(404, "Campaign not found");
    }

    if (!campaign.imageKey || !campaign.imageStorageType) {
      throw new AppError(400, "Campanha não possui imagem");
    }

    // Delete image from storage
    await ImageUploadService.deleteImage(campaign.imageKey, campaign.imageStorageType);

    // Update campaign to remove image
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        imageUrl: null,
        imageKey: null,
        imageStorageType: null,
      },
    });

    res.json({ message: "Imagem removida com sucesso" });
  })
);

export default router;
