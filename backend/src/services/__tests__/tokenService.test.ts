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
    expect(data.token).not.toBe(refreshToken);
    expect(data.token).toMatch(/^[0-9a-f]{64}$/);
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
