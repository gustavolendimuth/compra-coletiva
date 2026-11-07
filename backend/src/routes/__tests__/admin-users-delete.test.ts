import express from "express";
import request from "supertest";

const mockTx = {
  user: { update: jest.fn() },
  session: { deleteMany: jest.fn() },
  passwordResetToken: { deleteMany: jest.fn() },
};
const mockPrisma = {
  user: { findUnique: jest.fn(), update: jest.fn() },
  session: { deleteMany: jest.fn() },
  passwordResetToken: { deleteMany: jest.fn() },
  $transaction: jest.fn(async (arg: unknown) =>
    typeof arg === "function" ? (arg as (tx: typeof mockTx) => unknown)(mockTx) : Promise.all(arg as unknown[])
  ),
};
jest.mock("../../index", () => ({ prisma: mockPrisma }));

let mockCurrentUser: { id: string; role: string } | undefined;
jest.mock("../../middleware/authMiddleware", () => ({
  requireAuth: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    req.user = mockCurrentUser as Express.User;
    next();
  },
}));
jest.mock("../../middleware/adminMiddleware", () => ({
  adminAuth: () => [(_req: express.Request, _res: express.Response, next: express.NextFunction) => next()],
}));

import usersRouter from "../admin/users";
import { errorHandler } from "../../middleware/errorHandler";

function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/admin/users", usersRouter);
  app.use(errorHandler);
  return app;
}

describe("DELETE /api/admin/users/:id", () => {
  beforeEach(() => {
    mockCurrentUser = { id: "admin-1", role: "ADMIN" };
    mockPrisma.user.findUnique.mockResolvedValue({ id: "user-9", role: "CUSTOMER" });
  });

  it("revokes sessions and credentials: deletes all sessions and nulls googleId and password", async () => {
    const res = await request(createApp()).delete("/api/admin/users/user-9");

    expect(res.status).toBe(200);
    const userUpdates = [...mockTx.user.update.mock.calls, ...mockPrisma.user.update.mock.calls];
    expect(userUpdates).toHaveLength(1);
    expect(userUpdates[0][0]).toMatchObject({
      where: { id: "user-9" },
      data: expect.objectContaining({
        googleId: null,
        password: null,
        deletedAt: expect.any(Date),
      }),
    });
    const sessionDeletes = [...mockTx.session.deleteMany.mock.calls, ...mockPrisma.session.deleteMany.mock.calls];
    expect(sessionDeletes).toEqual([[{ where: { userId: "user-9" } }]]);
  });
});
