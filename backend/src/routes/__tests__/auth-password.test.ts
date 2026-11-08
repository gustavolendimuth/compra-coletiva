import express from "express";
import cookieParser from "cookie-parser";
import request from "supertest";
import crypto from "crypto";

// Rate limit em memória: este arquivo não testa limites (ver auth-rate-limit.test.ts)
// e não deve abrir conexão com Redis
jest.mock("../../middleware/rateLimitStore", () => {
  const { MemoryStore } = jest.requireActual("express-rate-limit");
  return { createRateLimitStore: () => new MemoryStore() };
});

// ── Stateful fake of password_reset_tokens ──────────────────────────────────

type FakeResetToken = { id: string; userId: string; token: string; expiresAt: Date; used: boolean };
const mockResetTokens: FakeResetToken[] = [];

const mockPrisma = {
  user: { findUnique: jest.fn(), update: jest.fn() },
  session: { deleteMany: jest.fn(async () => ({ count: 0 })), create: jest.fn() },
  passwordResetToken: {
    create: jest.fn(async ({ data }: { data: Omit<FakeResetToken, "id" | "used"> }) => {
      const row = { id: `r-${mockResetTokens.length + 1}`, used: false, ...data };
      mockResetTokens.push(row);
      return row;
    }),
    findUnique: jest.fn(async ({ where }: { where: { token: string } }) => {
      const row = mockResetTokens.find((t) => t.token === where.token);
      return row ? { ...row, user: { id: row.userId } } : null;
    }),
    // Atomic conditional update (as Postgres does with UPDATE ... WHERE)
    updateMany: jest.fn(
      async ({ where, data }: { where: { id: string; used: boolean; expiresAt: { gt: Date } }; data: { used: boolean } }) => {
        const rows = mockResetTokens.filter(
          (t) => t.id === where.id && t.used === where.used && t.expiresAt > where.expiresAt.gt
        );
        rows.forEach((t) => Object.assign(t, data));
        return { count: rows.length };
      }
    ),
    deleteMany: jest.fn(async ({ where }: { where: { userId: string; id?: { not: string } } }) => {
      const before = mockResetTokens.length;
      for (let i = mockResetTokens.length - 1; i >= 0; i -= 1) {
        const t = mockResetTokens[i];
        if (t.userId === where.userId && (!where.id || t.id !== where.id.not)) {
          mockResetTokens.splice(i, 1);
        }
      }
      return { count: before - mockResetTokens.length };
    }),
  },
  $transaction: jest.fn(async (arg: unknown) =>
    typeof arg === "function"
      ? (arg as (tx: unknown) => unknown)(mockPrisma)
      : Promise.all(arg as unknown[])
  ),
};

jest.mock("@prisma/client", () => ({
  ...jest.requireActual("@prisma/client"),
  PrismaClient: jest.fn(() => mockPrisma),
}));
jest.mock("../../index", () => ({ prisma: mockPrisma }));
const mockQueuePasswordResetEmail = jest.fn();
jest.mock("../../services/email/emailQueue", () => ({
  queueWelcomeEmail: jest.fn(),
  queuePasswordResetEmail: (...args: unknown[]) => mockQueuePasswordResetEmail(...args),
}));
jest.mock("../../services/geocodingService", () => ({ geocodingService: {} }));
jest.mock("../../services/legalAcceptanceService", () => ({
  LegalAcceptanceService: { recordAcceptance: jest.fn() },
}));
let mockCurrentUser: { id: string } | undefined;
jest.mock("../../middleware/authMiddleware", () => ({
  requireAuth: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    req.user = mockCurrentUser as Express.User;
    next();
  },
}));

import authRouter from "../auth";
import { AuthService } from "../../services/authService";

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use("/api/auth", authRouter);
  return app;
}

const sha256Hex = (value: string) =>
  crypto.createHash("sha256").update(value).digest("hex");

const NEW_PASSWORD = "NovaSenha123!";
let currentPasswordHash: string;

beforeAll(async () => {
  currentPasswordHash = await AuthService.hashPassword("SenhaAtual123!");
});

beforeEach(() => {
  mockResetTokens.length = 0;
  mockCurrentUser = { id: "user-1" };
  mockPrisma.user.findUnique.mockResolvedValue({
    id: "user-1",
    name: "Maria Silva",
    email: "maria@test.com",
    password: currentPasswordHash,
  });
  mockPrisma.user.update.mockResolvedValue({ id: "user-1", name: "Maria Silva", email: "maria@test.com" });
});

