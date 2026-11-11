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
