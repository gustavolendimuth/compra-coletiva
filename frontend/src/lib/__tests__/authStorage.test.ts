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

// O setup.ts reinstala um localStorage em memória antes de cada teste
const storedValues = () =>
  Array.from({ length: window.localStorage.length }, (_, i) => window.localStorage.getItem(window.localStorage.key(i)!));

describe("authStorage access token", () => {
  it("keeps access token only in memory: not in localStorage nor in JS-readable cookies", () => {
    // Versões anteriores gravavam o token aqui
    window.localStorage.setItem("accessToken", "legacy-token");
    const token = "eyJhbGciOiJIUzI1NiJ9.secret-access-token.sig";
    authStorage.setAuth(token, {
      id: "user-id",
      email: "user@example.com",
      name: "Usuario",
      role: "CUSTOMER",
    });

    expect(window.localStorage.getItem("accessToken")).toBeNull();
    expect(storedValues().some((value) => value?.includes(token))).toBe(false);
    expect(document.cookie).not.toContain(token);
    expect(document.cookie).toContain("auth-token=1");
    expect(authStorage.getAccessToken()).toBe(token);

    authStorage.clearAuth();
    expect(authStorage.getAccessToken()).toBeNull();
    expect(document.cookie).not.toContain("auth-token=1");
  });
});
