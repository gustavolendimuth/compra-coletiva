import express from "express";
import request from "supertest";

// ── Mocks ───────────────────────────────────────────────────────────────────

const mockOrderFindUnique = jest.fn();
const mockOrderMessageCreate = jest.fn();
const mockPrisma = {
  order: { findUnique: mockOrderFindUnique },
  orderMessage: { create: mockOrderMessageCreate },
};

// authMiddleware instancia seu próprio PrismaClient
jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
}));
jest.mock("../../index", () => ({ prisma: mockPrisma }));

jest.mock("../../services/socketService", () => ({ emitMessageSent: jest.fn() }));
jest.mock("../../services/notificationService", () => ({
  NotificationService: { createNotification: jest.fn() },
}));

let currentUser: Express.User | undefined;
jest.mock("../../middleware/authMiddleware", () => ({
  ...jest.requireActual("../../middleware/authMiddleware"),
  requireAuth: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    req.user = currentUser;
    next();
  },
}));

import messageRouter from "../messages";
import { errorHandler } from "../../middleware/errorHandler";

function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/messages", messageRouter);
  app.use(errorHandler);
  return app;
}

const orders: Record<string, { id: string; userId: string; campaignId: string; campaign: { creatorId: string; slug: string; name: string } }> = {
  "order-x": { id: "order-x", userId: "user-a", campaignId: "c-1", campaign: { creatorId: "creator-1", slug: "c", name: "C" } },
  "order-y": { id: "order-y", userId: "user-other", campaignId: "c-2", campaign: { creatorId: "creator-2", slug: "d", name: "D" } },
};

describe("POST /api/messages", () => {
  const app = createApp();

  beforeEach(() => {
    currentUser = { id: "user-a", role: "CUSTOMER", name: "A" } as Express.User;
    mockOrderFindUnique.mockImplementation(({ where }: { where: { id: string } }) =>
      Promise.resolve(orders[where.id] ?? null)
    );
    mockOrderMessageCreate.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
      Promise.resolve({ id: "msg-1", ...data })
    );
  });

  it("returns 403 for body orderId without access and creates nothing", async () => {
    const res = await request(app)
      .post("/api/messages")
      .query({ orderId: "order-x" })
      .send({ orderId: "order-y", message: "oi" });

    expect(res.status).toBe(403);
    expect(mockOrderMessageCreate).not.toHaveBeenCalled();
  });

  it("creates the message when the body orderId is accessible", async () => {
    const res = await request(app)
      .post("/api/messages")
      .query({ orderId: "order-x" })
      .send({ orderId: "order-x", message: "oi" });

    expect(res.status).toBe(201);
    expect(mockOrderMessageCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ orderId: "order-x" }) })
    );
  });
});
