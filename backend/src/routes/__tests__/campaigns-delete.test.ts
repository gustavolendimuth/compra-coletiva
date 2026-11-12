import express from "express";
import request from "supertest";

// ── Mocks ───────────────────────────────────────────────────────────────────

let orderCount = 0;
// Contagem, lock e delete só existem no tx: escrita fora da transação quebra
const mockTx = {
  campaign: { delete: jest.fn(() => Promise.resolve({})) },
  order: { count: jest.fn(() => Promise.resolve(orderCount)) },
  $queryRaw: jest.fn((_sql: TemplateStringsArray, ..._values: unknown[]) => Promise.resolve([{ status: "ACTIVE" }])),
};
const mockPrisma = {
  campaign: { findUnique: jest.fn(() => Promise.resolve({ id: "c-1" })) },
  $transaction: jest.fn((fn: (tx: unknown) => Promise<unknown>) => fn(mockTx)),
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
    expect(mockTx.campaign.delete).not.toHaveBeenCalled();
  });

  it("campaign without orders is deleted, counted under the campaign lock", async () => {
    orderCount = 0;

    const res = await request(app).delete("/api/campaigns/c-1");

    expect(res.status).toBe(204);
    expect(mockTx.campaign.delete).toHaveBeenCalledWith({ where: { id: "c-1" } });
    const [[sql, campaignId]] = mockTx.$queryRaw.mock.calls;
    expect([sql.join("?"), campaignId]).toEqual([expect.stringMatching(/FROM campaigns .* FOR NO KEY UPDATE/), "c-1"]);
    expect(mockTx.$queryRaw.mock.invocationCallOrder[0]).toBeLessThan(mockTx.order.count.mock.invocationCallOrder[0]);
  });
});
