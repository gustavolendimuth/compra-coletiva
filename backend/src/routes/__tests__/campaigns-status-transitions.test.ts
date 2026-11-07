import express from "express";
import request from "supertest";

// ── Mocks ───────────────────────────────────────────────────────────────────

let currentStatus = "ACTIVE";
const mockPrisma = {
  campaign: {
    findUnique: jest.fn(() => Promise.resolve({ id: "c-1", slug: "camp", status: currentStatus })),
    update: jest.fn(({ data }: { data: Record<string, unknown> }) => Promise.resolve({ id: "c-1", ...data })),
    updateMany: jest.fn(() => Promise.resolve({ count: 1 })),
  },
};
jest.mock("../../index", () => ({ prisma: mockPrisma }));

jest.mock("../../services/paymentReleaseService", () => ({
  PaymentReleaseService: {
    checkAndReleaseForCampaign: jest.fn(),
    mapPixVisibleAtStatusToTrigger: jest.fn(),
  },
}));
jest.mock("../../services/shippingCalculator", () => ({
  ShippingCalculator: { distributeShipping: jest.fn() },
}));

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

const STATUSES = ["ACTIVE", "CLOSED", "SENT", "ARCHIVED"];
const ALLOWED = new Set(["ACTIVE→CLOSED", "CLOSED→ACTIVE", "CLOSED→SENT", "SENT→CLOSED"]);

const routes: Array<[string, (app: express.Express, to: string) => request.Test]> = [
  ["PATCH /:idOrSlug/status", (app, to) => request(app).patch("/api/campaigns/camp/status").send({ status: to })],
  ["PATCH /:idOrSlug", (app, to) => request(app).patch("/api/campaigns/camp").send({ status: to })],
];

const cases = routes.flatMap(([route, send]) =>
  STATUSES.flatMap((from) =>
    STATUSES.map((to) => [route, from, to, ALLOWED.has(`${from}→${to}`) ? 200 : 400, send] as const)
  )
);

// Escrita de status: update ou updateMany com status no data
function statusWrites(): unknown[] {
  return [...mockPrisma.campaign.update.mock.calls, ...mockPrisma.campaign.updateMany.mock.calls]
    .map(([args]) => (args as { data?: { status?: string } }).data?.status)
    .filter((status) => status !== undefined);
}

describe("campaign status transitions", () => {
  const app = createApp();

  it.each(cases)("status transitions: %s %s → %s answers %s", async (_route, from, to, expected, send) => {
    currentStatus = from;

    const res = await send(app, to);

    expect(res.status).toBe(expected);
    if (expected === 200) {
      expect(statusWrites()).toEqual([to]);
    } else {
      expect(res.body).toEqual({ status: "error", message: expect.any(String) });
      expect(statusWrites()).toEqual([]);
    }
  });
});
