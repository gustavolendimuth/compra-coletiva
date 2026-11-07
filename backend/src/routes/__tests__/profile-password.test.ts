import express from "express";
import cookieParser from "cookie-parser";
import request from "supertest";
import crypto from "crypto";

const mockPrisma = {
  user: { findUnique: jest.fn(), update: jest.fn() },
  session: { deleteMany: jest.fn(async () => ({ count: 0 })) },
};
jest.mock("@prisma/client", () => ({
  ...jest.requireActual("@prisma/client"),
  PrismaClient: jest.fn(() => mockPrisma),
}));
jest.mock("../../index", () => ({ prisma: mockPrisma }));
jest.mock("../../services/email/emailQueue", () => ({ queueEmailVerificationEmail: jest.fn() }));
jest.mock("../../services/imageUploadService", () => ({ ImageUploadService: { deleteImage: jest.fn() } }));
jest.mock("../../middleware/uploadMiddleware", () => ({
  uploadAvatar: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
  handleUploadError: (_err: unknown, _req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
}));
jest.mock("../../services/legalAcceptanceService", () => ({
  LegalAcceptanceService: { recordAcceptance: jest.fn() },
}));
jest.mock("../../middleware/authMiddleware", () => ({
  requireAuth: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    req.user = { id: "user-1" } as Express.User;
    next();
  },
}));

import profileRouter from "../profile";
import { AuthService } from "../../services/authService";

const sha256Hex = (value: string) =>
  crypto.createHash("sha256").update(value).digest("hex");

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use("/api/profile", profileRouter);
  return app;
}

describe("PATCH /api/profile", () => {
  it("profile password change keeps current session and revokes the others", async () => {
    const hash = await AuthService.hashPassword("SenhaAtual123!");
    mockPrisma.user.findUnique.mockResolvedValue({ id: "user-1", password: hash });
    mockPrisma.user.update.mockResolvedValue({ id: "user-1", name: "Maria Silva", email: "m@test.com" });

    const res = await request(createApp())
      .patch("/api/profile")
      .set("Cookie", "refreshToken=current-refresh")
      .send({ currentPassword: "SenhaAtual123!", newPassword: "NovaSenha123!" });

    expect(res.status).toBe(200);
    expect(mockPrisma.session.deleteMany).toHaveBeenCalledWith({
      where: { userId: "user-1", token: { not: sha256Hex("current-refresh") } },
    });
  });
});
