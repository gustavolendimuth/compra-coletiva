import express from "express";
import request from "supertest";

// cada operação devolve um marcador para provar que entrou na transação
const mockPrisma = {
  user: { findUnique: jest.fn(), update: jest.fn(() => "user-update") },
  session: { deleteMany: jest.fn(() => "session-delete") },
  passwordResetToken: { deleteMany: jest.fn(() => "reset-token-delete") },
  $transaction: jest.fn(async (ops: unknown[]) => Promise.all(ops)),
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

  it("revokes sessions and credentials: deletes all sessions and reset tokens and nulls googleId and password", async () => {
    const res = await request(createApp()).delete("/api/admin/users/user-9");

    expect(res.status).toBe(200);
    expect(mockPrisma.$transaction).toHaveBeenCalledWith(["user-update", "session-delete", "reset-token-delete"]);
    expect(mockPrisma.user.update).toHaveBeenCalledTimes(1);
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-9" },
      data: expect.objectContaining({
        googleId: null,
        password: null,
        deletedAt: expect.any(Date),
      }),
    });
    expect(mockPrisma.session.deleteMany.mock.calls).toEqual([[{ where: { userId: "user-9" } }]]);
    expect(mockPrisma.passwordResetToken.deleteMany.mock.calls).toEqual([[{ where: { userId: "user-9" } }]]);
  });
});
