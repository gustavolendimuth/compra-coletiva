import express from "express";
import cookieParser from "cookie-parser";
import request from "supertest";
import bcrypt from "bcrypt";
import { inspect } from "util";

// Rate limit em memória: este arquivo não testa limites e não deve abrir conexão com Redis
jest.mock("../../middleware/rateLimitStore", () => {
  const { MemoryStore } = jest.requireActual("express-rate-limit");
  return { createRateLimitStore: () => new MemoryStore() };
});

const mockSessions = new Map<string, { id: string; userId: string; token: string; expiresAt: Date }>();
const mockPrisma = {
  session: {
    create: jest.fn(async ({ data }: { data: { userId: string; token: string; expiresAt: Date } }) => {
      const session = { id: `s-${mockSessions.size + 1}`, ...data };
      mockSessions.set(data.token, session);
      return session;
    }),
    findUnique: jest.fn(async ({ where }: { where: { token: string } }) => mockSessions.get(where.token) ?? null),
    deleteMany: jest.fn(async ({ where }: { where: { token?: string } }) => {
      const existed = where.token ? mockSessions.delete(where.token) : false;
      return { count: existed ? 1 : 0 };
    }),
  },
  user: { findUnique: jest.fn(), update: jest.fn() },
};

jest.mock("@prisma/client", () => ({
  ...jest.requireActual("@prisma/client"),
  PrismaClient: jest.fn(() => mockPrisma),
}));
jest.mock("../../index", () => ({ prisma: mockPrisma }));
jest.mock("../../services/email/emailQueue", () => ({
  queueWelcomeEmail: jest.fn(),
  queuePasswordResetEmail: jest.fn(),
}));
jest.mock("../../services/geocodingService", () => ({ geocodingService: {} }));
jest.mock("../../services/legalAcceptanceService", () => ({
  LegalAcceptanceService: { recordAcceptance: jest.fn() },
}));

import authRouter from "../auth";
import { TokenService } from "../../services/tokenService";

const EMAIL = "maria.sensivel@test.com";
const PASSWORD = "SenhaSecreta#123";
const PHONE = "(11) 98765-4321";

const user = {
  id: "user-1",
  name: "Maria",
  email: EMAIL,
  role: "CUSTOMER",
  phone: null,
  deletedAt: null,
  legalAcceptanceRequired: false,
};

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use("/api/auth", authRouter);
  return app;
}

const consoleMethods = ["log", "info", "warn", "error", "debug"] as const;

function captureLogs() {
  const spies = consoleMethods.map((method) => jest.spyOn(console, method).mockImplementation(() => undefined));
  return {
    text: () =>
      spies
        .flatMap((spy) => spy.mock.calls)
        .map((args) => args.map((arg) => (typeof arg === "string" ? arg : inspect(arg, { depth: 10 }))).join(" "))
        .join("\n"),
    restore: () => spies.forEach((spy) => spy.mockRestore()),
  };
}

function expectNoSensitive(logText: string, forbidden: string[]) {
  for (const value of forbidden) {
    expect(logText).not.toContain(value);
  }
}

describe("auth logs carry no personal data", () => {
  let logs: ReturnType<typeof captureLogs>;
  let passwordHash: string;

  beforeAll(async () => {
    passwordHash = await bcrypt.hash(PASSWORD, 4);
  });

  beforeEach(() => {
    mockSessions.clear();
    mockPrisma.user.findUnique.mockReset();
    mockPrisma.user.update.mockReset();
    logs = captureLogs();
  });

  afterEach(() => {
    logs.restore();
  });

  it("login: success logs no email, password, token nor body", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ ...user, password: passwordHash });

    const res = await request(createApp()).post("/api/auth/login").send({ email: EMAIL, password: PASSWORD });

    expect(res.status).toBe(200);
    expectNoSensitive(logs.text(), [EMAIL, PASSWORD, res.body.accessToken, "maria.sensivel"]);
  });

  it("login: wrong password (401) logs no email nor password", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ ...user, password: passwordHash });

    const res = await request(createApp()).post("/api/auth/login").send({ email: EMAIL, password: "outra-senha-1" });

    expect(res.status).toBe(401);
    expectNoSensitive(logs.text(), [EMAIL, PASSWORD, "outra-senha-1"]);
  });

  it("login: 500 with a Prisma error quoting the email logs neither the email nor the password", async () => {
    mockPrisma.user.findUnique.mockRejectedValue(
      new Error(`Invalid \`prisma.user.findUnique()\` invocation: where: { email: "${EMAIL}" }`)
    );

    const res = await request(createApp()).post("/api/auth/login").send({ email: EMAIL, password: PASSWORD });

    expect(res.status).toBe(500);
    expect(logs.text()).toContain("login");
    expectNoSensitive(logs.text(), [EMAIL, PASSWORD]);
  });

  it("refresh: success logs no email nor tokens", async () => {
    const refreshToken = TokenService.generateRefreshToken({ userId: user.id, email: EMAIL, role: "CUSTOMER" });
    await TokenService.saveRefreshToken(user.id, refreshToken);
    mockPrisma.user.findUnique.mockResolvedValue(user);

    const res = await request(createApp())
      .post("/api/auth/refresh")
      .set("Cookie", `refreshToken=${refreshToken}`);

    expect(res.status).toBe(200);
    expectNoSensitive(logs.text(), [EMAIL, refreshToken, res.body.accessToken]);
  });

  it("refresh: 500 with an error quoting email and token logs neither", async () => {
    const refreshToken = TokenService.generateRefreshToken({ userId: user.id, email: EMAIL, role: "CUSTOMER" });
    await TokenService.saveRefreshToken(user.id, refreshToken);
    mockPrisma.user.findUnique.mockRejectedValue(new Error(`boom for ${EMAIL} token=${refreshToken}`));

    const res = await request(createApp())
      .post("/api/auth/refresh")
      .set("Cookie", `refreshToken=${refreshToken}`);

    expect(res.status).toBe(500);
    expectNoSensitive(logs.text(), [EMAIL, refreshToken]);
  });

  describe("complete-phone", () => {
    const accessToken = () => TokenService.generateAccessToken({ userId: user.id, email: EMAIL, role: "CUSTOMER" });

    it("complete-phone: 200 logs no body, phone, email nor token", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.user.update.mockResolvedValue({ ...user, phone: PHONE, phoneCompleted: true });
      const token = accessToken();

      const res = await request(createApp())
        .patch("/api/auth/complete-phone")
        .set("Authorization", `Bearer ${token}`)
        .send({ phone: PHONE });

      expect(res.status).toBe(200);
      expectNoSensitive(logs.text(), [PHONE, "98765", EMAIL, token, "body"]);
    });

    it("complete-phone: 400 logs no body nor phone", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(user);
      const token = accessToken();

      const res = await request(createApp())
        .patch("/api/auth/complete-phone")
        .set("Authorization", `Bearer ${token}`)
        .send({ phone: "telefone-invalido-777" });

      expect(res.status).toBe(400);
      expectNoSensitive(logs.text(), ["telefone-invalido-777", EMAIL, token]);
    });

    it("complete-phone: 500 with an error quoting phone and email logs neither", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.user.update.mockRejectedValue(new Error(`update failed data: { phone: "${PHONE}", email: "${EMAIL}" }`));
      const token = accessToken();

      const res = await request(createApp())
        .patch("/api/auth/complete-phone")
        .set("Authorization", `Bearer ${token}`)
        .send({ phone: PHONE });

      expect(res.status).toBe(500);
      expectNoSensitive(logs.text(), [PHONE, "98765", EMAIL, token]);
    });
  });
});
