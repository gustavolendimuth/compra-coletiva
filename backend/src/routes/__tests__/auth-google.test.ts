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

const stateCookieValue = (cookie: string) => decodeURIComponent(cookie.split(";")[0].slice("oauthState=".length));

describe("Google OAuth", () => {
  it("issues state: HttpOnly oauthState cookie scoped to /api/auth/google for 10 min, same value sent to Google", async () => {
    const { res, stateCookie, state } = await startFlow(createApp());

    expect(res.status).toBe(302);
    expect(stateCookie).toMatch(/HttpOnly/i);
    expect(stateCookie).toContain("Path=/api/auth/google");
    expect(stateCookie).toContain("Max-Age=600");
    expect(state).toMatch(/^[0-9a-f]{64}$/);
    expect(stateCookieValue(stateCookie!)).toBe(state);
  });

  it.each([
    { name: "missing state", cookie: "issued", query: "" },
    { name: "missing state cookie", cookie: "", query: "&state=abc" },
    { name: "empty state and empty cookie", cookie: "oauthState=", query: "&state=" },
    { name: "mismatched state", cookie: "issued", query: `&state=${"0".repeat(64)}` },
    { name: "mismatched state of different length", cookie: "issued", query: "&state=abc" },
  ])("$name: redirects with error=oauth_state and creates no session", async ({ cookie, query }) => {
    const app = createApp();
    const { stateCookie } = await startFlow(app);

    const res = await request(app)
      .get(`/api/auth/google/callback?code=abc${query}`)
      .set("Cookie", cookie === "issued" ? stateCookie!.split(";")[0] : cookie);

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe(`${FRONTEND_URL}/auth/callback?error=oauth_state`);
    expect(mockPrisma.session.create).not.toHaveBeenCalled();
    expect(cookies(res).some((c) => c.startsWith("refreshToken="))).toBe(false);
    expect(strategyCalls).toBe(1); // only the initial redirect; callback never reached the strategy
  });

  it("no user data in redirect: success goes to exactly /auth/callback, sets the refresh cookie and clears the state", async () => {
    const app = createApp();
    const { stateCookie, state } = await startFlow(app);

    const res = await request(app)
      .get(`/api/auth/google/callback?code=abc&state=${state}`)
      .set("Cookie", stateCookie!.split(";")[0]);

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe(`${FRONTEND_URL}/auth/callback`);
    expect(mockPrisma.session.create).toHaveBeenCalledTimes(1);
    expect(cookies(res).some((c) => c.startsWith("refreshToken="))).toBe(true);
    expect(cookies(res).find((c) => c.startsWith("oauthState="))).toContain("Expires=Thu, 01 Jan 1970");
  });

  it.each([
    { name: "email not verified redirect: error=email_not_verified", info: { message: "email_not_verified" }, location: "/auth/callback?error=email_not_verified" },
    { name: "strategy without user: login with error=auth_failed", info: undefined, location: "/login?error=auth_failed" },
  ])("$name and no session", async ({ info, location }) => {
    mockOutcome = { info };
    const app = createApp();
    const { stateCookie, state } = await startFlow(app);

    const res = await request(app)
      .get(`/api/auth/google/callback?code=abc&state=${state}`)
      .set("Cookie", stateCookie!.split(";")[0]);

    expect(res.headers.location).toBe(`${FRONTEND_URL}${location}`);
    expect(mockPrisma.session.create).not.toHaveBeenCalled();
  });
});
