import express from "express";
import request from "supertest";
import { createPgClient, resetOrderTables } from "../../__tests__/pgClient";
import { TokenService } from "../../services/tokenService";

const db = createPgClient();
jest.mock("../../index", () => ({ prisma: db }));

const mockQueueEmailVerificationEmail = jest.fn();
jest.mock("../../services/email/emailQueue", () => ({
  queueEmailVerificationEmail: (...args: unknown[]) => mockQueueEmailVerificationEmail(...args),
}));
jest.mock("../../services/imageUploadService", () => ({ ImageUploadService: { deleteImage: jest.fn() } }));
jest.mock("../../services/legalAcceptanceService", () => ({
  LegalAcceptanceService: { recordAcceptance: jest.fn() },
}));

// profile.ts cria o próprio PrismaClient: aponta para o banco descartável
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const profileRouter = require("../profile").default;

function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/profile", profileRouter);
  return app;
}

// Token cru que o pedido de troca mandou por email (último enfileirado)
const lastQueuedToken = () => mockQueueEmailVerificationEmail.mock.calls.at(-1)?.[2] as string;

describe("Troca de email", () => {
  const app = createApp();
  let authHeader: string;

  beforeEach(async () => {
    await resetOrderTables(db);
    // conta Google (sem senha): a troca não pede senha
    const user = await db.user.create({
      data: {
        id: "user-1",
        email: "antigo@test.com",
        name: "Maria Silva",
        googleId: "g-1",
        emailVerifiedAt: new Date("2026-01-01"),
        legalAcceptanceRequired: false,
      },
    });
    const accessToken = TokenService.generateAccessToken({ userId: user.id, email: user.email, role: user.role });
    authHeader = `Bearer ${accessToken}`;
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  const requestChange = (newEmail: string) =>
    request(app).post("/api/profile/change-email").set("Authorization", authHeader).send({ newEmail });

  it("guarda só o hash do token; o link do email confirma a troca e marca o email como confirmado", async () => {
    const before = Date.now();
    await requestChange("novo@test.com");
    const token = lastQueuedToken();

    const pending = await db.user.findUniqueOrThrow({ where: { id: "user-1" } });
    expect(pending.pendingEmailToken).toBe(TokenService.hashToken(token));
    expect(pending.pendingEmailToken).not.toBe(token);

    const res = await request(app).post("/api/profile/verify-email").send({ token });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Email atualizado com sucesso", newEmail: "novo@test.com" });
    const user = await db.user.findUniqueOrThrow({ where: { id: "user-1" } });
    expect(user.email).toBe("novo@test.com");
    expect(user.emailVerifiedAt!.getTime()).toBeGreaterThanOrEqual(before);
    expect(user).toMatchObject({ pendingEmail: null, pendingEmailToken: null, pendingEmailExpires: null });
  });

  it("o hash guardado no banco não serve como link", async () => {
    await requestChange("novo@test.com");
    const stored = (await db.user.findUniqueOrThrow({ where: { id: "user-1" } })).pendingEmailToken!;

    const res = await request(app).post("/api/profile/verify-email").send({ token: stored });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("INVALID_TOKEN");
  });

  it("link expirado ou já usado responde 400 INVALID_TOKEN sem trocar o email", async () => {
    await requestChange("novo@test.com");
    const token = lastQueuedToken();
    await db.user.update({ where: { id: "user-1" }, data: { pendingEmailExpires: new Date(Date.now() - 1000) } });

    const expired = await request(app).post("/api/profile/verify-email").send({ token });

    await requestChange("outro@test.com");
    const freshToken = lastQueuedToken();
    await request(app).post("/api/profile/verify-email").send({ token: freshToken });
    const reused = await request(app).post("/api/profile/verify-email").send({ token: freshToken });

    expect(expired.status).toBe(400);
    expect(expired.body.error).toBe("INVALID_TOKEN");
    expect(reused.status).toBe(400);
    expect(reused.body.error).toBe("INVALID_TOKEN");
    expect((await db.user.findUniqueOrThrow({ where: { id: "user-1" } })).email).toBe("outro@test.com");
  });

  it("confirmações simultâneas do mesmo link: exatamente uma troca o email", async () => {
    await requestChange("novo@test.com");
    const token = lastQueuedToken();

    const results = await Promise.all(
      Array.from({ length: 10 }, () => request(app).post("/api/profile/verify-email").send({ token }))
    );

    expect(results.filter((r) => r.status === 200)).toHaveLength(1);
    expect(results.filter((r) => r.status === 400)).toHaveLength(9);
  });

  it("email ocupado por outra conta depois do pedido: 400 EMAIL_IN_USE e a troca continua pendente", async () => {
    await requestChange("novo@test.com");
    const token = lastQueuedToken();
    await db.user.create({ data: { email: "novo@test.com", name: "Outra Pessoa" } });

    const res = await request(app).post("/api/profile/verify-email").send({ token });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("EMAIL_IN_USE");
    expect((await db.user.findUniqueOrThrow({ where: { id: "user-1" } })).email).toBe("antigo@test.com");
  });
});

describe("Troca de email: senha", () => {
  const app = createApp();

  afterAll(async () => {
    await db.$disconnect();
  });

  const authFor = (user: { id: string; email: string; role: string }) =>
    `Bearer ${TokenService.generateAccessToken({ userId: user.id, email: user.email, role: user.role })}`;

  it("conta só Google pede a troca sem senha; conta com senha precisa da senha certa", async () => {
    await resetOrderTables(db);
    const googleUser = await db.user.create({
      data: { email: "google@test.com", name: "Conta Google", googleId: "g-9", legalAcceptanceRequired: false },
    });
    const { AuthService } = await import("../../services/authService");
    const passwordUser = await db.user.create({
      data: {
        email: "senha@test.com",
        name: "Conta Senha",
        password: await AuthService.hashPassword("SenhaForte1"),
        legalAcceptanceRequired: false,
      },
    });

    const google = await request(app)
      .post("/api/profile/change-email")
      .set("Authorization", authFor(googleUser))
      .send({ newEmail: "  Novo.Google@Test.com " });
    const withoutPassword = await request(app)
      .post("/api/profile/change-email")
      .set("Authorization", authFor(passwordUser))
      .send({ newEmail: "novo.senha@test.com" });
    const withPassword = await request(app)
      .post("/api/profile/change-email")
      .set("Authorization", authFor(passwordUser))
      .send({ newEmail: "novo.senha@test.com", password: "SenhaForte1" });

    expect(google.status).toBe(200);
    expect((await db.user.findUniqueOrThrow({ where: { id: googleUser.id } })).pendingEmail).toBe("novo.google@test.com");
    expect(withoutPassword.status).toBe(401);
    expect(withoutPassword.body.error).toBe("INVALID_PASSWORD");
    expect(withPassword.status).toBe(200);
  });
});

describe("Migration hash_pending_email_token", () => {
  afterAll(async () => {
    await db.$disconnect();
  });

  it("converte o token pendente cru no mesmo hash do TokenService: o link já enviado continua valendo", async () => {
    await resetOrderTables(db);
    const rawToken = "a1b2c3-token-cru-enviado-antes-do-deploy";
    await db.user.create({
      data: {
        id: "legacy-pending",
        email: "antes@test.com",
        name: "Pedido Antigo",
        pendingEmail: "depois@test.com",
        pendingEmailToken: rawToken,
        pendingEmailExpires: new Date(Date.now() + 60_000),
        legalAcceptanceRequired: false,
      },
    });
    const sql = (await import("fs")).readFileSync(
      require.resolve("../../../prisma/migrations/20261118120000_hash_pending_email_token/migration.sql"),
      "utf8"
    );

    await db.$executeRawUnsafe(sql);

    const user = await db.user.findUniqueOrThrow({ where: { id: "legacy-pending" } });
    expect(user.pendingEmailToken).toBe(TokenService.hashToken(rawToken));
    const res = await request(createApp()).post("/api/profile/verify-email").send({ token: rawToken });
    expect(res.status).toBe(200);
  });
});
