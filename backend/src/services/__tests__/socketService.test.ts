import { createServer, Server as HttpServer } from "http";
import { AddressInfo } from "net";
import { io as connectClient, Socket as ClientSocket } from "socket.io-client";

// ── Mocks ───────────────────────────────────────────────────────────────────

const mockUserFindUnique = jest.fn();
const mockOrderFindUnique = jest.fn();
const mockOrderFindFirst = jest.fn();
jest.mock("../../index", () => ({
  prisma: {
    user: { findUnique: mockUserFindUnique },
    order: { findUnique: mockOrderFindUnique, findFirst: mockOrderFindFirst },
  },
}));

import {
  initializeSocket,
  getIO,
  emitMessageSent,
  emitOrderCreated,
  emitOrderUpdated,
  emitOrderDeleted,
  emitOrderStatusChanged,
  emitCampaignUpdated,
  emitCampaignMessagePublished,
  emitCampaignMessageDeleted,
} from "../socketService";
import { TokenService } from "../tokenService";

// ── Fixtures ────────────────────────────────────────────────────────────────

type TestUser = { id: string; email: string; role: string; name: string };

const users: Record<string, TestUser> = {
  owner: { id: "owner-1", email: "owner@test.com", role: "CUSTOMER", name: "Owner" },
  creator: { id: "creator-1", email: "creator@test.com", role: "CAMPAIGN_CREATOR", name: "Creator" },
  admin: { id: "admin-1", email: "admin@test.com", role: "ADMIN", name: "Admin" },
  stranger: { id: "stranger-1", email: "stranger@test.com", role: "CUSTOMER", name: "Stranger" },
};

const ORDER_ID = "order-1";
const CAMPAIGN_ID = "campaign-1";

const tokenFor = (user: TestUser) =>
  TokenService.generateAccessToken({ userId: user.id, email: user.email, role: user.role } as never);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitUntil(condition: () => boolean | Promise<boolean>, timeoutMs = 2000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await condition()) return;
    await sleep(10);
  }
  throw new Error("waitUntil timed out");
}

// ── Server setup ────────────────────────────────────────────────────────────

let httpServer: HttpServer;
let url: string;
const clients: ClientSocket[] = [];

beforeAll(async () => {
  httpServer = createServer();
  initializeSocket(httpServer);
  await new Promise<void>((resolve) => httpServer.listen(0, resolve));
  url = `http://localhost:${(httpServer.address() as AddressInfo).port}`;
});

afterAll(async () => {
  getIO().close();
  await new Promise<void>((resolve) => httpServer.close(() => resolve()));
});

beforeEach(() => {
  mockUserFindUnique.mockReset();
  mockOrderFindUnique.mockReset();
  mockOrderFindFirst.mockReset();
  mockUserFindUnique.mockImplementation(({ where }: { where: { id: string } }) =>
    Promise.resolve(Object.values(users).find((u) => u.id === where.id) ?? null)
  );
  mockOrderFindUnique.mockImplementation(({ where }: { where: { id: string } }) =>
    Promise.resolve(
      where.id === ORDER_ID
        ? { id: ORDER_ID, userId: users.owner.id, campaign: { creatorId: users.creator.id } }
        : null
    )
  );
});

afterEach(() => {
  while (clients.length) clients.pop()!.disconnect();
});

async function connect(user?: TestUser): Promise<ClientSocket> {
  const socket = connectClient(url, {
    transports: ["websocket"],
    forceNew: true,
    auth: user ? { token: tokenFor(user) } : {},
  });
  clients.push(socket);
  await new Promise<void>((resolve, reject) => {
    socket.on("connect", () => resolve());
    socket.on("connect_error", reject);
  });
  if (user) {
    // aguarda o auto-join da sala do usuário
    await waitUntil(async () => (await getIO().in(`user-${user.id}`).fetchSockets()).length > 0);
  }
  return socket;
}

async function roomSize(room: string) {
  return (await getIO().in(room).fetchSockets()).length;
}

function captureEvent(socket: ClientSocket, event: string) {
  const received: unknown[] = [];
  socket.on(event, (payload: unknown) => received.push(payload));
  return received;
}

