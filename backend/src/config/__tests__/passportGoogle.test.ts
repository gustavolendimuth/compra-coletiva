type VerifyFn = (
  accessToken: string,
  refreshToken: string,
  profile: unknown,
  done: (err: unknown, user?: unknown, info?: unknown) => void
) => Promise<void>;

let mockVerify: VerifyFn | undefined;
jest.mock("passport-google-oauth20", () => ({
  Strategy: jest.fn().mockImplementation((opts: { passReqToCallback?: boolean }, verify: VerifyFn) => {
    // a strategy "google-link" (passReqToCallback) é testada direto por verifyGoogleLink
    if (!opts.passReqToCallback) mockVerify = verify;
    return { name: "google", authenticate: jest.fn() };
  }),
}));
jest.mock("passport", () => ({
  use: jest.fn(),
  serializeUser: jest.fn(),
  deserializeUser: jest.fn(),
}));

const mockPrisma = {
  user: { findUnique: jest.fn(), update: jest.fn(), create: jest.fn() },
  session: { deleteMany: jest.fn() },
  // o próprio client faz o papel de `tx`
  $transaction: jest.fn(async (fn: (tx: unknown) => unknown) => fn(mockPrisma)),
};
jest.mock("../../index", () => ({ prisma: mockPrisma }));
jest.mock("../../services/email/emailQueue", () => ({ queueWelcomeEmail: jest.fn() }));

process.env.GOOGLE_CLIENT_ID = "test-client";
process.env.GOOGLE_CLIENT_SECRET = "test-secret";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { configurePassport, verifyGoogleLink } = require("../passport");
configurePassport();

const runVerify = (profile: unknown) =>
  new Promise<{ err: unknown; user: unknown; info: unknown }>((resolve) => {
    mockVerify!("at", "rt", profile, (err, user, info) => resolve({ err, user, info }));
  });

const googleProfile = (verified: boolean | string) => ({
  id: "google-123",
  displayName: "Maria Silva",
  emails: [{ value: "maria@test.com", verified }],
});

describe("Google strategy verify", () => {
  it("deleted user is not reactivated: googleId is released and a new account is created", async () => {
    const deletedUser = {
      id: "old-user",
      email: "deleted_1@deleted.local",
      googleId: "google-123",
      deletedAt: new Date("2026-01-01"),
      deletedReason: "Deletado por administrador",
      name: "Usuário Excluído",
    };
    const newUser = { id: "new-user", email: "maria@test.com", name: "Maria Silva" };
    mockPrisma.user.findUnique.mockImplementation(async ({ where }: { where: Record<string, string> }) => {
      if (where.googleId === "google-123") return deletedUser;
      return null;
    });
    mockPrisma.user.create.mockResolvedValue(newUser);
    mockPrisma.user.update.mockResolvedValue({ ...deletedUser, googleId: null });

    const { err, user } = await runVerify(googleProfile(true));

    expect(err).toBeNull();
    expect((user as { id: string }).id).toBe("new-user");
    expect(mockPrisma.user.update.mock.calls).toEqual([[{ where: { id: "old-user" }, data: { googleId: null } }]]);
    expect(mockPrisma.user.create).toHaveBeenCalledTimes(1);
    expect(mockPrisma.user.create.mock.calls[0][0].data).toMatchObject({ email: "maria@test.com", googleId: "google-123" });
  });

  const localUser = { id: "local-user", email: "maria@test.com", googleId: null, deletedAt: null, name: "Maria Silva" };
  // conta já ligada a este googleId, mas com outro e-mail: o e-mail do Google pertence a localUser
  const linkedUser = { id: "linked-user", email: "old@test.com", googleId: "google-123", deletedAt: null, name: "Maria Silva" };

  it.each([
    { name: "verified email still links to an existing local account", verified: true, byGoogleId: null, updatedIds: ["local-user"] },
    { name: 'verified email as the string "true" still links to an existing local account', verified: "true", byGoogleId: null, updatedIds: ["local-user"] },
    { name: "unverified email is not linked to an existing local account", verified: false, byGoogleId: null, updatedIds: [] },
    { name: "verified email moves the googleId to the account owning the email", verified: true, byGoogleId: linkedUser, updatedIds: ["linked-user", "local-user"] },
    { name: "unverified email does not move the googleId to the account owning the email", verified: false, byGoogleId: linkedUser, updatedIds: [] },
  ])("$name", async ({ verified, byGoogleId, updatedIds }) => {
    mockPrisma.user.findUnique.mockImplementation(async ({ where }: { where: Record<string, string> }) =>
      where.googleId ? byGoogleId : where.email === "maria@test.com" ? localUser : null
    );
    mockPrisma.user.update.mockImplementation(async ({ where, data }: { where: { id: string }; data: object }) => ({
      ...localUser,
      id: where.id,
      ...data,
    }));
    const linked = updatedIds.length > 0;

    const { err, user, info } = await runVerify(googleProfile(verified));

    expect(err).toBeNull();
    expect(user).toEqual(linked ? expect.objectContaining({ id: "local-user", googleId: "google-123" }) : false);
    expect(info).toEqual(linked ? undefined : { message: "email_not_verified" });
    expect(mockPrisma.user.update.mock.calls.map(([args]) => args.where.id)).toEqual(updatedIds);
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
  });

  it.each([
    {
      name: "linking a never-verified local account drops the password set by whoever registered it and its sessions",
      emailVerifiedAt: null,
      dropsPassword: true,
    },
    {
      name: "linking an already verified local account keeps its password and sessions",
      emailVerifiedAt: new Date("2026-01-01"),
      dropsPassword: false,
    },
  ])("$name", async ({ emailVerifiedAt, dropsPassword }) => {
    const account = { ...localUser, password: "attacker-hash", emailVerifiedAt };
    mockPrisma.user.findUnique.mockImplementation(async ({ where }: { where: Record<string, string> }) =>
      where.email === "maria@test.com" ? account : null
    );
    mockPrisma.user.update.mockImplementation(async ({ where, data }: { where: { id: string }; data: object }) => ({
      ...account,
      id: where.id,
      ...data,
    }));

    const { err, user } = await runVerify(googleProfile(true));

    expect(err).toBeNull();
    const linked = user as { password: string | null; emailVerifiedAt: Date | null };
    expect(linked.password).toBe(dropsPassword ? null : "attacker-hash");
    expect(linked.emailVerifiedAt).toBeInstanceOf(Date);
    expect(mockPrisma.session.deleteMany.mock.calls).toEqual(
      dropsPassword ? [[{ where: { userId: "local-user" } }]] : []
    );
  });
});

