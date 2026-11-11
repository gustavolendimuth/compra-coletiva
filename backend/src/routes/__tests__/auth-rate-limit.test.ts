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

const MINUTE_S = 60;

const expectBlocked = (res: request.Response, windowSeconds: number) => {
  expect(res.status).toBe(429);
  expect(res.body).toEqual({ status: "error", message: expect.any(String) });
  // Retry-After fica dentro da janela: prova a duração (15 min / 1 h)
  expect(Number(res.headers["retry-after"])).toBeGreaterThan(windowSeconds - MINUTE_S);
  expect(Number(res.headers["retry-after"])).toBeLessThanOrEqual(windowSeconds);
};

describe("auth rate limits", () => {
  it.each([
    { name: "login: 11th call from the same IP in 15 min gets 429 with error shape and Retry-After", path: "/api/auth/login", limit: 10, windowSeconds: 15 * MINUTE_S, body: { email: "x@test.com", password: "wrong" } },
    { name: "register: 6th call from the same IP in 1 h gets 429", path: "/api/auth/register", limit: 5, windowSeconds: 60 * MINUTE_S, body: {} },
  ])("$name", async ({ path, limit, windowSeconds, body }) => {
    const app = createApp();
    for (let i = 1; i <= limit; i += 1) {
      const res = await request(app).post(path).set("X-Forwarded-For", fromClient("203.0.113.10")).send(body);
      expect(res.status).not.toBe(429);
    }

    const blocked = await request(app).post(path).set("X-Forwarded-For", fromClient("203.0.113.10")).send(body);

    expectBlocked(blocked, windowSeconds);
  });

  it("login keys by real client ip: other client behind the same forged first hop is not blocked", async () => {
    const app = createApp();
    const login = (ip: string) =>
      request(app).post("/api/auth/login").set("X-Forwarded-For", fromClient(ip)).send({ email: "x@test.com", password: "wrong" });
    for (let i = 1; i <= 10; i += 1) await login("203.0.113.20");

    expect((await login("203.0.113.20")).status).toBe(429);
    expect((await login("203.0.113.21")).status).not.toBe(429);
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

    expectBlocked(blocked, 60 * MINUTE_S);
    expect(mockQueuePasswordResetEmail).toHaveBeenCalledTimes(3);
  });

  it("password reset without e-mail: counted per client ip", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
    const app = createApp();
    const reset = (ip: string) =>
      request(app).post("/api/auth/request-password-reset").set("X-Forwarded-For", fromClient(ip)).send({});
    for (let i = 1; i <= 3; i += 1) await reset("203.0.113.60");

    expect((await reset("203.0.113.60")).status).toBe(429);
    expect((await reset("203.0.113.61")).status).not.toBe(429);
    errorSpy.mockRestore();
  });
});
