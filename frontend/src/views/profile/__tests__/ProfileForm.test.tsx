import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProfileForm } from "../ProfileForm";
import type { StoredUser } from "@/api/types";
import { profileService } from "@/api";

vi.mock("@/api", () => ({
  profileService: {
    update: vi.fn(),
  },
}));

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe("ProfileForm", () => {
  const baseUser: StoredUser = {
    id: "user-1",
    name: "Qa Perfil",
    email: "qa.perfil@example.com",
    phone: "11999998888",
    hideNameInCampaigns: false,
    role: "CUSTOMER",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should send hideNameInCampaigns update when checkbox is changed", async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();

    vi.mocked(profileService.update).mockResolvedValue({
      message: "ok",
      user: {
        ...baseUser,
        hideNameInCampaigns: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });

    renderWithQuery(<ProfileForm user={baseUser} onUpdate={onUpdate} />);

    await user.click(screen.getByRole("button", { name: /editar/i }));
    await user.click(
      screen.getByRole("checkbox", {
        name: /mascarar meu nome nas campanhas com apelido divertido/i,
      })
    );
    await user.click(screen.getByRole("button", { name: /salvar/i }));

    await waitFor(() => {
      expect(profileService.update).toHaveBeenCalled();
      const firstCallArg = vi.mocked(profileService.update).mock.calls[0]?.[0];
      expect(firstCallArg).toEqual({
        hideNameInCampaigns: true,
      });
    });
  });
});