async function joinOrderDenied(socket: ClientSocket) {
  const received = captureEvent(socket, "message-sent");
  socket.emit("join-order", ORDER_ID);
  await waitUntil(() => mockOrderFindUnique.mock.calls.length > 0 || !socket.connected, 500).catch(() => undefined);
  await sleep(100);
  expect(await roomSize(`order-${ORDER_ID}`)).toBe(0);
  emitMessageSent(ORDER_ID, { id: "msg-1", message: "segredo" });
  await sleep(100);
  expect(received).toHaveLength(0);
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("socket join-order", () => {
  it.each([
    ["anonymous", undefined],
    ["stranger", users.stranger],
  ])("%s join-order does not join the order room nor receive message-sent", async (_label, user) => {
    const socket = await connect(user);
    await joinOrderDenied(socket);
  });

  it.each(["owner", "creator", "admin"])("allowed join-order: %s receives message-sent", async (role) => {
    const socket = await connect(users[role]);
    const received = captureEvent(socket, "message-sent");
    socket.emit("join-order", ORDER_ID);
    await waitUntil(async () => (await roomSize(`order-${ORDER_ID}`)) === 1);
    emitMessageSent(ORDER_ID, { id: "msg-1", message: "oi" });
    await waitUntil(() => received.length === 1);
    expect(received[0]).toEqual({ id: "msg-1", message: "oi" });
  });
});

describe("campaign room events", () => {
  const fullOrder = {
    id: ORDER_ID,
    campaignId: CAMPAIGN_ID,
    paymentProofUrl: "https://bucket/proof.png",
    customer: { name: "Fulano", email: "fulano@test.com" },
    campaign: { pixKey: "123", pixName: "Fulano", pixType: "CPF" },
  };

  it.each([
    ["order-created", () => emitOrderCreated(CAMPAIGN_ID, ORDER_ID)],
    ["order-updated", () => emitOrderUpdated(CAMPAIGN_ID, ORDER_ID)],
    ["order-deleted", () => emitOrderDeleted(CAMPAIGN_ID, ORDER_ID)],
    ["order-status-changed", () => emitOrderStatusChanged(CAMPAIGN_ID, ORDER_ID)],
  ])("order event payload: %s carries only { orderId, campaignId }", async (event, emit) => {
    const socket = await connect();
    const received = captureEvent(socket, event);
    socket.emit("join-campaign", CAMPAIGN_ID);
    await waitUntil(async () => (await roomSize(`campaign-${CAMPAIGN_ID}`)) === 1);
    emit();
    await waitUntil(() => received.length === 1);
    expect(received[0]).toEqual({ orderId: ORDER_ID, campaignId: CAMPAIGN_ID });
  });

  const updatedAt = new Date("2026-01-01T00:00:00.000Z");
  const strippedOrder = { id: ORDER_ID, campaignId: CAMPAIGN_ID, customer: { name: "Fulano" }, campaign: {} };

  it.each([
    [
      "campaign-updated",
      () => emitCampaignUpdated(CAMPAIGN_ID, { status: "ARCHIVED", updatedAt, campaign: fullOrder.campaign, order: fullOrder }),
      { status: "ARCHIVED", updatedAt: updatedAt.toISOString(), campaign: {}, order: strippedOrder },
    ],
    [
      "campaign-message-published",
      () => emitCampaignMessagePublished(CAMPAIGN_ID, { messageId: "m", sender: { id: "u", name: "N", email: "x@y.z" }, list: [fullOrder] }),
      { messageId: "m", sender: { id: "u", name: "N" }, list: [strippedOrder] },
    ],
    [
      "campaign-message-deleted",
      () => emitCampaignMessageDeleted(CAMPAIGN_ID, { messageId: "m", extra: { paymentProofKey: "k" } }),
      { messageId: "m", extra: {} },
    ],
  ])("campaign room never carries sensitive keys: %s", async (event, emit, expected) => {
    const socket = await connect();
    const received = captureEvent(socket, event);
    socket.emit("join-campaign", CAMPAIGN_ID);
    await waitUntil(async () => (await roomSize(`campaign-${CAMPAIGN_ID}`)) === 1);
    emit();
    await waitUntil(() => received.length === 1);
    expect(received[0]).toEqual(expected);
  });
});

describe("creator-typing", () => {
  it("creator-typing to a user without order in the emitter's campaigns is not delivered", async () => {
    mockOrderFindFirst.mockResolvedValue(null);
    const target = await connect(users.stranger);
    const received = captureEvent(target, "creator-typing");
    const emitter = await connect(users.creator);
    emitter.emit("creator-typing", { userId: users.stranger.id, isTyping: true });
    await waitUntil(() => mockOrderFindFirst.mock.calls.length > 0);
    await sleep(100);
    expect(received).toHaveLength(0);
    expect(mockOrderFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: users.stranger.id, campaign: { creatorId: users.creator.id } },
      })
    );
  });

  it("creator-typing to a user with order in the emitter's campaign is delivered", async () => {
    mockOrderFindFirst.mockResolvedValue({ id: ORDER_ID });
    const target = await connect(users.owner);
    const received = captureEvent(target, "creator-typing");
    const emitter = await connect(users.creator);
    emitter.emit("creator-typing", { userId: users.owner.id, isTyping: true });
    await waitUntil(() => received.length === 1);
    expect(received[0]).toEqual({ creatorId: users.creator.id, creatorName: users.creator.name, isTyping: true });
  });
});
