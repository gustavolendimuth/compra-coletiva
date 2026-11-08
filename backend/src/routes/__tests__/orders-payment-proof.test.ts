import express from "express";
import fs from "fs";
import os from "os";
import path from "path";
import request from "supertest";
import { PNG_BYTES } from "../../__tests__/fileFixtures";

// ── Mocks ───────────────────────────────────────────────────────────────────

const mockOrderFindUnique = jest.fn();
const mockPrisma = { order: { findUnique: mockOrderFindUnique } };

// requireOrderOrCampaignOwnership real usa o PrismaClient próprio do authMiddleware
jest.mock("@prisma/client", () => ({
  ...jest.requireActual("@prisma/client"),
  PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
}));
jest.mock("../../index", () => ({ prisma: mockPrisma }));

const mockGetSignedUrl = jest.fn();
jest.mock("@aws-sdk/s3-request-presigner", () => ({ getSignedUrl: (...args: unknown[]) => mockGetSignedUrl(...args) }));

jest.mock("../../services/socketService", () => ({
  emitOrderCreated: jest.fn(),
  emitOrderUpdated: jest.fn(),
  emitOrderDeleted: jest.fn(),
  emitOrderStatusChanged: jest.fn(),
}));
jest.mock("../../services/email/emailQueue", () => ({ queueOrderCreatedEmail: jest.fn() }));
jest.mock("../../services/campaignStatusService", () => ({ CampaignStatusService: {} }));

let currentUser: Express.User | undefined;
jest.mock("../../middleware/authMiddleware", () => ({
  ...jest.requireActual("../../middleware/authMiddleware"),
  requireAuth: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    req.user = currentUser;
    next();
  },
}));

import orderRouter from "../orders";
import { errorHandler } from "../../middleware/errorHandler";

function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/orders", orderRouter);
  app.use(errorHandler);
  return app;
}

const users = {
  owner: { id: "owner-1", role: "CUSTOMER" },
  creator: { id: "creator-1", role: "CAMPAIGN_CREATOR" },
  admin: { id: "admin-1", role: "ADMIN" },
  stranger: { id: "stranger-1", role: "CUSTOMER" },
} as unknown as Record<string, Express.User>;

const SIGNED_URL = "https://bucket.s3.amazonaws.com/payment-proofs/p.png?X-Amz-Expires=300&X-Amz-Signature=abc";
let privateDir: string;

function orderWith(storageType: "S3" | "LOCAL" | null, key: string | null) {
  return {
    id: "o-1",
    userId: users.owner.id,
    campaignId: "c-1",
    paymentProofUrl: key ? "/api/orders/o-1/payment-proof" : null,
    paymentProofKey: key,
    paymentProofStorageType: storageType,
    campaign: { creatorId: users.creator.id },
  };
}

beforeEach(() => {
  privateDir = fs.mkdtempSync(path.join(os.tmpdir(), "uploads-private-"));
  process.env.PRIVATE_UPLOAD_DIR = privateDir;
  process.env.UPLOAD_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "uploads-public-"));
  process.env.AWS_ACCESS_KEY_ID = "key";
  process.env.AWS_SECRET_ACCESS_KEY = "secret";
  process.env.AWS_S3_BUCKET = "bucket";
  mockGetSignedUrl.mockReset();
  mockGetSignedUrl.mockResolvedValue(SIGNED_URL);
  fs.mkdirSync(path.join(privateDir, "payment-proofs"));
  fs.writeFileSync(path.join(privateDir, "payment-proofs", "p.png"), PNG_BYTES);
});

afterEach(() => {
  fs.rmSync(privateDir, { recursive: true, force: true });
  fs.rmSync(process.env.UPLOAD_DIR!, { recursive: true, force: true });
});

describe("GET /api/orders/:id/payment-proof", () => {
  const app = createApp();

  it("forbidden for stranger: returns 403 and never signs a URL", async () => {
    currentUser = users.stranger;
    mockOrderFindUnique.mockResolvedValue(orderWith("S3", "payment-proofs/p.png"));

    const res = await request(app).get("/api/orders/o-1/payment-proof");

    expect(res.status).toBe(403);
    expect(mockGetSignedUrl).not.toHaveBeenCalled();
  });

  it.each(["owner", "creator", "admin"])("allowed roles: %s gets 302 to a 300s signed S3 URL", async (role) => {
    currentUser = users[role];
    mockOrderFindUnique.mockResolvedValue(orderWith("S3", "payment-proofs/p.png"));

    const res = await request(app).get("/api/orders/o-1/payment-proof");

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe(SIGNED_URL);
    expect(mockGetSignedUrl).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ input: expect.objectContaining({ Bucket: "bucket", Key: "payment-proofs/p.png" }) }),
      { expiresIn: 300 }
    );
  });

  it.each(["owner", "creator", "admin"])("allowed roles: %s gets 200 with the LOCAL file", async (role) => {
    currentUser = users[role];
    mockOrderFindUnique.mockResolvedValue(orderWith("LOCAL", "payment-proofs/p.png"));

    const res = await request(app).get("/api/orders/o-1/payment-proof").buffer(true).parse((response, callback) => {
      const chunks: Buffer[] = [];
      response.on("data", (chunk: Buffer) => chunks.push(chunk));
      response.on("end", () => callback(null, Buffer.concat(chunks)));
    });

    expect(res.status).toBe(200);
    expect(Buffer.compare(res.body as Buffer, PNG_BYTES)).toBe(0);
    expect(res.headers["content-type"]).toContain("image/png");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
  });

  it("returns 404 when the order has no payment proof", async () => {
    currentUser = users.owner;
    mockOrderFindUnique.mockResolvedValue(orderWith(null, null));

    const res = await request(app).get("/api/orders/o-1/payment-proof");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ status: "error", message: expect.any(String) });
  });
});
