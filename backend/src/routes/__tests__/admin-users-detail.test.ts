import express from "express";
import request from "supertest";

const mockUserFindUnique = jest.fn();
jest.mock("../../index", () => ({ prisma: { user: { findUnique: mockUserFindUnique } } }));

const passThrough = (_req: express.Request, _res: express.Response, next: express.NextFunction) => next();
jest.mock("../../middleware/authMiddleware", () => ({
  requireAuth: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    req.user = { id: "admin-1", role: "ADMIN" } as Express.User;
    next();
  },
}));
jest.mock("../../middleware/adminMiddleware", () => ({ adminAuth: () => [passThrough] }));

import usersRouter from "../admin/users";
import { errorHandler } from "../../middleware/errorHandler";

function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/admin/users", usersRouter);
  app.use(errorHandler);
  return app;
}

describe("GET /api/admin/users/:id", () => {
  it("omits secrets: password, pendingEmailToken and googleId", async () => {
    mockUserFindUnique.mockResolvedValue({
      id: "u-1",
      name: "User",
      email: "u@test.com",
      role: "CUSTOMER",
      password: "$2b$10$hash",
      pendingEmailToken: "token-123",
      googleId: "google-123",
      campaigns: [],
      orders: [],
      _count: { campaigns: 0, orders: 0, sentCampaignMessages: 0 },
    });

    const res = await request(createApp()).get("/api/admin/users/u-1");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: "u-1", email: "u@test.com" });
    expect(res.body).not.toHaveProperty("password");
    expect(res.body).not.toHaveProperty("pendingEmailToken");
    expect(res.body).not.toHaveProperty("googleId");
  });
});
