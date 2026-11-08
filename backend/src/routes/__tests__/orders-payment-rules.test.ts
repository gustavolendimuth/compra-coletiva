import express from "express";
import fs from "fs";
import os from "os";
import path from "path";
import request from "supertest";
import { PNG_BYTES } from "../../__tests__/fileFixtures";

// ── Mocks ───────────────────────────────────────────────────────────────────

const mockPrisma = {
  order: { findUnique: jest.fn(), update: jest.fn() },
};

// authMiddleware cria o próprio PrismaClient: o mock cobre os dois
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
jest.mock("../../services/email/emailQueue", () => ({ queueOrderCreatedEmail: jest.fn() }));
jest.mock("../../services/campaignStatusService", () => ({
  CampaignStatusService: {
    checkAndArchiveCampaign: jest.fn().mockResolvedValue({ changed: false }),
    checkAndUnarchiveCampaign: jest.fn().mockResolvedValue({ changed: false }),
  },
}));

const mockProofDelete = jest.fn();
jest.mock("../../services/paymentProofStorage", () => {
  const actual = jest.requireActual("../../services/paymentProofStorage");
  return {
    ...actual,
    PaymentProofStorage: {
      ...actual.PaymentProofStorage,
      upload: (file: Express.Multer.File) => actual.PaymentProofStorage.upload(file),
      delete: (...args: unknown[]) => mockProofDelete(...args),
    },
  };
});

// Só o requireAuth é falso; os guards de ownership são os reais (com o prisma mockado)
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

// ── Dados ───────────────────────────────────────────────────────────────────

const OWNER = { id: "owner-1", role: "CUSTOMER" } as Express.User;
const CREATOR = { id: "creator-1", role: "CAMPAIGN_CREATOR" } as Express.User;
const ADMIN = { id: "admin-1", role: "ADMIN" } as Express.User;

let privateDir: string;

function setOrder(overrides: Record<string, unknown> = {}) {
  mockPrisma.order.findUnique.mockResolvedValue({
    id: "o-1",
    userId: OWNER.id,
    campaignId: "c-1",
    isPaid: false,
    isSeparated: false,
    paymentProofKey: null,
    paymentProofStorageType: null,
    campaign: { id: "c-1", creatorId: CREATOR.id, status: "ACTIVE" },
    ...overrides,
  });
}

beforeEach(() => {
  privateDir = fs.mkdtempSync(path.join(os.tmpdir(), "proof-rules-"));
  process.env.PRIVATE_UPLOAD_DIR = privateDir;
  ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_S3_BUCKET"].forEach((key) => delete process.env[key]);
  setOrder();
  mockPrisma.order.update.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
    Promise.resolve({ id: "o-1", campaignId: "c-1", isPaid: false, isSeparated: false, ...data })
  );
});

afterEach(() => {
  fs.rmSync(privateDir, { recursive: true, force: true });
});

// ── Testes ──────────────────────────────────────────────────────────────────

describe("quem marca pago", () => {
  const app = createApp();

  it.each([["isPaid"], ["isSeparated"]])("owner cannot patch status fields: %s → 403", async (field) => {
    currentUser = OWNER;

    const res = await request(app).patch("/api/orders/o-1").send({ [field]: true });

    expect(res.status).toBe(403);
    expect(mockPrisma.order.update).not.toHaveBeenCalled();
  });

  it("owner without proof: isPaid=true → 400 and nothing changes", async () => {
    currentUser = OWNER;

    const res = await request(app).patch("/api/orders/o-1/payment").field("isPaid", "true");

    expect(res.status).toBe(400);
    expect(mockPrisma.order.update).not.toHaveBeenCalled();
  });

  it("owner with proof: isPaid=true + valid PNG → 200, isPaid and paymentProofKey set", async () => {
    currentUser = OWNER;

    const res = await request(app)
      .patch("/api/orders/o-1/payment")
      .field("isPaid", "true")
      .attach("paymentProof", PNG_BYTES, { filename: "proof.png", contentType: "image/png" });

    expect(res.status).toBe(200);
    expect(res.body.isPaid).toBe(true);
    expect(res.body.paymentProofKey).toEqual(expect.any(String));
    expect(res.body.paymentProofKey.length).toBeGreaterThan(0);
    expect(mockPrisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ isPaid: true, paymentProofKey: expect.any(String) }),
      })
    );
  });

  const markPaidCases: Array<[string, string, Express.User]> = [
    ["creator", "payment", CREATOR],
    ["creator", "patch", CREATOR],
    ["admin", "payment", ADMIN],
    ["admin", "patch", ADMIN],
  ];

  it.each(markPaidCases)("creator and admin mark paid without proof: %s via %s → 200", async (_name, route, user) => {
    currentUser = user;

    const res =
      route === "payment"
        ? await request(app).patch("/api/orders/o-1/payment").field("isPaid", "true")
        : await request(app).patch("/api/orders/o-1").send({ isPaid: true });

    expect(res.status).toBe(200);
    expect(res.body.isPaid).toBe(true);
    expect(mockPrisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ isPaid: true }) })
    );
  });

  it("owner cannot unmark paid: isPaid=false on paid order → 403, proof kept", async () => {
    currentUser = OWNER;
    setOrder({ isPaid: true, paymentProofKey: "payment-proofs/p.png", paymentProofStorageType: "LOCAL" });

    const res = await request(app).patch("/api/orders/o-1/payment").field("isPaid", "false");

    expect(res.status).toBe(403);
    expect(mockPrisma.order.update).not.toHaveBeenCalled();
    expect(mockProofDelete).not.toHaveBeenCalled();
  });

  it.each([["owner", OWNER], ["creator", CREATOR], ["admin", ADMIN]])(
    "missing isPaid: %s → 400 and nothing changes",
    async (_name, user) => {
      currentUser = user;

      const res = await request(app)
        .patch("/api/orders/o-1/payment")
        .attach("paymentProof", PNG_BYTES, { filename: "proof.png", contentType: "image/png" });

      expect(res.status).toBe(400);
      expect(mockPrisma.order.update).not.toHaveBeenCalled();
      expect(mockProofDelete).not.toHaveBeenCalled();
      expect(fs.readdirSync(privateDir)).toEqual([]);
    }
  );
});
