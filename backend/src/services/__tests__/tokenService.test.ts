import crypto from "crypto";
import jwt from "jsonwebtoken";

const mockSession = {
  create: jest.fn(),
  findUnique: jest.fn(),
  deleteMany: jest.fn(),
};

jest.mock("@prisma/client", () => ({
  ...jest.requireActual("@prisma/client"),
  PrismaClient: jest.fn(() => ({ session: mockSession })),
}));

import { TokenService } from "../tokenService";

const sha256Hex = (value: string) =>
  crypto.createHash("sha256").update(value).digest("hex");

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

describe("TokenService refresh token storage", () => {
  it("stores sha256 hex of the refresh token, never the token itself", async () => {
    mockSession.create.mockResolvedValue({});
    const refreshToken = TokenService.generateRefreshToken({
      userId: "user-1",
      email: "u@test.com",
      role: "CUSTOMER",
    });

    await TokenService.saveRefreshToken("user-1", refreshToken);

    const { data } = mockSession.create.mock.calls[0][0];
    expect(data.token).toBe(sha256Hex(refreshToken));
  });

  it("stores sha256 hex: revocation looks up by the hash", async () => {
    mockSession.deleteMany.mockResolvedValue({ count: 1 });

    await TokenService.revokeRefreshToken("raw-token");

    expect(mockSession.deleteMany).toHaveBeenCalledWith({
      where: { token: sha256Hex("raw-token") },
    });
  });

  it("refresh token lasts 30 days: JWT exp - iat is 30 days", () => {
    const refreshToken = TokenService.generateRefreshToken({
      userId: "user-1",
      email: "u@test.com",
      role: "CUSTOMER",
    });
    const decoded = jwt.decode(refreshToken) as { exp: number; iat: number };
    expect(decoded.exp - decoded.iat).toBe(30 * 24 * 60 * 60);
  });

  it("session lasts 30 days: expiresAt is now + 30 days", async () => {
    mockSession.create.mockResolvedValue({});
    const before = Date.now();
    await TokenService.saveRefreshToken("user-1", "token");
    const after = Date.now();

    const { data } = mockSession.create.mock.calls[0][0];
    const expiresAt = (data.expiresAt as Date).getTime();
    expect(expiresAt).toBeGreaterThanOrEqual(before + THIRTY_DAYS_MS);
    expect(expiresAt).toBeLessThanOrEqual(after + THIRTY_DAYS_MS);
  });
});

describe("TokenService refresh token consumption", () => {
  const payload = { userId: "user-1", email: "u@test.com", role: "CUSTOMER" };
  const live = { userId: "user-1", expiresAt: new Date(Date.now() + 60_000) };

  it.each([
    { name: "rejects a token with invalid signature and revokes nothing", token: "not-a-jwt", session: live, count: 1, outcome: { outcome: "invalid" }, deletes: [] },
    { name: "session absent (already rotated): reused, revokes all", session: null, count: 1, outcome: { outcome: "reused", userId: "user-1" }, deletes: ["user"] },
    { name: "session of another user: reused, revokes all", session: { ...live, userId: "user-2" }, count: 1, outcome: { outcome: "reused", userId: "user-1" }, deletes: ["user"] },
    { name: "session removed by a parallel request: reused, revokes all", session: live, count: 0, outcome: { outcome: "reused", userId: "user-1" }, deletes: ["token", "user"] },
    { name: "expired session: invalid, revokes only that session", session: { ...live, expiresAt: new Date(Date.now() - 1000) }, count: 1, outcome: { outcome: "invalid" }, deletes: ["token"] },
    { name: "live session: consumed", session: live, count: 1, outcome: { outcome: "consumed", payload: expect.objectContaining(payload) }, deletes: ["token"] },
  ])("$name", async ({ token: rawToken, session, count, outcome, deletes }) => {
    const token = rawToken ?? TokenService.generateRefreshToken(payload);
    mockSession.findUnique.mockResolvedValue(session);
    mockSession.deleteMany.mockResolvedValue({ count });

    const result = await TokenService.consumeRefreshToken(token);

    expect(result).toEqual(outcome);
    const byToken = { where: { token: sha256Hex(token) } };
    const allOfUser = { where: { userId: "user-1" } };
    expect(mockSession.deleteMany.mock.calls.map(([args]) => args)).toEqual(
      deletes.map((kind) => (kind === "token" ? byToken : allOfUser))
    );
  });

  it("revokeOtherUserTokens without the current token revokes all sessions", async () => {
    mockSession.deleteMany.mockResolvedValue({ count: 2 });

    await TokenService.revokeOtherUserTokens("user-1", undefined);

    expect(mockSession.deleteMany.mock.calls).toEqual([[{ where: { userId: "user-1" } }]]);
  });
});
