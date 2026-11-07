import express from "express";
import request from "supertest";

const mockUserFindUnique = jest.fn();
jest.mock("@prisma/client", () => ({
  ...jest.requireActual("@prisma/client"),
  PrismaClient: jest.fn(() => ({ user: { findUnique: mockUserFindUnique } })),
}));

import { requireAuth, optionalAuth } from "../authMiddleware";
import { TokenService } from "../../services/tokenService";

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
  });

  it("deleted user is anonymous in optionalAuth", async () => {
    mockUserFindUnique.mockResolvedValue({ ...user, deletedAt: new Date() });
    const res = await request(createApp())
      .get("/public")
      .set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.userId).toBeNull();
  });
});
