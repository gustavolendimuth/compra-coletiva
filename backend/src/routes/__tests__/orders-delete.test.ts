import express from "express";
import request from "supertest";

// ── Mocks ───────────────────────────────────────────────────────────────────

const mockFindUnique = jest.fn();
const mockDelete = jest.fn();
jest.mock("../../index", () => ({
  prisma: {
    order: {
      findUnique: mockFindUnique,
      delete: mockDelete,
    },
  },
}));

const mockDistributeShipping = jest.fn();
jest.mock("../../services/shippingCalculator", () => ({
  ShippingCalculator: {
    distributeShipping: mockDistributeShipping,
  },
}));

const mockEmitOrderDeleted = jest.fn();
jest.mock("../../services/socketService", () => ({
  emitOrderCreated: jest.fn(),
  emitOrderUpdated: jest.fn(),
  emitOrderDeleted: mockEmitOrderDeleted,
  emitOrderStatusChanged: jest.fn(),
}));

jest.mock("../../services/imageUploadService", () => ({
  ImageUploadService: { deleteImage: jest.fn() },
}));

jest.mock("../../middleware/uploadMiddleware", () => ({
  uploadPaymentProof: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
  handleUploadError: (_err: unknown, _req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
}));

jest.mock("../../services/email/emailQueue", () => ({
  queueOrderCreatedEmail: jest.fn(),
}));

jest.mock("../../services/campaignStatusService", () => ({
  CampaignStatusService: { checkAndUpdateStatus: jest.fn() },
}));

jest.mock("../../services/legalAcceptanceService", () => ({
  LegalAcceptanceService: { checkUserAcceptance: jest.fn() },
}));

// authMiddleware: requireAuth injects req.user from the test-controlled variable;
// requireOrderOwnership allows admins and skips ownership check for simplicity here
let currentUser: Express.User | undefined;
jest.mock("../../middleware/authMiddleware", () => ({
  optionalAuth: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
  requireAuth: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    req.user = currentUser;
    next();
  },
  requireOrderOwnership: (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: "UNAUTHORIZED" });
      return;
    }
    // Admins bypass ownership check
    if (req.user.role === "ADMIN") {
      next();
      return;
    }
    // For non-admins, simulate ownership check inline using the mocked findUnique
    // (the real middleware does a DB call; we keep it simple here)
    next();
  },
  requireOrderOrCampaignOwnership: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
}));

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

const baseUser: Express.User = {
  id: "user-1",
  email: "user@test.com",
  password: null,
  name: "User",
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

const adminUser: Express.User = { ...baseUser, id: "admin-1", role: "ADMIN" };

const makeOrder = (campaignStatus: string, userId = "user-1") => ({
  id: "order-1",
  userId,
  campaignId: "campaign-1",
  campaign: { id: "campaign-1", status: campaignStatus },
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe("DELETE /api/orders/:id", () => {
  const app = createApp();

  beforeEach(() => {
    currentUser = undefined;
    mockFindUnique.mockReset();
    mockDelete.mockReset();
    mockDistributeShipping.mockReset();
    mockEmitOrderDeleted.mockReset();
  });

  it("returns 404 when order does not exist", async () => {
    currentUser = adminUser;
    mockFindUnique.mockResolvedValue(null);

    const res = await request(app).delete("/api/orders/order-1");

    expect(res.status).toBe(404);
  });

  it("allows admin to delete an order from an ACTIVE campaign", async () => {
    currentUser = adminUser;
    mockFindUnique.mockResolvedValue(makeOrder("ACTIVE"));
    mockDelete.mockResolvedValue({});
    mockDistributeShipping.mockResolvedValue(undefined);

    const res = await request(app).delete("/api/orders/order-1");

    expect(res.status).toBe(204);
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: "order-1" } });
    expect(mockDistributeShipping).toHaveBeenCalledWith("campaign-1");
    expect(mockEmitOrderDeleted).toHaveBeenCalledWith("campaign-1", { orderId: "order-1" });
  });

  it("allows admin to delete an order from a CLOSED campaign", async () => {
    currentUser = adminUser;
    mockFindUnique.mockResolvedValue(makeOrder("CLOSED"));
    mockDelete.mockResolvedValue({});
    mockDistributeShipping.mockResolvedValue(undefined);

    const res = await request(app).delete("/api/orders/order-1");

    expect(res.status).toBe(204);
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: "order-1" } });
  });

  it("allows admin to delete an order from a SENT campaign", async () => {
    currentUser = adminUser;
    mockFindUnique.mockResolvedValue(makeOrder("SENT"));
    mockDelete.mockResolvedValue({});
    mockDistributeShipping.mockResolvedValue(undefined);

    const res = await request(app).delete("/api/orders/order-1");

    expect(res.status).toBe(204);
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: "order-1" } });
  });

  it("blocks regular user from deleting an order from a CLOSED campaign", async () => {
    currentUser = { ...baseUser, id: "user-1" };
    mockFindUnique.mockResolvedValue(makeOrder("CLOSED", "user-1"));

    const res = await request(app).delete("/api/orders/order-1");

    expect(res.status).toBe(400);
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("blocks regular user from deleting an order from a SENT campaign", async () => {
    currentUser = { ...baseUser, id: "user-1" };
    mockFindUnique.mockResolvedValue(makeOrder("SENT", "user-1"));

    const res = await request(app).delete("/api/orders/order-1");

    expect(res.status).toBe(400);
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("allows regular user to delete their own order from an ACTIVE campaign", async () => {
    currentUser = { ...baseUser, id: "user-1" };
    mockFindUnique.mockResolvedValue(makeOrder("ACTIVE", "user-1"));
    mockDelete.mockResolvedValue({});
    mockDistributeShipping.mockResolvedValue(undefined);

    const res = await request(app).delete("/api/orders/order-1");

    expect(res.status).toBe(204);
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: "order-1" } });
  });
});
