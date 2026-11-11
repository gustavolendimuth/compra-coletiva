import express from "express";
import request from "supertest";

// ── Mocks ───────────────────────────────────────────────────────────────────

const mockPrisma = {
  campaign: { findUnique: jest.fn(), findMany: jest.fn(), count: jest.fn() },
  order: { findMany: jest.fn() },
  $queryRaw: jest.fn(),
};
jest.mock("../../index", () => ({ prisma: mockPrisma }));

let currentUser: Express.User | undefined;
const passThrough = (_req: express.Request, _res: express.Response, next: express.NextFunction) => next();
jest.mock("../../middleware/authMiddleware", () => ({
  optionalAuth: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    req.user = currentUser;
    next();
  },
  requireAuth: passThrough,
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

const PIX = { pixKey: "12345678900", pixName: "Fulano de Tal", pixType: "CPF" };

const makeCampaign = (overrides: Record<string, unknown> = {}) => ({
  id: "c-1",
  slug: "camp",
  name: "Campanha",
  creatorId: "creator-1",
  status: "ACTIVE",
  paymentReleased: true,
  ...PIX,
  products: [],
  _count: { products: 0, orders: 1 },
  ...overrides,
});

type Scenario = {
  name: string;
  user?: { id: string; role: string };
  hasOrder: boolean;
  campaign: Record<string, unknown>;
  seesPix: boolean;
};

const scenarios: Scenario[] = [
  { name: "anonymous", hasOrder: false, campaign: {}, seesPix: false },
  { name: "logged user without order", user: { id: "u-1", role: "CUSTOMER" }, hasOrder: false, campaign: {}, seesPix: false },
  { name: "buyer with order, payment not released", user: { id: "u-1", role: "CUSTOMER" }, hasOrder: true, campaign: { paymentReleased: false }, seesPix: false },
  { name: "buyer with order, payment released", user: { id: "u-1", role: "CUSTOMER" }, hasOrder: true, campaign: {}, seesPix: true },
  { name: "buyer with order, released but ARCHIVED", user: { id: "u-1", role: "CUSTOMER" }, hasOrder: true, campaign: { status: "ARCHIVED" }, seesPix: false },
  { name: "creator", user: { id: "creator-1", role: "CAMPAIGN_CREATOR" }, hasOrder: false, campaign: { paymentReleased: false }, seesPix: true },
  { name: "admin", user: { id: "admin-1", role: "ADMIN" }, hasOrder: false, campaign: { paymentReleased: false, status: "ARCHIVED" }, seesPix: true },
];

function setup(scenario: Scenario) {
  currentUser = scenario.user as Express.User | undefined;
  const campaign = makeCampaign(scenario.campaign);
  mockPrisma.campaign.findUnique.mockImplementation(({ where }: { where: { slug?: string; id?: string } }) =>
    Promise.resolve(where.slug === "camp" || where.id === "c-1" ? campaign : null)
  );
  mockPrisma.campaign.findMany.mockResolvedValue([campaign]);
  mockPrisma.campaign.count.mockResolvedValue(1);
  const ownOrders = scenario.hasOrder && scenario.user ? [{ campaignId: "c-1" }] : [];
  mockPrisma.order.findMany.mockImplementation(({ where }: { where: { userId?: string } }) =>
    Promise.resolve(where.userId === scenario.user?.id ? ownOrders : [])
  );
}

const byName = (...names: string[]) => scenarios.filter((s) => names.includes(s.name)).map((s) => [s.name, s] as const);

function expectPix(body: Record<string, unknown>, seesPix: boolean) {
  for (const key of ["pixKey", "pixName", "pixType"] as const) {
    if (seesPix) {
      expect(body[key]).toBe(PIX[key]);
    } else {
      expect(body).not.toHaveProperty(key);
    }
  }
}

describe("GET /api/campaigns pix visibility", () => {
  const app = createApp();

  beforeEach(() => {
    mockPrisma.$queryRaw.mockReset();
  });

  it.each(scenarios.map((s) => [s.name, s] as const))("pix visibility on detail: %s", async (_name, scenario) => {
    setup(scenario);

    const res = await request(app).get("/api/campaigns/camp");

    expect(res.status).toBe(200);
    expectPix(res.body, scenario.seesPix);
  });

  it.each(byName("anonymous", "buyer with order, payment released"))("pix visibility on list: %s", async (_name, scenario) => {
    setup(scenario);

    const res = await request(app).get("/api/campaigns");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expectPix(res.body.data[0], scenario.seesPix);
  });

  it.each(byName("anonymous", "creator"))("hasPixConfigured on detail and list: %s", async (_name, scenario) => {
    setup(scenario);

    const detail = await request(app).get("/api/campaigns/camp");
    const list = await request(app).get("/api/campaigns");

    expect(detail.body.hasPixConfigured).toBe(true);
    expect(list.body.data[0].hasPixConfigured).toBe(true);
  });

  it("hasPixConfigured is false when the campaign has no PIX", async () => {
    setup({ name: "anonymous", hasOrder: false, campaign: { pixKey: null, pixName: null, pixType: null }, seesPix: false });

    const detail = await request(app).get("/api/campaigns/camp");

    expect(detail.body.hasPixConfigured).toBe(false);
  });

  it.each([
    ["search without results", [[], [{ id: "c-1" }]]],
    ["search with few results", [[{ id: "c-1" }], [{ id: "c-2" }]]],
  ])("pix visibility on suggestions: anonymous, %s", async (_name, rawResults) => {
    setup(scenarios[0]);
    rawResults.forEach((rows) => mockPrisma.$queryRaw.mockResolvedValueOnce(rows));

    const res = await request(app).get("/api/campaigns").query({ search: "camp" });

    expect(res.status).toBe(200);
    expect(res.body.suggestions).toHaveLength(1);
    expectPix(res.body.suggestions[0], false);
  });
});
