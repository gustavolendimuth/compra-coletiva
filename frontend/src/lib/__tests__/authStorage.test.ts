import { describe, expect, it } from "vitest";
import { authStorage } from "../authStorage";

function mockUnavailableStorage() {
  const throwSecurityError = () => {
    throw new DOMException(
      "The operation is insecure.",
      "SecurityError"
    );
  };

  Object.defineProperty(window, "localStorage", {
    configurable: true,
    get: throwSecurityError,
  });

  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    get: throwSecurityError,
  });
}

describe("authStorage", () => {
  it("does not throw when localStorage is unavailable", () => {
    mockUnavailableStorage();

    expect(() => authStorage.getAccessToken()).not.toThrow();
    expect(() => authStorage.getUser()).not.toThrow();
    expect(() => authStorage.setAccessToken("token")).not.toThrow();
    expect(() =>
      authStorage.setUser({
        id: "user-id",
        email: "user@example.com",
        name: "Usuario",
        role: "CUSTOMER",
      })
    ).not.toThrow();
    expect(() => authStorage.clearAuth()).not.toThrow();
  });

  it("returns safe fallback values when localStorage is unavailable", () => {
    mockUnavailableStorage();

    expect(authStorage.getAccessToken()).toBeNull();
    expect(authStorage.getUser()).toBeNull();
    expect(authStorage.hasPendingAction()).toBe(false);
    expect(authStorage.getReturnUrl()).toBeNull();
    expect(authStorage.getPendingActionData()).toBeNull();
    expect(authStorage.isAuthenticated()).toBe(false);
  });
});

describe("authStorage access token", () => {
  it("keeps access token only in memory: not in localStorage nor in JS-readable cookies", () => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      writable: true,
      value: (() => {
        let store: Record<string, string> = {};
        return {
          getItem: (k: string) => (k in store ? store[k] : null),
          setItem: (k: string, v: string) => {
            store[k] = String(v);
          },
          removeItem: (k: string) => {
            delete store[k];
          },
          clear: () => {
            store = {};
          },
          key: (i: number) => Object.keys(store)[i] ?? null,
          get length() {
            return Object.keys(store).length;
          },
          dump: () => store,
        };
      })(),
    });

    const token = "eyJhbGciOiJIUzI1NiJ9.secret-access-token.sig";
    authStorage.setAuth(token, {
      id: "user-id",
      email: "user@example.com",
      name: "Usuario",
      role: "CUSTOMER",
    });

    const stored = (window.localStorage as unknown as { dump: () => Record<string, string> }).dump();
    expect(Object.values(stored).some((value) => value.includes(token))).toBe(false);
    expect(Object.keys(stored)).not.toContain("accessToken");
    expect(document.cookie).not.toContain(token);
    expect(document.cookie).not.toContain("secret-access-token");
    expect(document.cookie).toContain("auth-token=1");
    expect(authStorage.getAccessToken()).toBe(token);
    expect(authStorage.isAuthenticated()).toBe(true);

    authStorage.clearAuth();
    expect(authStorage.getAccessToken()).toBeNull();
    expect(document.cookie).not.toContain("auth-token=1");
  });
});
