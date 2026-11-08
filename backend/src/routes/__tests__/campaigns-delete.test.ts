import express from "express";
import request from "supertest";

// ── Mocks ───────────────────────────────────────────────────────────────────

let orderCount = 0;
const mockPrisma: Record<string, any> = {
  campaign: {
    findUnique: jest.fn(() => Promise.resolve({ id: "c-1", slug: "camp", status: "ACTIVE", _count: { orders: orderCount } })),
    delete: jest.fn(() => Promise.resolve({})),
    deleteMany: jest.fn(() => Promise.resolve({ count: 1 })),
  },
  order: { count: jest.fn(() => Promise.resolve(orderCount)) },
  $queryRaw: jest.fn(() => Promise.resolve([{ status: "ACTIVE" }])),
  $transaction: jest.fn((fn: (tx: unknown) => Promise<unknown>) => fn(mockPrisma)),
};
jest.mock("../../index", () => ({ prisma: mockPrisma }));

const passThrough = (_req: express.Request, _res: express.Response, next: express.NextFunction) => next();
jest.mock("../../middleware/authMiddleware", () => ({
  optionalAuth: passThrough,
  requireAuth: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    req.user = { id: "creator-1", role: "CAMPAIGN_CREATOR" } as Express.User;
    next();
  },
  requireCampaignOwnership: passThrough,
}));

import campaignRouter from "../campaigns";
import { errorHandler } from "../../middleware/errorHandler";

function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/campaigns", campaignRouter);
  app.use(errorHandler);
  return app;
}

describe("DELETE /api/campaigns/:idOrSlug", () => {
  const app = createApp();

  it("campaign with orders → 400 with the admin message and nothing deleted", async () => {
    orderCount = 1;

    const res = await request(app).delete("/api/campaigns/c-1");

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      status: "error",
      message: "Não é possível deletar uma campanha com pedidos. Arquive-a em vez disso.",
    });
    expect(mockPrisma.campaign.delete).not.toHaveBeenCalled();
    expect(mockPrisma.campaign.deleteMany).not.toHaveBeenCalled();
  });

  it("campaign without orders is deleted (control)", async () => {
    orderCount = 0;

    const res = await request(app).delete("/api/campaigns/c-1");

    expect(res.status).toBe(204);
  });
});