const seedResetToken = (rawToken: string, userId = "user-1") =>
  mockPrisma.passwordResetToken.create({
    data: { userId, token: sha256Hex(rawToken), expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
  });

describe("password change and reset revoke sessions", () => {
  it("auth profile password change keeps current session and revokes the others", async () => {
    const res = await request(createApp())
      .patch("/api/auth/profile")
      .set("Cookie", "refreshToken=current-refresh")
      .send({ currentPassword: "SenhaAtual123!", newPassword: NEW_PASSWORD });

    expect(res.status).toBe(200);
    expect(mockPrisma.session.deleteMany).toHaveBeenCalledWith({
      where: { userId: "user-1", token: { not: sha256Hex("current-refresh") } },
    });
  });

  it("auth profile update without password change revokes nothing", async () => {
    const res = await request(createApp())
      .patch("/api/auth/profile")
      .set("Cookie", "refreshToken=current-refresh")
      .send({ hideNameInCampaigns: true });
    expect(res.status).toBe(200);
    expect(mockPrisma.session.deleteMany).not.toHaveBeenCalled();
  });

  it("reset revokes sessions and other tokens: all sessions removed, other pending token gets 400", async () => {
    await seedResetToken("token-a");
    await seedResetToken("token-b");
    await seedResetToken("token-other-user", "user-2");

    const res = await request(createApp())
      .post("/api/auth/reset-password")
      .send({ token: "token-a", newPassword: NEW_PASSWORD });

    expect(res.status).toBe(200);
    expect(mockPrisma.session.deleteMany).toHaveBeenCalledWith({ where: { userId: "user-1" } });

    const other = await request(createApp())
      .post("/api/auth/reset-password")
      .send({ token: "token-b", newPassword: NEW_PASSWORD });
    expect(other.status).toBe(400);
    expect(mockResetTokens.some((t) => t.userId === "user-2")).toBe(true);
  });

  it("parallel reset with same token: exactly one succeeds and the other gets 400", async () => {
    await seedResetToken("token-race");
    const app = createApp();

    const [first, second] = await Promise.all([
      request(app).post("/api/auth/reset-password").send({ token: "token-race", newPassword: NEW_PASSWORD }),
      request(app).post("/api/auth/reset-password").send({ token: "token-race", newPassword: NEW_PASSWORD }),
    ]);

    const statuses = [first.status, second.status].sort();
    expect(statuses).toEqual([200, 400]);
    expect(mockPrisma.user.update).toHaveBeenCalledTimes(1);
  });

  it("reset token stored as hash: DB gets sha256 hex, e-mail gets the raw token, reset finds it by hash", async () => {
    const res = await request(createApp())
      .post("/api/auth/request-password-reset")
      .send({ email: "maria@test.com" });
    expect(res.status).toBe(200);

    const rawToken = mockQueuePasswordResetEmail.mock.calls[0][3] as string;
    expect(rawToken).toMatch(/^[0-9a-f]{64}$/);
    expect(mockResetTokens).toHaveLength(1);
    expect(mockResetTokens[0].token).toBe(sha256Hex(rawToken));
    expect(mockResetTokens[0].token).not.toBe(rawToken);

    const reset = await request(createApp())
      .post("/api/auth/reset-password")
      .send({ token: rawToken, newPassword: NEW_PASSWORD });
    expect(reset.status).toBe(200);
    expect(mockPrisma.passwordResetToken.findUnique).toHaveBeenLastCalledWith(
      expect.objectContaining({ where: { token: sha256Hex(rawToken) } })
    );
  });

  it("never exposes token in production even with EXPOSE_RESET_TOKEN_IN_RESPONSE=true", async () => {
    const previousEnv = process.env.NODE_ENV;
    const previousFlag = process.env.EXPOSE_RESET_TOKEN_IN_RESPONSE;
    process.env.NODE_ENV = "production";
    process.env.EXPOSE_RESET_TOKEN_IN_RESPONSE = "true";
    try {
      const res = await request(createApp())
        .post("/api/auth/request-password-reset")
        .send({ email: "maria@test.com" });
      expect(res.status).toBe(200);
      expect(res.body).not.toHaveProperty("token");
      const rawToken = mockQueuePasswordResetEmail.mock.calls[0][3] as string;
      expect(JSON.stringify(res.body)).not.toContain(rawToken);
    } finally {
      process.env.NODE_ENV = previousEnv;
      process.env.EXPOSE_RESET_TOKEN_IN_RESPONSE = previousFlag;
    }
  });
});
