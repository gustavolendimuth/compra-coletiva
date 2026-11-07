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
    mockRefreshSession.mockResolvedValue({ accessToken: "fresh-token", user });

    render(<AuthCallback />);

    await waitFor(() => expect(mockSetUser).toHaveBeenCalledWith(user));
    expect(mockRefreshSession).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith("/campanhas");
  });

  it("error param shows the error and does not refresh", async () => {
    mockParams = new URLSearchParams("error=oauth_state");

    render(<AuthCallback />);

    await waitFor(() => expect(mockToastError).toHaveBeenCalled());
    expect(mockRefreshSession).not.toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/campanhas");
  });
});
