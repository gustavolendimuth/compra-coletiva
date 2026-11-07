const mockUserFindUnique = jest.fn();
jest.mock("../../index", () => ({
  prisma: { user: { findUnique: mockUserFindUnique } },
}));

import { authenticateSocket } from "../socketService";
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
});
