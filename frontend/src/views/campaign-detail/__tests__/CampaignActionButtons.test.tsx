import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import toast from "react-hot-toast";
import { CampaignActionButtons } from "../CampaignActionButtons";
import { campaignApi } from "@/api";
import { createMockCampaignFull } from "@/__tests__/mock-data";

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/components/IconButton", () => ({
  default: ({ onClick, children, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

vi.mock("@/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api")>();
  return {
    ...actual,
    campaignApi: {
      ...actual.campaignApi,
      downloadSupplierInvoice: vi.fn(),
      getOrdersSummary: vi.fn(),
    },
  };
});

describe("CampaignActionButtons", () => {
  const mockCampaign = createMockCampaignFull({
    id: "campaign-1",
    slug: "campaign-1",
    status: "ACTIVE",
  });

  const defaultProps = {
    campaign: mockCampaign,
    canEditCampaign: true,
    canGenerateOrdersSummary: true,
    ordersCount: 2,
    onEditPix: vi.fn(),
    onCloseCampaign: vi.fn(),
    onReopenCampaign: vi.fn(),
    onMarkAsSent: vi.fn(),
    onCloneCampaign: vi.fn(),
    onAddProduct: vi.fn(),
    onAddOrder: vi.fn(),
    onEditAddress: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: vi.fn(),
      },
      configurable: true,
    });
  });

  it("should show summary button for creator/admin permission", () => {
    render(<CampaignActionButtons {...defaultProps} />);

    expect(screen.getByRole("button", { name: /copiar resumo pedidos/i })).toBeInTheDocument();
  });

  it("should hide summary button without permission", () => {
    render(
      <CampaignActionButtons
        {...defaultProps}
        canGenerateOrdersSummary={false}
      />
    );

    expect(screen.queryByRole("button", { name: /copiar resumo pedidos/i })).not.toBeInTheDocument();
  });

  it("should generate and copy summary text", async () => {
    const user = userEvent.setup();
    vi.mocked(campaignApi.getOrdersSummary).mockResolvedValue({
      campaignId: "campaign-1",
      campaignName: "Campaign",
      campaignSlug: "campaign-1",
      generatedAt: new Date().toISOString(),
      ordersCount: 1,
      totalAmount: 10,
      summaryText: "Resumo pronto",
    });

    render(<CampaignActionButtons {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /copiar resumo pedidos/i }));

    await waitFor(() => {
      expect(campaignApi.getOrdersSummary).toHaveBeenCalledWith("campaign-1");
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith("Resumo pronto");
      expect(toast.success).toHaveBeenCalledWith("Resumo copiado! Pronto para enviar no WhatsApp.");
    });
  });

  it("should show error toast when summary generation fails", async () => {
    const user = userEvent.setup();
    vi.mocked(campaignApi.getOrdersSummary).mockRejectedValue(new Error("fail"));

    render(<CampaignActionButtons {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /copiar resumo pedidos/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Erro ao gerar resumo dos pedidos");
    });
  });
});
