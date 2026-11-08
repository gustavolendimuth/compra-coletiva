import express from "express";
import request from "supertest";
import { Prisma } from "@prisma/client";
import { createPgClient, resetOrderTables, seedCampaign } from "../../__tests__/pgClient";

const db = createPgClient();
jest.mock("../../index", () => ({ prisma: db }));

jest.mock("../../services/socketService", () => ({
  emitOrderCreated: jest.fn(),
  emitOrderUpdated: jest.fn(),
  emitOrderDeleted: jest.fn(),
  emitOrderStatusChanged: jest.fn(),
}));
jest.mock("../../services/email/emailQueue", () => ({ queueOrderCreatedEmail: jest.fn() }));
jest.mock("../../services/legalAcceptanceService", () => ({
  LegalAcceptanceService: { hasAcceptedCurrentSalesDisclaimer: () => true },
}));

// requireAuth falso: o usuário vem do header x-test-user
jest.mock("../../middleware/authMiddleware", () => {
  const pass = (_req: unknown, _res: unknown, next: () => void) => next();
  return {
    optionalAuth: pass,
    requireOrderOwnership: pass,
    requireOrderOrCampaignOwnership: pass,
    requireAuth: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
      req.user = { id: req.header("x-test-user"), role: "CUSTOMER" } as Express.User;
      next();
    },
  };
});

import orderRouter from "../orders";
import { errorHandler } from "../../middleware/errorHandler";

function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/orders", orderRouter);
  app.use(errorHandler);
  return app;
}

afterAll(() => db.$disconnect());
beforeEach(() => resetOrderTables(db));

describe("POST /api/orders concurrency (Postgres)", () => {
  const app = createApp();

  it("parallel create keeps one order for (campaignId, userId)", async () => {
    const { campaign, products } = await seedCampaign(db, { shippingCost: 10, products: [{ price: 10, weight: 1 }] });
    const buyer = await db.user.create({ data: { email: "buyer@test.com", name: "Buyer" } });

    const send = (quantity: number) =>
      request(app)
        .post("/api/orders")
        .set("x-test-user", buyer.id)
        .send({ campaignId: campaign.id, items: [{ productId: products[0].id, quantity }] });

    const responses = await Promise.all([send(1), send(2), send(3), send(4)]);

    responses.forEach((res) => expect([200, 201, 409]).toContain(res.status));
    expect(responses.some((res) => res.status === 201)).toBe(true);
    expect(await db.order.count({ where: { campaignId: campaign.id, userId: buyer.id } })).toBe(1);
  });

  it("unique campaign user: the database rejects a second order for the pair", async () => {
    const { campaign } = await seedCampaign(db);
    const buyer = await db.user.create({ data: { email: "dup@test.com", name: "Dup" } });

    await db.order.create({ data: { campaignId: campaign.id, userId: buyer.id } });

    await expect(db.order.create({ data: { campaignId: campaign.id, userId: buyer.id } })).rejects.toMatchObject({
      code: "P2002",
    } as Partial<Prisma.PrismaClientKnownRequestError>);
  });

  it("closed during request: campaign closed after the first read → 400, no order or item written", async () => {
    const { campaign, products } = await seedCampaign(db, { products: [{ price: 10, weight: 1 }] });
    const buyer = await db.user.create({ data: { email: "late@test.com", name: "Late" } });

    // Simula o scheduler fechando a campanha logo depois da leitura inicial da rota
    const realFindUnique = db.campaign.findUnique.bind(db.campaign);
    const spy = jest.spyOn(db.campaign, "findUnique").mockImplementationOnce((async (args: Prisma.CampaignFindUniqueArgs) => {
      const result = await realFindUnique(args);
      await db.$executeRaw`UPDATE campaigns SET status = 'CLOSED' WHERE id = ${campaign.id}`;
      return result;
    }) as unknown as typeof db.campaign.findUnique);

    const res = await request(app)
      .post("/api/orders")
      .set("x-test-user", buyer.id)
      .send({ campaignId: campaign.id, items: [{ productId: products[0].id, quantity: 1 }] });
    spy.mockRestore();

    expect(res.status).toBe(400);
    expect(await db.order.count({ where: { campaignId: campaign.id } })).toBe(0);
    expect(await db.orderItem.count()).toBe(0);
  });
});
