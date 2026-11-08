const mockUserFindUnique = jest.fn();
jest.mock("../../index", () => ({
  prisma: { user: { findUnique: mockUserFindUnique } },
}));

import { authenticateSocket } from "../socketService";
import { inspect } from "util";
import { TokenService } from "../tokenService";

type FakeSocket = Parameters<typeof authenticateSocket>[0];

const makeSocket = (handshake: { auth?: Record<string, unknown>; query?: Record<string, unknown> }) =>
  ({
    id: "socket-1",
    handshake: { auth: handshake.auth ?? {}, query: handshake.query ?? {} },
  }) as unknown as FakeSocket;

const accessToken = TokenService.generateAccessToken({
  userId: "user-1",
  email: "u@test.com",
  role: "CUSTOMER",
});

const activeUser = { id: "user-1", email: "u@test.com", role: "CUSTOMER", name: "U", deletedAt: null };

describe("authenticateSocket", () => {
  it("attaches the active user from handshake.auth.token", async () => {
    mockUserFindUnique.mockResolvedValue(activeUser);
    const socket = makeSocket({ auth: { token: accessToken } });
    const next = jest.fn();

    await authenticateSocket(socket, next);

    expect(next).toHaveBeenCalledWith();
    expect((socket as { user?: { id: string } }).user?.id).toBe("user-1");
  });

  it("deleted user is anonymous: no socket.user and next() without error", async () => {
    mockUserFindUnique.mockResolvedValue({ ...activeUser, deletedAt: new Date() });
    const socket = makeSocket({ auth: { token: accessToken } });
    const next = jest.fn();

    await authenticateSocket(socket, next);

    expect(next).toHaveBeenCalledWith();
    expect((socket as { user?: unknown }).user).toBeUndefined();
  });

  it("ignores query token: handshake.query.token does not authenticate", async () => {
    mockUserFindUnique.mockResolvedValue(activeUser);
    const socket = makeSocket({ query: { token: accessToken } });
    const next = jest.fn();

    await authenticateSocket(socket, next);

    expect(next).toHaveBeenCalledWith();
    expect((socket as { user?: unknown }).user).toBeUndefined();
    expect(mockUserFindUnique).not.toHaveBeenCalled();
  });

  describe("logs no email nor token", () => {
    const methods = ["log", "info", "warn", "error", "debug"] as const;
    let spies: jest.SpyInstance[];
    const logText = () =>
      spies
        .flatMap((spy) => spy.mock.calls)
        .map((args) => args.map((arg: unknown) => (typeof arg === "string" ? arg : inspect(arg, { depth: 10 }))).join(" "))
        .join("\n");

    beforeEach(() => {
      spies = methods.map((method) => jest.spyOn(console, method).mockImplementation(() => undefined));
    });

    afterEach(() => {
      spies.forEach((spy) => spy.mockRestore());
    });

    it("logs no email on authenticated connection", async () => {
      mockUserFindUnique.mockResolvedValue(activeUser);
      await authenticateSocket(makeSocket({ auth: { token: accessToken } }), jest.fn());

      expect(logText()).not.toContain("u@test.com");
      expect(logText()).not.toContain(accessToken);
    });

    it("logs no email nor token on invalid token", async () => {
      const bogus = `${accessToken}tampered`;
      await authenticateSocket(makeSocket({ auth: { token: bogus } }), jest.fn());

      expect(logText()).not.toContain(bogus);
      expect(logText()).not.toContain("u@test.com");
    });

    it("logs no email nor token when the database error quotes them", async () => {
      mockUserFindUnique.mockRejectedValue(new Error(`db down for u@test.com token ${accessToken}`));
      await authenticateSocket(makeSocket({ auth: { token: accessToken } }), jest.fn());

      expect(logText()).not.toContain("u@test.com");
      expect(logText()).not.toContain(accessToken);
    });
  });
});
