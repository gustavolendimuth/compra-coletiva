import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { PaymentProofModal } from "../PaymentProofModal";
import { createMockOrder } from "@/__tests__/mock-data";

const { mockUsePaymentProofFile } = vi.hoisted(() => ({ mockUsePaymentProofFile: vi.fn() }));
vi.mock("@/hooks/usePaymentProofFile", () => ({
  usePaymentProofFile: mockUsePaymentProofFile,
}));

describe("PaymentProofModal", () => {
  const baseProps = {
    isOpen: true,
    onClose: vi.fn(),
    order: createMockOrder({ id: "order-1" }),
    onSubmit: vi.fn(),
    isPending: false,
  };
  const proofUrl = "/api/orders/order-1/payment-proof";

  beforeEach(() => {
    mockUsePaymentProofFile.mockReturnValue({ url: null, kind: null, isLoading: false, isUnavailable: false });
  });

  it("without proof button: hidden when onMarkPaidWithoutProof is absent (participant)", () => {
    render(<PaymentProofModal {...baseProps} />);

    expect(screen.getByRole("button", { name: /^marcar como pago$/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /sem comprovante/i })).not.toBeInTheDocument();
  });

  it("without proof button: shown when onMarkPaidWithoutProof is given (creator/admin)", () => {
    render(<PaymentProofModal {...baseProps} onMarkPaidWithoutProof={vi.fn()} />);

    expect(screen.getByRole("button", { name: /marcar como pago sem comprovante/i })).toBeInTheDocument();
  });

  // Mostrava "R$ 100.00" (toFixed) em vez do formato brasileiro
  it("shows the order total in BRL format", () => {
    render(<PaymentProofModal {...baseProps} order={createMockOrder({ id: "order-1", total: 1234.5 })} />);

    expect(screen.getByText("Total:").parentElement).toHaveTextContent("Total: R$ 1.234,50");
  });

  it.each([
    [true, proofUrl, true],
    [false, proofUrl, false],
    [true, undefined, false],
  ])("fetches the current proof only when open with a saved proof (isOpen=%s, url=%s)", (isOpen, paymentProofUrl, enabled) => {
    render(<PaymentProofModal {...baseProps} isOpen={isOpen} order={createMockOrder({ id: "order-1", paymentProofUrl })} />);

    expect(mockUsePaymentProofFile).toHaveBeenLastCalledWith("order-1", enabled);
  });

  // O ImageUpload só sabe pré-visualizar imagem: PDF não pode virar <img>
  it.each([
    ["image", 1],
    ["pdf", 0],
  ])("previews the current proof only when it is an image (%s)", (kind, previews) => {
    mockUsePaymentProofFile.mockReturnValue({ url: "blob:proof-1", kind, isLoading: false, isUnavailable: false });

    render(<PaymentProofModal {...baseProps} order={createMockOrder({ id: "order-1", paymentProofUrl: proofUrl })} />);

    expect(screen.queryAllByAltText("Preview")).toHaveLength(previews);
  });
});
