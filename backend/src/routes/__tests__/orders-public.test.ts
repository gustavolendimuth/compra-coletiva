import express from "express";
import request from "supertest";
import { generatePublicAlias } from "../../utils/publicAlias";

// ── Mocks ───────────────────────────────────────────────────────────────────

// Mock prisma (must come before importing the router)
const mockFindMany = jest.fn();
jest.mock("../../index", () => ({
  prisma: {
    order: { findMany: mockFindMany },
  },
}));

// Mock authMiddleware — optionalAuth sets req.user based on a test-controlled flag
let authenticatedUser: Express.User | undefined;
jest.mock("../../middleware/authMiddleware", () => ({
  optionalAuth: (
    req: express.Request,
    _res: express.Response,
    next: express.NextFunction
  ) => {
    req.user = authenticatedUser;
    next();
  },
  requireAuth: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
  requireOrderOwnership: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
  requireOrderOrCampaignOwnership: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
}));

// Import the router AFTER mocks are set up
import orderRouter from "../orders";
import { errorHandler } from "../../middleware/errorHandler";

// ── App setup ───────────────────────────────────────────────────────────────

function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/orders", orderRouter);
  app.use(errorHandler);
  return app;
}

// ── Test data ───────────────────────────────────────────────────────────────

const CAMPAIGN_ID = "campaign-123";

const fakeUser: Express.User = {
  id: "user-auth-1",
  email: "auth@test.com",
  password: null,
  name: "Auth User",
  phone: null,
  phoneCompleted: false,
  role: "CUSTOMER",
  googleId: null,
  isLegacyUser: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  avatarUrl: null,
  avatarKey: null,
  avatarStorageType: null,
  pendingEmail: null,
  pendingEmailToken: null,
  pendingEmailExpires: null,
  deletedAt: null,
  deletedReason: null,
  legalAcceptanceRequired: false,
  termsAcceptedAt: null,
  termsAcceptedVersion: null,
  privacyAcceptedAt: null,
  privacyAcceptedVersion: null,
  salesDisclaimerAcceptedAt: null,
  salesDisclaimerAcceptedVersion: null,
  hideNameInCampaigns: false,
  addressCompleted: false,
  defaultZipCode: null,
  defaultAddress: null,
  defaultAddressNumber: null,
  defaultNeighborhood: null,
  defaultCity: null,
  defaultState: null,
  defaultLatitude: null,
  defaultLongitude: null,
  messageCount: 0,
  answeredCount: 0,
  spamScore: 0,
  lastMessageAt: null,
  isBanned: false,
};

const sampleOrders = [
  {
    id: "order-1",
    userId: "user-1",
    isPaid: true,
    subtotal: 100,
    shippingFee: 10,
    total: 110,
    createdAt: new Date("2025-01-01T10:00:00Z"),
    items: [
      {
        quantity: 2,
        unitPrice: 30,
        subtotal: 60,
        product: { name: "Product A" },
      },
      {
        quantity: 1,
        unitPrice: 40,
        subtotal: 40,
        product: { name: "Product B" },
      },
    ],
    customer: { name: "Maria Clara de Souza", hideNameInCampaigns: false },
  },
  {
    id: "order-2",
    userId: "user-2",
    isPaid: false,
    subtotal: 200,
    shippingFee: 20,
    total: 220,
    createdAt: new Date("2025-01-02T10:00:00Z"),
    items: [
      {
        quantity: 5,
        unitPrice: 40,
        subtotal: 200,
        product: { name: "Product C" },
      },
    ],
    customer: { name: "Joao Pedro da Silva", hideNameInCampaigns: true },
  },
];

// ── Tests ───────────────────────────────────────────────────────────────────

