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

const mockTx = { user: { update: jest.fn(), create: jest.fn() } };
const mockPrisma = {
  user: { findUnique: jest.fn(), update: jest.fn(), create: jest.fn() },
  $transaction: jest.fn(async (fn: (tx: typeof mockTx) => unknown) => fn(mockTx)),
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

const allUserUpdates = () => [
  ...mockPrisma.user.update.mock.calls,
  ...mockTx.user.update.mock.calls,
];

describe("Google strategy verify", () => {
  it("deleted user is not reactivated: stays deleted and a new account is created", async () => {
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
    mockTx.user.create.mockResolvedValue(newUser);
    mockPrisma.user.update.mockResolvedValue({ ...deletedUser, googleId: null });
    mockTx.user.update.mockResolvedValue({ ...deletedUser, googleId: null });

    const { err, user } = await runVerify(googleProfile(true));

    expect(err).toBeNull();
    expect((user as { id: string }).id).toBe("new-user");
    for (const [args] of allUserUpdates()) {
      expect(args.data).not.toHaveProperty("deletedAt", null);
      expect(args.data).not.toHaveProperty("deletedReason", null);
    }
    const creates = [...mockPrisma.user.create.mock.calls, ...mockTx.user.create.mock.calls];
    expect(creates).toHaveLength(1);
    expect(creates[0][0].data).toMatchObject({ email: "maria@test.com", googleId: "google-123" });
  });

  it("unverified email is not linked to an existing local account", async () => {
    const localUser = {
      id: "local-user",
      email: "maria@test.com",
      googleId: null,
      deletedAt: null,
      password: "hash",
      name: "Maria Silva",
    };
    mockPrisma.user.findUnique.mockImplementation(async ({ where }: { where: Record<string, string> }) => {
      if (where.email === "maria@test.com") return localUser;
      return null;
    });

    const { err, user, info } = await runVerify(googleProfile(false));

    expect(err).toBeNull();
    expect(user).toBe(false);
    expect(info).toEqual({ message: "email_not_verified" });
    expect(allUserUpdates()).toHaveLength(0);
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
  });

  it("verified email still links to an existing local account", async () => {
    const localUser = { id: "local-user", email: "maria@test.com", googleId: null, deletedAt: null };
    mockPrisma.user.findUnique.mockImplementation(async ({ where }: { where: Record<string, string> }) =>
      where.email === "maria@test.com" ? localUser : null
    );
    mockPrisma.user.update.mockResolvedValue({ ...localUser, googleId: "google-123" });

    const { user } = await runVerify(googleProfile(true));

    expect((user as { id: string }).id).toBe("local-user");
    expect(mockPrisma.user.update.mock.calls[0][0].data).toMatchObject({ googleId: "google-123" });
  });
});
