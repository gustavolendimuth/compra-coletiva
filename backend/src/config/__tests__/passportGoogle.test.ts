type VerifyFn = (
  accessToken: string,
  refreshToken: string,
  profile: unknown,
  done: (err: unknown, user?: unknown, info?: unknown) => void
) => Promise<void>;

let mockVerify: VerifyFn | undefined;
jest.mock("passport-google-oauth20", () => ({
  Strategy: jest.fn().mockImplementation((_opts: unknown, verify: VerifyFn) => {
    mockVerify = verify;
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
  // o próprio client faz o papel de `tx`
  $transaction: jest.fn(async (fn: (tx: unknown) => unknown) => fn(mockPrisma)),
};
jest.mock("../../index", () => ({ prisma: mockPrisma }));
jest.mock("../../services/email/emailQueue", () => ({ queueWelcomeEmail: jest.fn() }));

process.env.GOOGLE_CLIENT_ID = "test-client";
process.env.GOOGLE_CLIENT_SECRET = "test-secret";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { configurePassport } = require("../passport");
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
});
