import express from "express";
import cookieParser from "cookie-parser";
import request from "supertest";

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
import { captureConsole } from "../../__tests__/captureConsole";

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

function expectNoSensitive(logText: string, forbidden: string[]) {
  for (const value of forbidden) {
    expect(logText).not.toContain(value);
  }
}

const accessToken = () => TokenService.generateAccessToken({ userId: user.id, email: EMAIL, role: "CUSTOMER" });

describe("auth logs carry no personal data", () => {
  let logs: ReturnType<typeof captureConsole>;

  beforeEach(() => {
    mockSessions.clear();
    mockPrisma.user.findUnique.mockReset();
    mockPrisma.user.update.mockReset();
    logs = captureConsole();
  });

  afterEach(() => {
    logs.restore();
  });

  it.each([
    {
      name: "login: 500 with a Prisma error quoting the email logs neither the email nor the password",
      run: async () => {
        mockPrisma.user.findUnique.mockRejectedValue(
          new Error(`Invalid \`prisma.user.findUnique()\` invocation: where: { email: "${EMAIL}" }`)
        );
        const res = await request(createApp()).post("/api/auth/login").send({ email: EMAIL, password: PASSWORD });
        return { res, forbidden: [EMAIL, PASSWORD] };
      },
    },
    {
      name: "refresh: 500 with an error quoting email and token logs neither",
      run: async () => {
        const refreshToken = TokenService.generateRefreshToken({ userId: user.id, email: EMAIL, role: "CUSTOMER" });
        await TokenService.saveRefreshToken(user.id, refreshToken);
        mockPrisma.user.findUnique.mockRejectedValue(new Error(`boom for ${EMAIL} token=${refreshToken}`));
        const res = await request(createApp()).post("/api/auth/refresh").set("Cookie", `refreshToken=${refreshToken}`);
        return { res, forbidden: [EMAIL, refreshToken] };
      },
    },
    {
      name: "complete-phone: 500 with an error quoting phone and email logs neither",
      run: async () => {
        mockPrisma.user.findUnique.mockResolvedValue(user);
        mockPrisma.user.update.mockRejectedValue(new Error(`update failed data: { phone: "${PHONE}", email: "${EMAIL}" }`));
        const token = accessToken();
        const res = await request(createApp())
          .patch("/api/auth/complete-phone")
          .set("Authorization", `Bearer ${token}`)
          .send({ phone: PHONE });
        return { res, forbidden: [PHONE, "98765", EMAIL, token] };
      },
    },
  ])("$name", async ({ run }) => {
    const { res, forbidden } = await run();

    expect(res.status).toBe(500);
    expectNoSensitive(logs.text(), forbidden);
  });

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
});
