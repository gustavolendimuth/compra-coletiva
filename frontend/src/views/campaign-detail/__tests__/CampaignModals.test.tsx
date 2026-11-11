import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CampaignModals } from "../CampaignModals";
import { createMockOrder } from "@/__tests__/mock-data";

vi.mock("../modals/ProductModals", () => ({
  AddProductModal: () => null,
  EditProductModal: () => null,
}));

vi.mock("../modals/OrderModals", () => ({
  AdminCreateOrderModal: () => null,
  EditOrderModal: () => null,
  ViewOrderModal: () => null,
}));

vi.mock("../modals/CampaignModals", () => ({
  ShippingModal: () => null,
  DeadlineModal: () => null,
  PixModal: () => null,
  AddressModal: () => null,
  CloseConfirmDialog: () => null,
  ReopenConfirmDialog: () => null,
  SentConfirmDialog: () => null,
  CloneModal: () => null,
}));

vi.mock("../modals/ImageUploadModal", () => ({
  ImageUploadModal: () => null,
}));

vi.mock("../modals/PaymentProofModal", () => ({
  PaymentProofModal: () => null,
}));

describe("CampaignModals - Remove Payment Proof Confirmation", () => {
  const buildHook = (overrides: Record<string, unknown> = {}) => {
    return {
      isSalesDisclaimerModalOpen: false,
      isSalesDisclaimerLoading: false,
      handleCancelSalesDisclaimer: vi.fn(),
      handleConfirmSalesDisclaimer: vi.fn(),
      editProductForm: { imageUrl: "" },
      isRemovePaymentProofConfirmOpen: false,
      closeRemovePaymentProofConfirm: vi.fn(),
      handleConfirmRemovePaymentProof: vi.fn(),
      orderForPaymentRemoval: null,
      updatePaymentMutation: { isPending: false },
      ...overrides,
    } as any;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render remove proof confirmation modal with customer name", () => {
    const order = createMockOrder({
      id: "order-proof",
      customer: { id: "c1", name: "Maria Silva", email: "maria@test.com" },
      isPaid: true,
      paymentProofUrl: "uploads/proof.jpg",
    });
    const hook = buildHook({
      isRemovePaymentProofConfirmOpen: true,
      orderForPaymentRemoval: order,
    });

    render(<CampaignModals hook={hook} />);

    expect(
      screen.getByRole("heading", { name: /remover comprovante de pagamento/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/maria silva/i)).toBeInTheDocument();
    expect(
      screen.getByText(/confirma remover o comprovante e marcar o pedido como não pago/i)
    ).toBeInTheDocument();
  });

  it("should call confirm and close handlers when user confirms removal", async () => {
    const user = userEvent.setup();
    const hook = buildHook({
      isRemovePaymentProofConfirmOpen: true,
      orderForPaymentRemoval: createMockOrder({
        id: "order-proof",
        customer: { id: "c1", name: "Maria Silva", email: "maria@test.com" },
      }),
    });

    render(<CampaignModals hook={hook} />);

    await user.click(
      screen.getByRole("button", { name: /remover comprovante/i })
    );

    expect(hook.handleConfirmRemovePaymentProof).toHaveBeenCalledTimes(1);
    expect(hook.closeRemovePaymentProofConfirm).toHaveBeenCalledTimes(1);
  });

  it("should call close handler when user cancels removal", async () => {
    const user = userEvent.setup();
    const hook = buildHook({
      isRemovePaymentProofConfirmOpen: true,
      orderForPaymentRemoval: createMockOrder({
        id: "order-proof",
        customer: { id: "c1", name: "Maria Silva", email: "maria@test.com" },
      }),
    });

    render(<CampaignModals hook={hook} />);

    await user.click(screen.getByRole("button", { name: /cancelar/i }));

    expect(hook.closeRemovePaymentProofConfirm).toHaveBeenCalledTimes(1);
    expect(hook.handleConfirmRemovePaymentProof).not.toHaveBeenCalled();
  });
});
