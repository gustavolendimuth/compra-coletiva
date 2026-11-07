import express from "express";
import request from "supertest";

jest.mock("../../middleware/rateLimitStore", () => {
  const { MemoryStore } = jest.requireActual("express-rate-limit");
  return { createRateLimitStore: () => new MemoryStore() };
});

const mockPrisma = {
  user: { findUnique: jest.fn() },
  passwordResetToken: { create: jest.fn() },
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

import authRouter from "../auth";
import { configureTrustProxy } from "../../config/trustProxy";

function createApp() {
  const app = express();
  configureTrustProxy(app);
  app.use(express.json());
  app.use("/api/auth", authRouter);
  return app;
}

const fromClient = (ip: string) => `1.1.1.1, ${ip}`;

beforeEach(() => {
  mockPrisma.user.findUnique.mockResolvedValue(null);
});

describe("auth rate limits", () => {
  it("login: 11th call from the same IP in 15 min gets 429 with error shape and Retry-After", async () => {
    const app = createApp();
    for (let i = 1; i <= 10; i += 1) {
      const res = await request(app)
        .post("/api/auth/login")
        .set("X-Forwarded-For", fromClient("203.0.113.10"))
        .send({ email: "x@test.com", password: "wrong" });
      expect(res.status).not.toBe(429);
    }

    const blocked = await request(app)
      .post("/api/auth/login")
      .set("X-Forwarded-For", fromClient("203.0.113.10"))
      .send({ email: "x@test.com", password: "wrong" });

    expect(blocked.status).toBe(429);
    expect(blocked.body).toEqual({ status: "error", message: expect.any(String) });
    expect(blocked.body.message.length).toBeGreaterThan(0);
    expect(Number(blocked.headers["retry-after"])).toBeGreaterThan(0);
    expect(Number(blocked.headers["retry-after"])).toBeLessThanOrEqual(15 * 60);
  });

  it("login keys by real client ip: other client behind the same forged first hop is not blocked", async () => {
    const app = createApp();
    for (let i = 1; i <= 11; i += 1) {
      await request(app)
        .post("/api/auth/login")
        .set("X-Forwarded-For", fromClient("203.0.113.20"))
        .send({ email: "x@test.com", password: "wrong" });
    }
    const otherClient = await request(app)
      .post("/api/auth/login")
      .set("X-Forwarded-For", fromClient("203.0.113.21"))
      .send({ email: "x@test.com", password: "wrong" });
    expect(otherClient.status).not.toBe(429);
  });

  it("password reset: 4th call for the same e-mail in 1 h gets 429 and queues no e-mail", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      name: "Maria",
      email: "maria@test.com",
      password: "hash",
    });
    mockPrisma.passwordResetToken.create.mockResolvedValue({});
    const app = createApp();

    for (let i = 1; i <= 3; i += 1) {
      const res = await request(app)
        .post("/api/auth/request-password-reset")
        // e-mail normalizado: variações de caixa e espaços contam como o mesmo
        .set("X-Forwarded-For", fromClient(`198.51.100.${i}`))
        .send({ email: i === 2 ? "  MARIA@test.com " : "maria@test.com" });
      expect(res.status).toBe(200);
    }
    expect(mockQueuePasswordResetEmail).toHaveBeenCalledTimes(3);

    const blocked = await request(app)
      .post("/api/auth/request-password-reset")
      .set("X-Forwarded-For", fromClient("198.51.100.9"))
      .send({ email: "maria@test.com" });

    expect(blocked.status).toBe(429);
    expect(blocked.body).toEqual({ status: "error", message: expect.any(String) });
    expect(mockQueuePasswordResetEmail).toHaveBeenCalledTimes(3);
  });

  it("register: 6th call from the same IP in 1 h gets 429", async () => {
    const app = createApp();
    for (let i = 1; i <= 5; i += 1) {
      const res = await request(app)
        .post("/api/auth/register")
        .set("X-Forwarded-For", fromClient("203.0.113.30"))
        .send({});
      expect(res.status).not.toBe(429);
    }
    const blocked = await request(app)
      .post("/api/auth/register")
      .set("X-Forwarded-For", fromClient("203.0.113.30"))
      .send({});
    expect(blocked.status).toBe(429);
    expect(blocked.body).toEqual({ status: "error", message: expect.any(String) });
  });
});