describe("GET /api/orders/public", () => {
  const app = createApp();

  beforeEach(() => {
    authenticatedUser = undefined;
    mockFindMany.mockReset();
  });

  // 1. Returns 400 when campaignId is missing
  it("returns 400 when campaignId is missing", async () => {
    const res = await request(app).get("/api/orders/public");

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      status: "error",
      message: "campaignId is required",
    });
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  // 2. Unauthenticated response excludes id, userId, items
  it("unauthenticated response excludes id, userId, and items", async () => {
    mockFindMany.mockResolvedValue(sampleOrders);

    const res = await request(app)
      .get("/api/orders/public")
      .query({ campaignId: CAMPAIGN_ID });

    expect(res.status).toBe(200);
    expect(res.body.orders).toHaveLength(2);

    for (const order of res.body.orders) {
      expect(order).not.toHaveProperty("id");
      expect(order).not.toHaveProperty("userId");
      expect(order).not.toHaveProperty("items");
      expect(order).toHaveProperty("alias");
      expect(order).toHaveProperty("isPaid");
      expect(order).toHaveProperty("subtotal");
      expect(order).toHaveProperty("shippingFee");
      expect(order).toHaveProperty("total");
      expect(order).toHaveProperty("itemsCount");
      expect(order).toHaveProperty("quantityTotal");
      expect(order).toHaveProperty("createdAt");
    }
  });

  // 3. Authenticated response includes id, userId, items
  it("authenticated response includes id, userId, and items", async () => {
    authenticatedUser = fakeUser;
    mockFindMany.mockResolvedValue(sampleOrders);

    const res = await request(app)
      .get("/api/orders/public")
      .query({ campaignId: CAMPAIGN_ID });

    expect(res.status).toBe(200);
    expect(res.body.orders).toHaveLength(2);

    const firstOrder = res.body.orders[0];
    expect(firstOrder).toHaveProperty("id", "order-1");
    expect(firstOrder).toHaveProperty("userId", "user-1");
    expect(firstOrder).toHaveProperty("items");
    expect(firstOrder.items).toHaveLength(2);
    expect(firstOrder.items[0]).toEqual({
      quantity: 2,
      unitPrice: 30,
      subtotal: 60,
      product: { name: "Product A" },
    });

    const secondOrder = res.body.orders[1];
    expect(secondOrder).toHaveProperty("id", "order-2");
    expect(secondOrder).toHaveProperty("userId", "user-2");
    expect(secondOrder.items).toHaveLength(1);
  });

  // 4. Name masking: shows first+last name when hideNameInCampaigns is false
  it("shows first and last name when hideNameInCampaigns is false", async () => {
    mockFindMany.mockResolvedValue([sampleOrders[0]]);

    const res = await request(app)
      .get("/api/orders/public")
      .query({ campaignId: CAMPAIGN_ID });

    expect(res.status).toBe(200);
    expect(res.body.orders[0].alias).toBe("Maria Souza");
  });

  // 5. Name masking: uses alias when hideNameInCampaigns is true
  it("uses generated alias when hideNameInCampaigns is true", async () => {
    mockFindMany.mockResolvedValue([sampleOrders[1]]);

    const res = await request(app)
      .get("/api/orders/public")
      .query({ campaignId: CAMPAIGN_ID });

    const expectedAlias = generatePublicAlias("user-2", CAMPAIGN_ID);
    expect(res.status).toBe(200);
    expect(res.body.orders[0].alias).toBe(expectedAlias);
  });

  // 6. Totals aggregation is correct
  it("calculates totals correctly", async () => {
    mockFindMany.mockResolvedValue(sampleOrders);

    const res = await request(app)
      .get("/api/orders/public")
      .query({ campaignId: CAMPAIGN_ID });

    expect(res.status).toBe(200);
    expect(res.body.totals).toEqual({
      orders: 2,
      totalWithShipping: 330,       // 110 + 220
      totalWithoutShipping: 300,    // 100 + 200
      totalShipping: 30,            // 10 + 20
      totalItems: 3,                // 2 items + 1 item
      totalQuantity: 8,             // (2 + 1) + 5
      paidTotal: 110,               // order-1 is paid
      unpaidTotal: 220,             // order-2 is unpaid
    });
  });

  // 7. Empty campaign returns empty orders and zero totals
  it("returns empty orders and zero totals for a campaign with no orders", async () => {
    mockFindMany.mockResolvedValue([]);

    const res = await request(app)
      .get("/api/orders/public")
      .query({ campaignId: CAMPAIGN_ID });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      campaignId: CAMPAIGN_ID,
      totals: {
        orders: 0,
        totalWithShipping: 0,
        totalWithoutShipping: 0,
        totalShipping: 0,
        totalItems: 0,
        totalQuantity: 0,
        paidTotal: 0,
        unpaidTotal: 0,
      },
      orders: [],
    });
  });
});
