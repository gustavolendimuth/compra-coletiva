const mockUserFindUnique = jest.fn();
jest.mock("../../index", () => ({
  prisma: { user: { findUnique: mockUserFindUnique } },
}));

import { authenticateSocket } from "../socketService";
import { TokenService } from "../tokenService";
import { captureConsole } from "../../__tests__/captureConsole";

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

  it("token of a user that no longer exists is refused", async () => {
    mockUserFindUnique.mockResolvedValue(null);
    const next = jest.fn();

    await authenticateSocket(makeSocket({ auth: { token: accessToken } }), next);

    expect(next).toHaveBeenCalledWith(new Error("User not found"));
  });

  describe("logs no email nor token", () => {
    let logs: ReturnType<typeof captureConsole>;

    beforeEach(() => {
      logs = captureConsole();
    });

    afterEach(() => {
      logs.restore();
    });

    it("logs no email on authenticated connection", async () => {
      mockUserFindUnique.mockResolvedValue(activeUser);
      await authenticateSocket(makeSocket({ auth: { token: accessToken } }), jest.fn());

      expect(logs.text()).not.toContain("u@test.com");
      expect(logs.text()).not.toContain(accessToken);
    });

    it("logs no email nor token when the database error quotes them", async () => {
      mockUserFindUnique.mockRejectedValue(new Error(`db down for u@test.com token ${accessToken}`));
      await authenticateSocket(makeSocket({ auth: { token: accessToken } }), jest.fn());

      expect(logs.text()).not.toContain("u@test.com");
      expect(logs.text()).not.toContain(accessToken);
    });
  });
});
