import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";

const mockReplace = vi.fn();
const mockPush = vi.fn();
let mockParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: mockPush }),
  useSearchParams: () => mockParams,
}));
const mockSetUser = vi.fn();
vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => ({ setUser: mockSetUser }),
}));
const mockRefreshSession = vi.fn();
vi.mock("../../api/refreshSession", () => ({
  refreshSession: () => mockRefreshSession(),
}));
vi.mock("../../lib/socket", () => ({ reconnectSocket: vi.fn() }));
const mockToastError = vi.fn();
vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: (...a: unknown[]) => mockToastError(...a) },
}));

import AuthCallback from "../AuthCallback";

const user = {
  id: "u1",
  email: "u@test.com",
  name: "Maria",
  role: "CUSTOMER" as const,
  phoneCompleted: true,
  addressCompleted: true,
  legalAcceptanceRequired: false,
};

describe("AuthCallback", () => {
  beforeEach(() => {
    mockParams = new URLSearchParams();
    mockReplace.mockReset();
    mockPush.mockReset();
    mockSetUser.mockReset();
    mockRefreshSession.mockReset();
    mockToastError.mockReset();
  });

  it("uses refresh to obtain access token and user (nothing read from the URL)", async () => {
    // Formato antigo do callback: token e usuário na URL
    mockParams = new URLSearchParams("accessToken=evil&userId=x&userName=Evil&userEmail=e%40x.com&userRole=ADMIN");
    mockRefreshSession.mockResolvedValue({ accessToken: "fresh-token", user });

    render(<AuthCallback />);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/campanhas"));
    expect(mockRefreshSession).toHaveBeenCalledTimes(1);
    expect(mockSetUser.mock.calls).toEqual([[user]]);
  });

  it.each([
    ["legalAcceptanceRequired", { legalAcceptanceRequired: true }],
    ["phone missing", { phoneCompleted: false }],
    ["address missing", { addressCompleted: false }],
  ])("incomplete profile (%s) goes to /completar-perfil", async (_label, override) => {
    mockRefreshSession.mockResolvedValue({ accessToken: "fresh-token", user: { ...user, ...override } });

    render(<AuthCallback />);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/completar-perfil"));
    expect(mockReplace).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["error param shows the error and does not refresh", "error=oauth_state", () => undefined],
    ["failed refresh shows the error and keeps the user logged out", "", () => Promise.reject(new Error("401"))],
  ])("%s", async (_label, query, refresh) => {
    mockParams = new URLSearchParams(query);
    mockRefreshSession.mockImplementation(refresh);

    render(<AuthCallback />);

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/campanhas"));
    expect(mockToastError).toHaveBeenCalledWith("Erro ao fazer login com Google");
    expect(mockRefreshSession).toHaveBeenCalledTimes(query ? 0 : 1);
    expect(mockSetUser).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
