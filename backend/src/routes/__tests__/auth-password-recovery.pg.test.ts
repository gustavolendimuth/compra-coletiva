import express from "express";
import cookieParser from "cookie-parser";
import request from "supertest";
import { createPgClient, resetOrderTables } from "../../__tests__/pgClient";
import { AuthService } from "../../services/authService";

const db = createPgClient();
jest.mock("../../index", () => ({ prisma: db }));

// Este arquivo não testa limites (ver auth-rate-limit.test.ts): limitadores deixam tudo passar
jest.mock("../../middleware/rateLimiter", () => {
  const pass = (_req: unknown, _res: unknown, next: () => void) => next();
  return {
    loginRateLimiter: pass,
    registerRateLimiter: pass,
    passwordResetRateLimiter: pass,
    verificationResendRateLimiter: pass,
  };
});
const mockQueuePasswordResetEmail = jest.fn();
jest.mock("../../services/email/emailQueue", () => ({
  queueWelcomeEmail: jest.fn(),
  queuePasswordResetEmail: (...args: unknown[]) => mockQueuePasswordResetEmail(...args),
  queueSignupVerificationEmail: jest.fn(),
}));
jest.mock("../../services/geocodingService", () => ({ geocodingService: {} }));
jest.mock("../../services/legalAcceptanceService", () => ({
  LegalAcceptanceService: { recordAcceptance: jest.fn() },
}));

// auth.ts cria o próprio PrismaClient: aponta para o banco descartável
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const authRouter = require("../auth").default;

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use("/api/auth", authRouter);
  return app;
}

// Token cru que o pedido de reset mandou por email (último enfileirado)
const lastQueuedToken = () => mockQueuePasswordResetEmail.mock.calls.at(-1)?.[3] as string;

describe("Recuperação de senha", () => {
  const app = createApp();

  beforeEach(async () => {
    await resetOrderTables(db);
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  const createGoogleUser = () =>
    db.user.create({
      data: { email: "google@test.com", name: "Conta Google", googleId: "g-1", emailVerifiedAt: new Date() },
    });

  it("conta só com Google recebe o link, cria uma senha e passa a entrar com ela sem perder o Google", async () => {
    await createGoogleUser();

    const requested = await request(app).post("/api/auth/request-password-reset").send({ email: "google@test.com" });
    const reset = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: lastQueuedToken(), newPassword: "SenhaNova1" });
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "google@test.com", password: "SenhaNova1" });

    expect(requested.status).toBe(200);
    expect(mockQueuePasswordResetEmail).toHaveBeenCalledTimes(1);
    expect(reset.status).toBe(200);
    expect(login.status).toBe(200);
    expect(login.body.user).toMatchObject({ hasPassword: true, hasGoogle: true });
    const user = await db.user.findUniqueOrThrow({ where: { email: "google@test.com" } });
    expect(user.googleId).toBe("g-1");
  });

  it("pedido de reset responde igual para conta com senha, conta Google, conta excluída e email desconhecido", async () => {
    await createGoogleUser();
    await db.user.create({
      data: { email: "senha@test.com", name: "Conta Senha", password: await AuthService.hashPassword("x"), emailVerifiedAt: new Date() },
    });
    await db.user.create({
      data: { email: "excluida@test.com", name: "Conta Excluida", deletedAt: new Date() },
    });

    const responses = await Promise.all(
      ["google@test.com", "senha@test.com", "excluida@test.com", "ninguem@test.com"].map((email) =>
        request(app).post("/api/auth/request-password-reset").send({ email })
      )
    );

    expect(responses.map((r) => r.status)).toEqual([200, 200, 200, 200]);
    expect(new Set(responses.map((r) => JSON.stringify(r.body))).size).toBe(1);
    expect(mockQueuePasswordResetEmail.mock.calls.map((call) => call[2]).sort()).toEqual([
      "google@test.com",
      "senha@test.com",
    ]);
  });

  it("login de conta só com Google responde igual a email desconhecido", async () => {
    await createGoogleUser();

    const google = await request(app).post("/api/auth/login").send({ email: "google@test.com", password: "Qualquer1" });
    const unknown = await request(app).post("/api/auth/login").send({ email: "ninguem@test.com", password: "Qualquer1" });

    expect(google.status).toBe(401);
    expect(google.body).toEqual(unknown.body);
  });

  it("corpo inválido responde 400, não 500", async () => {
    const badEmail = await request(app).post("/api/auth/request-password-reset").send({ email: "nao-e-email" });
    const noToken = await request(app).post("/api/auth/reset-password").send({ newPassword: "SenhaNova1" });

    expect(badEmail.status).toBe(400);
    expect(badEmail.body.error).toBe("VALIDATION_ERROR");
    expect(noToken.status).toBe(400);
    expect(noToken.body.error).toBe("VALIDATION_ERROR");
  });

  it("link já usado responde com mensagem que fala em link, não em token", async () => {
    await createGoogleUser();
    await request(app).post("/api/auth/request-password-reset").send({ email: "google@test.com" });
    const token = lastQueuedToken();
    await request(app).post("/api/auth/reset-password").send({ token, newPassword: "SenhaNova1" });

    const reused = await request(app).post("/api/auth/reset-password").send({ token, newPassword: "SenhaNova2" });

    expect(reused.status).toBe(400);
    expect(reused.body.error).toBe("TOKEN_ALREADY_USED");
    expect(reused.body.message).toMatch(/link/i);
    expect(reused.body.message).not.toMatch(/token/i);
  });
});
