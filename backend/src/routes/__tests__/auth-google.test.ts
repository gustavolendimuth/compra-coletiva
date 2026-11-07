import express from "express";
import cookieParser from "cookie-parser";
import request from "supertest";
import passport from "passport";

const mockPrisma = {
  session: { create: jest.fn() },
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

// ── Fake "google" strategy (no network) ─────────────────────────────────────

type Outcome = { user?: Record<string, unknown>; info?: Record<string, unknown> };
let mockOutcome: Outcome = {};
let strategyCalls = 0;

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Strategy: BaseStrategy } = require("passport-strategy");
const fakeGoogle = Object.create(BaseStrategy.prototype);
fakeGoogle.name = "google";
fakeGoogle.authenticate = function (req: express.Request, options: { state?: string }) {
  strategyCalls += 1;
  if (!req.query.code) {
    return this.redirect(
      `https://accounts.google.com/o/oauth2/v2/auth?state=${encodeURIComponent(options.state ?? "")}`
    );
  }
  if (mockOutcome.user) return this.success(mockOutcome.user);
  return this.fail(mockOutcome.info);
};
passport.use(fakeGoogle);

const FRONTEND_URL = "http://front.test";
process.env.FRONTEND_URL = FRONTEND_URL;

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use(passport.initialize());
  app.use("/api/auth", authRouter);
  return app;
}

const googleUser = {
  id: "user-1",
  name: "Maria Silva",
  email: "maria@test.com",
  role: "CUSTOMER",
  phoneCompleted: true,
  addressCompleted: true,
  legalAcceptanceRequired: false,
  hideNameInCampaigns: false,
};

const cookies = (res: request.Response): string[] =>
  (res.headers["set-cookie"] as unknown as string[] | undefined) ?? [];

async function startFlow(app: express.Express) {
  const res = await request(app).get("/api/auth/google");
  const stateCookie = cookies(res).find((c) => c.startsWith("oauthState="));
  const state = new URL(res.headers.location).searchParams.get("state");
  return { res, stateCookie, state };
}

beforeEach(() => {
  mockOutcome = { user: googleUser };
  strategyCalls = 0;
});

describe("Google OAuth", () => {
  it("issues state: HttpOnly oauthState cookie with the same value sent to Google", async () => {
    const { res, stateCookie, state } = await startFlow(createApp());

    expect(res.status).toBe(302);
    expect(stateCookie).toBeDefined();
    expect(stateCookie).toMatch(/HttpOnly/i);
    const cookieValue = decodeURIComponent(stateCookie!.split(";")[0].slice("oauthState=".length));
    expect(state).toMatch(/^[0-9a-f]{64}$/);
    expect(cookieValue).toBe(state);
  });

  it("missing state: redirects with error=oauth_state and creates no session", async () => {
    const app = createApp();
    const { stateCookie } = await startFlow(app);

    const res = await request(app)
      .get("/api/auth/google/callback?code=abc")
      .set("Cookie", stateCookie!.split(";")[0]);

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe(`${FRONTEND_URL}/auth/callback?error=oauth_state`);
    expect(mockPrisma.session.create).not.toHaveBeenCalled();
    expect(cookies(res).some((c) => c.startsWith("refreshToken="))).toBe(false);
  });

  it("missing state cookie: redirects with error=oauth_state and creates no session", async () => {
    const res = await request(createApp()).get("/api/auth/google/callback?code=abc&state=abc");
    expect(res.headers.location).toBe(`${FRONTEND_URL}/auth/callback?error=oauth_state`);
    expect(mockPrisma.session.create).not.toHaveBeenCalled();
  });

  it("mismatched state: redirects with error=oauth_state and creates no session", async () => {
    const app = createApp();
    const { stateCookie } = await startFlow(app);

    const res = await request(app)
      .get(`/api/auth/google/callback?code=abc&state=${"0".repeat(64)}`)
      .set("Cookie", stateCookie!.split(";")[0]);

    expect(res.headers.location).toBe(`${FRONTEND_URL}/auth/callback?error=oauth_state`);
    expect(mockPrisma.session.create).not.toHaveBeenCalled();
    expect(strategyCalls).toBe(1); // only the initial redirect; callback never reached the strategy
  });

  it("no user data in redirect: success goes to exactly /auth/callback and sets the refresh cookie", async () => {
    const app = createApp();
    const { stateCookie, state } = await startFlow(app);

    const res = await request(app)
      .get(`/api/auth/google/callback?code=abc&state=${state}`)
      .set("Cookie", stateCookie!.split(";")[0]);

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe(`${FRONTEND_URL}/auth/callback`);
    expect(res.headers.location).not.toMatch(/accessToken|userEmail|userId|userName|maria/);
    expect(mockPrisma.session.create).toHaveBeenCalledTimes(1);
    expect(cookies(res).some((c) => c.startsWith("refreshToken="))).toBe(true);
  });

  it("email not verified redirect: error=email_not_verified and no session", async () => {
    mockOutcome = { info: { message: "email_not_verified" } };
    const app = createApp();
    const { stateCookie, state } = await startFlow(app);

    const res = await request(app)
      .get(`/api/auth/google/callback?code=abc&state=${state}`)
      .set("Cookie", stateCookie!.split(";")[0]);

    expect(res.headers.location).toBe(`${FRONTEND_URL}/auth/callback?error=email_not_verified`);
    expect(mockPrisma.session.create).not.toHaveBeenCalled();
  });
});
