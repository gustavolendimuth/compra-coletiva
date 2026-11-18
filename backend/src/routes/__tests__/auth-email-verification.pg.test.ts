import express from "express";
import cookieParser from "cookie-parser";
import request from "supertest";
import { createPgClient, resetOrderTables } from "../../__tests__/pgClient";
import { AuthService } from "../../services/authService";
import { TokenService } from "../../services/tokenService";

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
const mockQueueSignupVerificationEmail = jest.fn();
const mockQueueWelcomeEmail = jest.fn();
jest.mock("../../services/email/emailQueue", () => ({
  queueWelcomeEmail: (...args: unknown[]) => mockQueueWelcomeEmail(...args),
  queuePasswordResetEmail: jest.fn(),
  queueSignupVerificationEmail: (...args: unknown[]) => mockQueueSignupVerificationEmail(...args),
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

const registration = (email: string, overrides: Record<string, unknown> = {}) => ({
  name: "Maria Silva",
  email,
  password: "SenhaForte1",
  phone: "11987654321",
  acceptTerms: true,
  acceptPrivacy: true,
  ...overrides,
});

const pendingBody = {
  message: "Enviamos um link de confirmação para o seu email. Abra-o para ativar sua conta.",
};

// Token cru que o cadastro mandou por email (último enfileirado)
const lastQueuedToken = () => mockQueueSignupVerificationEmail.mock.calls.at(-1)?.[3] as string;

describe("Verificação de email do cadastro", () => {
  const app = createApp();

  beforeEach(async () => {
    await resetOrderTables(db);
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it("cadastro novo responde 202 sem sessão e envia link cujo hash fica no banco", async () => {
    const res = await request(app).post("/api/auth/register").send(registration("nova@test.com"));

    expect(res.status).toBe(202);
    expect(res.body).toEqual({ ...pendingBody, email: "nova@test.com" });
    expect(res.headers["set-cookie"]).toBeUndefined();

    const user = await db.user.findUniqueOrThrow({ where: { email: "nova@test.com" } });
    expect(user.emailVerifiedAt).toBeNull();
    expect(mockQueueSignupVerificationEmail).toHaveBeenCalledTimes(1);
    expect(user.emailVerificationToken).toBe(TokenService.hashToken(lastQueuedToken()));
    expect(await db.session.count()).toBe(0);
  });

  it("cadastro com email de conta verificada responde igual e não altera a conta nem envia email", async () => {
    const hash = await AuthService.hashPassword("senha-original");
    await db.user.create({
      data: { email: "dono@test.com", name: "Dono Conta", password: hash, emailVerifiedAt: new Date() },
    });

    const res = await request(app).post("/api/auth/register").send(registration("dono@test.com"));

    expect(res.status).toBe(202);
    expect(res.body).toEqual({ ...pendingBody, email: "dono@test.com" });
    expect(mockQueueSignupVerificationEmail).not.toHaveBeenCalled();
    const user = await db.user.findUniqueOrThrow({ where: { email: "dono@test.com" } });
    expect(user.password).toBe(hash);
  });

  it("cadastro com email de usuário legado assume a conta pendente (mesmo id) e envia link", async () => {
    const legacy = await db.user.create({
      data: { email: "legado@test.com", name: "Legado", isLegacyUser: true },
    });

    const res = await request(app).post("/api/auth/register").send(registration("legado@test.com"));

    expect(res.status).toBe(202);
    const user = await db.user.findUniqueOrThrow({ where: { email: "legado@test.com" } });
    expect(user.id).toBe(legacy.id);
    expect(user.isLegacyUser).toBe(false);
    expect(user.password).not.toBeNull();
    expect(user.emailVerifiedAt).toBeNull();
    expect(mockQueueSignupVerificationEmail).toHaveBeenCalledTimes(1);
  });

  it("novo cadastro sobre conta pendente invalida o link anterior", async () => {
    await request(app).post("/api/auth/register").send(registration("pendente@test.com"));
    const firstToken = lastQueuedToken();
    await request(app).post("/api/auth/register").send(registration("pendente@test.com", { password: "OutraSenha2" }));

    const res = await request(app).post("/api/auth/verify-email").send({ token: firstToken });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("INVALID_TOKEN");
  });

  it("login com senha certa e email não confirmado responde 403 EMAIL_NOT_VERIFIED; senha errada segue 401", async () => {
    await request(app).post("/api/auth/register").send(registration("pendente@test.com"));

    const right = await request(app)
      .post("/api/auth/login")
      .send({ email: "pendente@test.com", password: "SenhaForte1" });
    const wrong = await request(app)
      .post("/api/auth/login")
      .send({ email: "pendente@test.com", password: "senha-errada" });

    expect(right.status).toBe(403);
    expect(right.body.error).toBe("EMAIL_NOT_VERIFIED");
    expect(right.headers["set-cookie"]).toBeUndefined();
    expect(wrong.status).toBe(401);
    expect(wrong.body.error).toBe("INVALID_CREDENTIALS");
  });

  it("confirmar o link abre a sessão, envia boas-vindas e libera o login", async () => {
    await request(app).post("/api/auth/register").send(registration("pendente@test.com"));

    const res = await request(app).post("/api/auth/verify-email").send({ token: lastQueuedToken() });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({ email: "pendente@test.com", name: "Maria Silva" });
    expect(res.headers["set-cookie"]?.[0]).toMatch(/^refreshToken=/);
    expect(mockQueueWelcomeEmail).toHaveBeenCalledTimes(1);

    const user = await db.user.findUniqueOrThrow({ where: { email: "pendente@test.com" } });
    expect(user.emailVerifiedAt).toBeInstanceOf(Date);
    expect(user.emailVerificationToken).toBeNull();

    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "pendente@test.com", password: "SenhaForte1" });
    expect(login.status).toBe(200);
  });

  it("link usado de novo ou expirado responde 400 INVALID_TOKEN", async () => {
    await request(app).post("/api/auth/register").send(registration("pendente@test.com"));
    const token = lastQueuedToken();
    await request(app).post("/api/auth/verify-email").send({ token });

    const reused = await request(app).post("/api/auth/verify-email").send({ token });

    await request(app).post("/api/auth/register").send(registration("expira@test.com"));
    const expiredToken = lastQueuedToken();
    await db.user.update({
      where: { email: "expira@test.com" },
      data: { emailVerificationExpires: new Date(Date.now() - 1000) },
    });
    const expired = await request(app).post("/api/auth/verify-email").send({ token: expiredToken });

    expect(reused.status).toBe(400);
    expect(reused.body.error).toBe("INVALID_TOKEN");
    expect(expired.status).toBe(400);
    expect(expired.body.error).toBe("INVALID_TOKEN");
  });

  it("duas confirmações simultâneas do mesmo link: exatamente uma abre sessão", async () => {
    await request(app).post("/api/auth/register").send(registration("pendente@test.com"));
    const token = lastQueuedToken();

    const results = await Promise.all([
      request(app).post("/api/auth/verify-email").send({ token }),
      request(app).post("/api/auth/verify-email").send({ token }),
    ]);

    expect(results.map((r) => r.status).sort()).toEqual([200, 400]);
    expect(await db.session.count()).toBe(1);
  });

  it("reenvio gera link novo só para cadastro pendente, com a mesma resposta para qualquer email", async () => {
    await request(app).post("/api/auth/register").send(registration("pendente@test.com"));
    const oldToken = lastQueuedToken();
    await db.user.create({ data: { email: "ok@test.com", name: "Ok Ok", password: "x", emailVerifiedAt: new Date() } });
    mockQueueSignupVerificationEmail.mockClear();

    const pending = await request(app).post("/api/auth/resend-verification").send({ email: "pendente@test.com" });
    const verified = await request(app).post("/api/auth/resend-verification").send({ email: "ok@test.com" });
    const unknown = await request(app).post("/api/auth/resend-verification").send({ email: "ninguem@test.com" });

    expect([pending.status, verified.status, unknown.status]).toEqual([200, 200, 200]);
    expect(verified.body).toEqual(pending.body);
    expect(unknown.body).toEqual(pending.body);
    expect(mockQueueSignupVerificationEmail).toHaveBeenCalledTimes(1);

    const old = await request(app).post("/api/auth/verify-email").send({ token: oldToken });
    const fresh = await request(app).post("/api/auth/verify-email").send({ token: lastQueuedToken() });
    expect(old.status).toBe(400);
    expect(fresh.status).toBe(200);
  });

  it("reset de senha concluído marca o email como confirmado", async () => {
    await request(app).post("/api/auth/register").send(registration("pendente@test.com"));
    const user = await db.user.findUniqueOrThrow({ where: { email: "pendente@test.com" } });
    await db.passwordResetToken.create({
      data: {
        userId: user.id,
        token: TokenService.hashToken("reset-token"),
        expiresAt: new Date(Date.now() + 60_000),
      },
    });

    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: "reset-token", newPassword: "NovaSenha3" });

    expect(res.status).toBe(200);
    const after = await db.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(after.emailVerifiedAt).toBeInstanceOf(Date);
    expect(after.emailVerificationToken).toBeNull();
  });
});
