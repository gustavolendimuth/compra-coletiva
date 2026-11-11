import express from "express";
import request from "supertest";

const mockUserFindUnique = jest.fn();
jest.mock("@prisma/client", () => ({
  ...jest.requireActual("@prisma/client"),
  PrismaClient: jest.fn(() => ({ user: { findUnique: mockUserFindUnique } })),
}));

import { requireAuth, optionalAuth } from "../authMiddleware";
import jwt from "jsonwebtoken";
import { TokenService } from "../../services/tokenService";
import { getSecret } from "../../config/secrets";

function createApp() {
  const app = express();
  app.get("/private", requireAuth, (req, res) => {
    res.json({ userId: req.user?.id });
  });
  app.get("/public", optionalAuth, (req, res) => {
    res.json({ userId: req.user?.id ?? null });
  });
  return app;
}

const accessToken = TokenService.generateAccessToken({
  userId: "user-1",
  email: "u@test.com",
  role: "CUSTOMER",
});

const user = { id: "user-1", legalAcceptanceRequired: false, deletedAt: null };

describe("authMiddleware and deleted accounts", () => {
  it("active user passes requireAuth", async () => {
    mockUserFindUnique.mockResolvedValue(user);
    const res = await request(createApp())
      .get("/private")
      .set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.userId).toBe("user-1");
  });

  it("deleted user is rejected by requireAuth with 401 even with a valid access token", async () => {
    mockUserFindUnique.mockResolvedValue({ ...user, deletedAt: new Date() });
    const res = await request(createApp())
      .get("/private")
      .set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("USER_NOT_FOUND");
  });

  it("deleted user is anonymous in optionalAuth", async () => {
    mockUserFindUnique.mockResolvedValue({ ...user, deletedAt: new Date() });
    const res = await request(createApp())
      .get("/public")
      .set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.userId).toBeNull();
  });

  it("rejects HS512 token signed with the correct secret: requireAuth 401", async () => {
    mockUserFindUnique.mockResolvedValue(user);
    const hs512 = jwt.sign(
      { userId: "user-1", email: "u@test.com", role: "CUSTOMER" },
      getSecret("JWT_ACCESS_SECRET"),
      { algorithm: "HS512", expiresIn: "15m" }
    );
    const res = await request(createApp())
      .get("/private")
      .set("Authorization", `Bearer ${hs512}`);
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("INVALID_TOKEN");
  });
});
