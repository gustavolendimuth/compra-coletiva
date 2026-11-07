import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

const mockPost = vi.fn();
const mockGet = vi.fn();
vi.mock("../../api/client", () => ({
  authClient: {
    post: (...args: unknown[]) => mockPost(...args),
    get: (...args: unknown[]) => mockGet(...args),
  },
  apiClient: { post: vi.fn(), patch: vi.fn() },
}));
vi.mock("../../lib/socket", () => ({
  reconnectSocket: vi.fn(),
  updateSocketToken: vi.fn(),
}));
// setup.ts mocka o AuthContext globalmente; aqui testamos o real
vi.unmock("../AuthContext");
vi.mock("react-hot-toast", () => ({ default: { success: vi.fn(), error: vi.fn() } }));

import { AuthProvider, useAuth } from "../AuthContext";
import { authStorage } from "../../lib/authStorage";

function Probe() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <p>carregando</p>;
  return <p>{user ? `logado:${user.name}` : "anonimo"}</p>;
}

const user = {
  id: "u1",
  email: "u@test.com",
  name: "Maria",
  role: "CUSTOMER" as const,
  phoneCompleted: true,
  addressCompleted: true,
  legalAcceptanceRequired: false,
};

describe("AuthProvider", () => {
  beforeEach(() => {
    mockPost.mockReset();
    mockGet.mockReset();
    authStorage.clearAuth();
  });

  it("reload obtains access token via refresh (no token persisted before)", async () => {
    // Recarga: há usuário salvo, mas nenhum access token em memória
    window.localStorage.setItem("user", JSON.stringify(user));
    mockPost.mockResolvedValue({ data: { accessToken: "fresh-token", user } });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByText("logado:Maria")).toBeInTheDocument());
    expect(mockPost).toHaveBeenCalledWith("/auth/refresh");
    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(authStorage.getAccessToken()).toBe("fresh-token");
    expect(window.localStorage.getItem("accessToken")).toBeNull();
  });

  it("reload with failed refresh clears auth and stays anonymous", async () => {
    window.localStorage.setItem("user", JSON.stringify(user));
    mockPost.mockRejectedValue(new Error("401"));

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByText("anonimo")).toBeInTheDocument());
    expect(authStorage.getUser()).toBeNull();
  });
});
