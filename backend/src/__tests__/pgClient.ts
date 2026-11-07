import { PrismaClient } from '@prisma/client';

/**
 * Cliente Prisma para provas *.pg.test.ts, apontado para o Postgres descartável.
 */
export function createPgClient(): PrismaClient {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    throw new Error('TEST_DATABASE_URL is required for *.pg.test.ts (see jest.pg.config.js)');
  }
  return new PrismaClient({ datasourceUrl: url });
}

/**
 * Limpa as tabelas usadas pelas provas de pedido.
 */
export async function resetOrderTables(db: PrismaClient): Promise<void> {
  await db.$executeRawUnsafe(
    'TRUNCATE TABLE order_items, orders, products, campaigns, users RESTART IDENTITY CASCADE'
  );
}

type SeedOrder = { userId?: string; isPaid?: boolean; items: Array<{ productIndex: number; quantity: number }> };

/**
 * Cria criador, campanha, produtos e pedidos (com totais iniciais "antigos" conhecidos).
 */
export async function seedCampaign(
  db: PrismaClient,
  options: {
    shippingCost?: number;
    status?: 'ACTIVE' | 'CLOSED' | 'SENT' | 'ARCHIVED';
    deadline?: Date | null;
    products?: Array<{ price: number; weight: number }>;
    orders?: SeedOrder[];
    tag?: string;
  } = {}
) {
  const tag = options.tag ?? Math.random().toString(36).slice(2, 8);
  const creator = await db.user.create({ data: { email: `creator-${tag}@test.com`, name: 'Creator' } });
  const campaign = await db.campaign.create({
    data: {
      slug: `campaign-${tag}`,
      name: `Campaign ${tag}`,
      creatorId: creator.id,
      status: options.status ?? 'ACTIVE',
      deadline: options.deadline ?? null,
      shippingCost: options.shippingCost ?? 0,
    },
  });
  const products = [];
  for (const [i, p] of (options.products ?? []).entries()) {
    products.push(
      await db.product.create({ data: { campaignId: campaign.id, name: `P${i}`, price: p.price, weight: p.weight } })
    );
  }
  const orders = [];
  for (const [i, o] of (options.orders ?? []).entries()) {
    const userId =
      o.userId ?? (await db.user.create({ data: { email: `buyer-${tag}-${i}@test.com`, name: `Buyer ${i}` } })).id;
    orders.push(
      await db.order.create({
        data: {
          campaignId: campaign.id,
          userId,
          isPaid: o.isPaid ?? false,
          subtotal: 999,
          shippingFee: 999,
          total: 1998,
          items: {
            create: o.items.map((item) => ({
              productId: products[item.productIndex].id,
              quantity: item.quantity,
              unitPrice: products[item.productIndex].price,
              subtotal: products[item.productIndex].price * item.quantity,
            })),
          },
        },
      })
    );
  }
  return { creator, campaign, products, orders };
}
