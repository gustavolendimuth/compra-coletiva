import express from "express";
import fs from "fs";
import os from "os";
import path from "path";
import request from "supertest";
import { HTML_BYTES, PNG_BYTES } from "../../__tests__/fileFixtures";

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
  const payWithProof = (bytes: Buffer) =>
    request(app)
      .patch("/api/orders/o-1/payment")
      .field("isPaid", "true")
      .attach("paymentProof", bytes, { filename: "proof.png", contentType: "image/png" });

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

  it("owner with proof: isPaid=true + valid PNG → 200, new proof set and old one deleted", async () => {
    currentUser = OWNER;
    setOrder({ paymentProofKey: "payment-proofs/old.png", paymentProofStorageType: "LOCAL" });

    const res = await payWithProof(PNG_BYTES);

    expect(res.status).toBe(200);
    expect(mockProofDelete).toHaveBeenCalledWith("payment-proofs/old.png", "LOCAL");
    expect(mockPrisma.order.update.mock.calls[0][0].data).toEqual({
      isPaid: true,
      paymentProofUrl: "/api/orders/o-1/payment-proof",
      paymentProofKey: expect.stringMatching(/^payment-proofs\/[^/]+\.png$/),
      paymentProofStorageType: "LOCAL",
    });
  });

  it("replacing a proof with invalid bytes → 400 and the old proof is kept", async () => {
    currentUser = OWNER;
    setOrder({ paymentProofKey: "payment-proofs/old.png", paymentProofStorageType: "LOCAL" });

    const res = await payWithProof(HTML_BYTES);

    expect(res.status).toBe(400);
    expect(mockProofDelete).not.toHaveBeenCalled();
    expect(mockPrisma.order.update).not.toHaveBeenCalled();
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

  it.each([["creator", CREATOR], ["admin", ADMIN]])(
    "creator and admin unmark paid: %s → 200, proof deleted and cleared",
    async (_name, user) => {
      currentUser = user;
      setOrder({ isPaid: true, paymentProofKey: "payment-proofs/p.png", paymentProofStorageType: "LOCAL" });

      const res = await request(app).patch("/api/orders/o-1/payment").field("isPaid", "false");

      expect(res.status).toBe(200);
      expect(mockProofDelete).toHaveBeenCalledWith("payment-proofs/p.png", "LOCAL");
      expect(mockPrisma.order.update.mock.calls[0][0].data).toEqual({
        isPaid: false,
        paymentProofUrl: null,
        paymentProofKey: null,
        paymentProofStorageType: null,
      });
    }
  );

  it("missing isPaid → 400 and nothing changes", async () => {
    currentUser = ADMIN;

    const res = await request(app)
      .patch("/api/orders/o-1/payment")
      .attach("paymentProof", PNG_BYTES, { filename: "proof.png", contentType: "image/png" });

    expect(res.status).toBe(400);
    expect(mockPrisma.order.update).not.toHaveBeenCalled();
    expect(fs.readdirSync(privateDir)).toEqual([]);
  });
});