describe("Vincular Google à conta logada (google-link)", () => {
  const account = {
    id: "account-1",
    email: "maria@test.com",
    password: "senha-hash",
    googleId: null as string | null,
    deletedAt: null as Date | null,
    name: "Maria Silva",
  };

  const runLink = (profile: unknown, oauthLinkUserId: string | null = "account-1") =>
    new Promise<{ err: unknown; user: unknown; info: unknown }>((resolve) => {
      verifyGoogleLink({ oauthLinkUserId: oauthLinkUserId ?? undefined }, "at", "rt", profile, (err: unknown, user: unknown, info: unknown) =>
        resolve({ err, user, info })
      );
    });

  const mockUsers = (byId: object | null, byGoogleId: object | null = null) => {
    mockPrisma.user.findUnique.mockImplementation(async ({ where }: { where: Record<string, string> }) =>
      where.id ? byId : where.googleId ? byGoogleId : null
    );
    mockPrisma.user.update.mockImplementation(async ({ where, data }: { where: { id: string }; data: object }) => ({
      ...account,
      id: where.id,
      ...data,
    }));
  };

  it("Google com o mesmo email verificado vincula e mantém a senha da conta", async () => {
    mockUsers(account);

    const { err, user } = await runLink(googleProfile(true));

    expect(err).toBeNull();
    expect(user).toMatchObject({ id: "account-1", googleId: "google-123", password: "senha-hash" });
    expect(mockPrisma.user.update.mock.calls).toEqual([[{ where: { id: "account-1" }, data: { googleId: "google-123" } }]]);
    expect(mockPrisma.session.deleteMany).not.toHaveBeenCalled();
  });

  it("googleId preso a uma conta excluída é liberado e vinculado à conta logada", async () => {
    mockUsers(account, { id: "deleted-1", googleId: "google-123", deletedAt: new Date("2026-01-01") });

    const { user } = await runLink(googleProfile(true));

    expect(user).toMatchObject({ id: "account-1", googleId: "google-123" });
    expect(mockPrisma.user.update.mock.calls.map(([args]) => [args.where.id, args.data])).toEqual([
      ["deleted-1", { googleId: null }],
      ["account-1", { googleId: "google-123" }],
    ]);
  });

  it.each([
    { name: "sem conta logada", byId: null, byGoogleId: null, profile: googleProfile(true), message: "auth_required" },
    {
      name: "conta Google com outro email",
      byId: account,
      byGoogleId: null,
      profile: { ...googleProfile(true), emails: [{ value: "outra@test.com", verified: true }] },
      message: "email_mismatch",
    },
    { name: "email do Google não verificado", byId: account, byGoogleId: null, profile: googleProfile(false), message: "email_not_verified" },
    {
      name: "conta Google já vinculada a outra conta ativa",
      byId: account,
      byGoogleId: { id: "other-1", googleId: "google-123", deletedAt: null },
      profile: googleProfile(true),
      message: "google_in_use",
    },
    {
      name: "conta logada já vinculada a outra conta Google",
      byId: { ...account, googleId: "google-999" },
      byGoogleId: null,
      profile: googleProfile(true),
      message: "already_linked",
    },
  ])("não vincula: $name", async ({ byId, byGoogleId, profile, message }) => {
    mockUsers(byId, byGoogleId);

    const { err, user, info } = await runLink(profile);

    expect(err).toBeNull();
    expect(user).toBe(false);
    expect(info).toEqual({ message });
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  it("sem oauthLinkUserId na requisição responde auth_required sem consultar o banco", async () => {
    const { user, info } = await runLink(googleProfile(true), null);

    expect(user).toBe(false);
    expect(info).toEqual({ message: "auth_required" });
    expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
  });
});
