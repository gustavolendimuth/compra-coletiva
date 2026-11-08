import express from "express";
import fs from "fs";
import os from "os";
import path from "path";
import request from "supertest";
import { HTML_BYTES, PNG_BYTES } from "../../__tests__/fileFixtures";

// ── Mocks ───────────────────────────────────────────────────────────────────

const mockPrisma = {
  user: { findUnique: jest.fn(), update: jest.fn() },
  campaign: { findUnique: jest.fn(), update: jest.fn() },
  order: { findUnique: jest.fn(), update: jest.fn() },
};

jest.mock("@prisma/client", () => ({
  ...jest.requireActual("@prisma/client"),
  PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
}));
jest.mock("../../index", () => ({ prisma: mockPrisma }));

jest.mock("../../services/socketService", () => ({
  emitOrderCreated: jest.fn(),
  emitOrderUpdated: jest.fn(),
  emitOrderDeleted: jest.fn(),
  emitOrderStatusChanged: jest.fn(),
}));
jest.mock("../../services/email/emailQueue", () => ({
  queueOrderCreatedEmail: jest.fn(),
  queueEmailVerificationEmail: jest.fn(),
}));
jest.mock("../../services/campaignStatusService", () => ({
  CampaignStatusService: {
    checkAndArchiveCampaign: jest.fn().mockResolvedValue({ changed: false }),
    checkAndUnarchiveCampaign: jest.fn().mockResolvedValue({ changed: false }),
  },
}));

const passThrough = (_req: express.Request, _res: express.Response, next: express.NextFunction) => next();
jest.mock("../../middleware/authMiddleware", () => ({
  optionalAuth: passThrough,
  requireAuth: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    req.user = { id: "user-1", role: "CUSTOMER", name: "User" } as Express.User;
    next();
  },
  requireCampaignOwnership: passThrough,
  requireOrderOwnership: passThrough,
  requireOrderOrCampaignOwnership: passThrough,
}));

import profileRouter from "../profile";
import campaignRouter from "../campaigns";
import orderRouter from "../orders";
import { errorHandler } from "../../middleware/errorHandler";

function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/profile", profileRouter);
  app.use("/api/campaigns", campaignRouter);
  app.use("/api/orders", orderRouter);
  app.use(errorHandler);
  return app;
}

function listFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? listFiles(path.join(dir, entry.name)) : [path.join(dir, entry.name)]
  );
}

let publicDir: string;
let privateDir: string;

beforeEach(() => {
  publicDir = fs.mkdtempSync(path.join(os.tmpdir(), "uploads-public-"));
  privateDir = fs.mkdtempSync(path.join(os.tmpdir(), "uploads-private-"));
  process.env.UPLOAD_DIR = publicDir;
  process.env.PRIVATE_UPLOAD_DIR = privateDir;
  ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_S3_BUCKET"].forEach((key) => delete process.env[key]);

  mockPrisma.user.findUnique.mockResolvedValue({ avatarKey: null, avatarStorageType: null });
  mockPrisma.user.update.mockImplementation(({ data }: { data: Record<string, unknown> }) => Promise.resolve({ id: "user-1", ...data }));
  mockPrisma.campaign.findUnique.mockResolvedValue({ id: "c-1", imageKey: null, imageStorageType: null });
  mockPrisma.campaign.update.mockImplementation(({ data }: { data: Record<string, unknown> }) => Promise.resolve({ id: "c-1", ...data }));
  mockPrisma.order.findUnique.mockResolvedValue({
    id: "o-1",
    userId: "user-1",
    campaignId: "c-1",
    paymentProofKey: null,
    paymentProofStorageType: null,
    campaign: { id: "c-1", creatorId: "creator-1" },
  });
  mockPrisma.order.update.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
    Promise.resolve({ id: "o-1", campaignId: "c-1", isPaid: true, isSeparated: false, ...data })
  );
});

afterEach(() => {
  fs.rmSync(publicDir, { recursive: true, force: true });
  fs.rmSync(privateDir, { recursive: true, force: true });
});

describe("upload signature", () => {
  const app = createApp();

  const routes: Array<[string, (bytes: Buffer) => request.Test]> = [
    ["avatar", (bytes) => request(app).post("/api/profile/avatar").attach("avatar", bytes, { filename: "a.png", contentType: "image/png" })],
    ["campaign image", (bytes) => request(app).post("/api/campaigns/c-1/image").attach("image", bytes, { filename: "a.png", contentType: "image/png" })],
    [
      "payment proof",
      (bytes) =>
        request(app)
          .patch("/api/orders/o-1/payment")
          .field("isPaid", "true")
          .attach("paymentProof", bytes, { filename: "a.png", contentType: "image/png" }),
    ],
  ];

  it.each(routes)("rejects non-image bytes: %s returns 400 and writes nothing", async (_name, send) => {
    const res = await send(HTML_BYTES);

    expect(res.status).toBe(400);
    expect(listFiles(publicDir)).toEqual([]);
    expect(listFiles(privateDir)).toEqual([]);
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
    expect(mockPrisma.campaign.update).not.toHaveBeenCalled();
    expect(mockPrisma.order.update).not.toHaveBeenCalled();
  });

  it.each(routes)("accepts real PNG bytes: %s", async (_name, send) => {
    const res = await send(PNG_BYTES);

    expect(res.status).toBe(200);
    expect([...listFiles(publicDir), ...listFiles(privateDir)]).toHaveLength(1);
  });

  it("payment proof url is the endpoint, not a public URL", async () => {
    const res = await routes[2][1](PNG_BYTES);

    expect(res.status).toBe(200);
    expect(mockPrisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ paymentProofUrl: "/api/orders/o-1/payment-proof" }),
      })
    );
    expect(listFiles(publicDir)).toEqual([]);
    expect(listFiles(privateDir)).toHaveLength(1);
  });
});
