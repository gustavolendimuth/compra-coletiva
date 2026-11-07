import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPost = vi.fn();
vi.mock("../client", () => ({
  authClient: { post: (...args: unknown[]) => mockPost(...args) },
}));
vi.mock("../../lib/socket", () => ({ updateSocketToken: vi.fn() }));

import { refreshSession } from "../refreshSession";
import { authStorage } from "../../lib/authStorage";

const user = { id: "u1", email: "u@test.com", name: "U", role: "CUSTOMER" as const };

describe("refreshSession", () => {
  beforeEach(() => {
    mockPost.mockReset();
    authStorage.clearAuth();
  });

  it("single refresh in flight: two concurrent calls make one POST /auth/refresh", async () => {
    let resolvePost!: (value: unknown) => void;
    mockPost.mockReturnValue(new Promise((resolve) => (resolvePost = resolve)));

    const first = refreshSession();
    const second = refreshSession();
    resolvePost({ data: { accessToken: "fresh-token", user } });

    const [a, b] = await Promise.all([first, second]);
    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(mockPost).toHaveBeenCalledWith("/auth/refresh");
    expect(a.accessToken).toBe("fresh-token");
    expect(b.accessToken).toBe("fresh-token");
    expect(authStorage.getAccessToken()).toBe("fresh-token");
  });

  it("single refresh in flight: a later call after completion makes a new POST", async () => {
    mockPost.mockResolvedValue({ data: { accessToken: "t1", user } });
    await refreshSession();
    mockPost.mockResolvedValue({ data: { accessToken: "t2", user } });
    await refreshSession();
    expect(mockPost).toHaveBeenCalledTimes(2);
    expect(authStorage.getAccessToken()).toBe("t2");
  });
});
