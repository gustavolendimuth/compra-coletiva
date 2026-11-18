import express from "express";
import cookieParser from "cookie-parser";
import request from "supertest";

// Fake mínimo da tabela de sessões, para o /refresh rotacionar de verdade
type FakeSession = { userId: string; token: string; expiresAt: Date };
const mockSessions = new Map<string, FakeSession>();

const mockPrisma = {
  session: {
    create: jest.fn(async ({ data }: { data: FakeSession }) => {
      mockSessions.set(data.token, data);
      return data;
    }),
    findUnique: jest.fn(async ({ where }: { where: { token: string } }) => mockSessions.get(where.token) ?? null),
    deleteMany: jest.fn(async ({ where }: { where: { token?: string } }) => {
      const existed = where.token !== undefined && mockSessions.delete(where.token);
      return { count: existed ? 1 : 0 };
    }),
  },
  user: { findUnique: jest.fn() },
};

jest.mock("@prisma/client", () => ({
  ...jest.requireActual("@prisma/client"),
  PrismaClient: jest.fn(() => mockPrisma),
}));
jest.mock("../../index", () => ({ prisma: mockPrisma }));
jest.mock("../../services/email/emailQueue", () => ({
  queueWelcomeEmail: jest.fn(),
  queuePasswordResetEmail: jest.fn(),
  queueSignupVerificationEmail: jest.fn(),
}));
jest.mock("../../services/geocodingService", () => ({ geocodingService: {} }));
jest.mock("../../services/legalAcceptanceService", () => ({
  LegalAcceptanceService: { recordAcceptance: jest.fn() },
}));

import authRouter from "../auth";
import { TokenService } from "../../services/tokenService";

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use("/api/auth", authRouter);
  return app;
}

const PASSWORD_HASH = "$2b$10$hash-que-nunca-deve-sair";
const GOOGLE_ID = "google-sub-que-nunca-deve-sair";

const baseUser = {
  id: "user-1",
  name: "Maria Silva",
  email: "maria@test.com",
  role: "CUSTOMER",
  legalAcceptanceRequired: false,
  deletedAt: null,
};

const accounts = [
  { name: "conta só com senha", password: PASSWORD_HASH, googleId: null, hasPassword: true, hasGoogle: false },
  { name: "conta só com Google", password: null, googleId: GOOGLE_ID, hasPassword: false, hasGoogle: true },
  { name: "conta com senha e Google", password: PASSWORD_HASH, googleId: GOOGLE_ID, hasPassword: true, hasGoogle: true },
];

const expectFlagsWithoutSecrets = (res: request.Response, flags: { hasPassword: boolean; hasGoogle: boolean }) => {
  expect(res.status).toBe(200);
  expect(res.body.user).toMatchObject(flags);
  expect(res.body.user).not.toHaveProperty("password");
  expect(res.body.user).not.toHaveProperty("googleId");
  expect(res.text).not.toContain(PASSWORD_HASH);
  expect(res.text).not.toContain(GOOGLE_ID);
};

beforeEach(() => {
  mockSessions.clear();
});

describe("hasPassword/hasGoogle no usuário autenticado", () => {
  it.each(accounts)("GET /api/auth/me: $name", async ({ password, googleId, hasPassword, hasGoogle }) => {
    mockPrisma.user.findUnique.mockResolvedValue({ ...baseUser, password, googleId });
    const accessToken = TokenService.generateAccessToken({ userId: "user-1", email: baseUser.email, role: "CUSTOMER" });

    const res = await request(createApp()).get("/api/auth/me").set("Authorization", `Bearer ${accessToken}`);

    expectFlagsWithoutSecrets(res, { hasPassword, hasGoogle });
  });

  it.each(accounts)("POST /api/auth/refresh: $name", async ({ password, googleId, hasPassword, hasGoogle }) => {
    mockPrisma.user.findUnique.mockResolvedValue({ ...baseUser, password, googleId });
    const refreshToken = TokenService.generateRefreshToken({ userId: "user-1", email: baseUser.email, role: "CUSTOMER" });
    await TokenService.saveRefreshToken("user-1", refreshToken);

    const res = await request(createApp()).post("/api/auth/refresh").set("Cookie", `refreshToken=${refreshToken}`);

    expectFlagsWithoutSecrets(res, { hasPassword, hasGoogle });
  });
});
