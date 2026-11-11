import express from "express";
import cookieParser from "cookie-parser";
import request from "supertest";
import crypto from "crypto";

// ── Stateful fake of the sessions table ─────────────────────────────────────

type FakeSession = { id: string; userId: string; token: string; expiresAt: Date };
const mockSessions = new Map<string, FakeSession>();

const matchesWhere = (session: FakeSession, where: Record<string, unknown>) => {
  if (where.userId !== undefined && session.userId !== where.userId) return false;
  if (typeof where.token === "string" && session.token !== where.token) return false;
  if (where.token && typeof where.token === "object") {
    const not = (where.token as { not?: string }).not;
    if (not !== undefined && session.token === not) return false;
  }
  return true;
};

const mockPrisma = {
  session: {
    create: jest.fn(async ({ data }: { data: Omit<FakeSession, "id"> }) => {
      const session = { id: `s-${mockSessions.size + 1}`, ...data };
      mockSessions.set(data.token, session);
      return session;
    }),
    findUnique: jest.fn(async ({ where }: { where: { token: string } }) =>
      mockSessions.get(where.token) ?? null
    ),
    deleteMany: jest.fn(async ({ where }: { where: Record<string, unknown> }) => {
      let count = 0;
      for (const [key, session] of [...mockSessions.entries()]) {
        if (matchesWhere(session, where)) {
          mockSessions.delete(key);
          count += 1;
        }
      }
      return { count };
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

const sha256Hex = (value: string) =>
  crypto.createHash("sha256").update(value).digest("hex");

const activeUser = {
  id: "user-1",
  name: "Maria Silva",
  email: "maria@test.com",
  role: "CUSTOMER",
  deletedAt: null,
};

const refreshCookieFrom = (res: request.Response): string | undefined => {
  const raw = res.headers["set-cookie"] as unknown as string[] | undefined;
  return raw?.find((c) => c.startsWith("refreshToken="));
};
const tokenFromCookie = (cookie: string) =>
  decodeURIComponent(cookie.split(";")[0].slice("refreshToken=".length));

async function loginSession(userId = "user-1") {
  const refreshToken = TokenService.generateRefreshToken({
    userId,
    email: "maria@test.com",
    role: "CUSTOMER",
  });
  await TokenService.saveRefreshToken(userId, refreshToken);
  return refreshToken;
}

beforeEach(() => {
  mockSessions.clear();
  mockPrisma.user.findUnique.mockResolvedValue(activeUser);
});

describe("POST /api/auth/refresh", () => {
  it("rotates the refresh token: the new one keeps working, its cookie lasts 30 days (Max-Age=2592000), the old one gets 401", async () => {
    const app = createApp();
    const oldToken = await loginSession();

    const first = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", `refreshToken=${oldToken}`);

    expect(first.status).toBe(200);
    expect(first.body.accessToken).toEqual(expect.any(String));
    const cookie = refreshCookieFrom(first)!;
    expect(cookie).toContain("Max-Age=2592000");
    const newToken = tokenFromCookie(cookie);
    expect(mockSessions.has(sha256Hex(newToken))).toBe(true);
    expect(mockSessions.has(sha256Hex(oldToken))).toBe(false);

    const second = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", `refreshToken=${newToken}`);
    expect(second.status).toBe(200);

    const replay = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", `refreshToken=${oldToken}`);
    expect(replay.status).toBe(401);
  });

  it("reuse revokes all sessions of the user", async () => {
    const app = createApp();
    const stolen = await loginSession();
    const otherDevice = await loginSession();
    await loginSession("user-2");

    // Legit rotation consumes `stolen`
    const rotated = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", `refreshToken=${stolen}`);
    expect(rotated.status).toBe(200);

    // Reuse of an already rotated token (valid signature, not expired, absent)
    const reuse = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", `refreshToken=${stolen}`);

    expect(reuse.status).toBe(401);
    expect(mockPrisma.session.deleteMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
    });
    expect([...mockSessions.values()].filter((s) => s.userId === "user-1")).toHaveLength(0);
    expect(mockSessions.has(sha256Hex(otherDevice))).toBe(false);
    // Other users are untouched
    expect([...mockSessions.values()].filter((s) => s.userId === "user-2")).toHaveLength(1);
  });

  it("deleted user gets 401, the cookie is cleared and no session is left", async () => {
    const app = createApp();
    const token = await loginSession();
    mockPrisma.user.findUnique.mockResolvedValue({
      ...activeUser,
      deletedAt: new Date(),
    });

    const res = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", `refreshToken=${token}`);

    expect(res.status).toBe(401);
    expect(refreshCookieFrom(res)).toContain("Expires=Thu, 01 Jan 1970");
    expect(mockSessions.size).toBe(0);
  });
});
