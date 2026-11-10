import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMockOrder, createMockOrderItem, createMockFullProduct } from "@/__tests__/mock-data";
import { formatCurrency } from "@/lib/utils";
import OrderCard from "../OrderCard";

const defaultCallbacks = {
  onView: vi.fn(),
  onTogglePayment: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
};

const renderOrderCard = (overrides: Partial<Parameters<typeof OrderCard>[0]> = {}) => {
  const props = {
    order: createMockOrder(),
    showView: false,
    showManage: false,
    showDelete: false,
    ...defaultCallbacks,
    ...overrides,
  };
  return render(<OrderCard {...props} />);
};

describe("OrderCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Renderizacao basica", () => {
    it("deve exibir o nome do cliente", () => {
      const order = createMockOrder({ customer: { id: "u1", name: "Maria Silva", email: "maria@test.com" } });
      renderOrderCard({ order });

      expect(screen.getByText("Maria Silva")).toBeInTheDocument();
    });

    it("deve exibir status 'Pendente' quando isPaid e false", () => {
      const order = createMockOrder({ isPaid: false });
      renderOrderCard({ order });

      expect(screen.getByText("Pendente")).toBeInTheDocument();
    });

    it("deve exibir status 'Pago' quando isPaid e true", () => {
      const order = createMockOrder({ isPaid: true });
      renderOrderCard({ order });

      expect(screen.getByText("Pago")).toBeInTheDocument();
    });

    it("deve exibir itens com quantidade e nome do produto", () => {
      const order = createMockOrder({
        items: [
          createMockOrderItem({
            quantity: 3,
            product: createMockFullProduct({ name: "Camiseta Azul" }),
          }),
          createMockOrderItem({
            quantity: 1,
            product: createMockFullProduct({ name: "Bone Verde" }),
          }),
        ],
      });
      renderOrderCard({ order });

      expect(screen.getByText("3x")).toBeInTheDocument();
      expect(screen.getByText("Camiseta Azul")).toBeInTheDocument();
      expect(screen.getByText("1x")).toBeInTheDocument();
      expect(screen.getByText("Bone Verde")).toBeInTheDocument();
    });

    it("deve exibir valores financeiros formatados como BRL", () => {
      const order = createMockOrder({
        subtotal: 1250.5,
        shippingFee: 25.0,
        total: 1275.5,
      });
      renderOrderCard({ order });

      // formatCurrency uses non-breaking space (U+00A0) between R$ and the number,
      // but RTL normalizes it to a regular space, so we normalize for comparison
      const normalize = (s: string) => s.replace(/\u00A0/g, " ");
      const normalizer = (text: string) => text.replace(/\u00A0/g, " ");

      expect(screen.getByText(normalize(formatCurrency(1250.5)), { normalizer })).toBeInTheDocument();
      expect(screen.getByText(normalize(formatCurrency(25.0)), { normalizer })).toBeInTheDocument();
      expect(screen.getByText(normalize(formatCurrency(1275.5)), { normalizer })).toBeInTheDocument();
    });

    it("deve exibir labels Subtotal, Frete e Total", () => {
      renderOrderCard();

      expect(screen.getByText("Subtotal")).toBeInTheDocument();
      expect(screen.getByText("Frete")).toBeInTheDocument();
      expect(screen.getByText("Total")).toBeInTheDocument();
    });
  });

  describe("Visibilidade condicional dos botoes", () => {
    it("deve renderizar botao 'Visualizar pedido' quando showView e true", () => {
      renderOrderCard({ showView: true });

      expect(screen.getByTitle("Visualizar pedido")).toBeInTheDocument();
    });

    it("nao deve renderizar botao 'Visualizar pedido' quando showView e false", () => {
      renderOrderCard({ showView: false });

      expect(screen.queryByTitle("Visualizar pedido")).not.toBeInTheDocument();
    });

    it("deve renderizar botoes de pagamento e edicao quando showManage e true", () => {
      const order = createMockOrder({ isPaid: false });
      renderOrderCard({ order, showManage: true });

      expect(screen.getByTitle("Enviar comprovante de pagamento")).toBeInTheDocument();
      expect(screen.getByTitle("Editar pedido")).toBeInTheDocument();
    });

    it("nao deve renderizar botoes de pagamento e edicao quando showManage e false", () => {
      renderOrderCard({ showManage: false });

      expect(screen.queryByTitle("Enviar comprovante de pagamento")).not.toBeInTheDocument();
      expect(screen.queryByTitle("Marcar como não pago")).not.toBeInTheDocument();
      expect(screen.queryByTitle("Editar pedido")).not.toBeInTheDocument();
    });

    it("deve renderizar botao 'Remover pedido' quando showDelete e true", () => {
      renderOrderCard({ showDelete: true });

      expect(screen.getByTitle("Remover pedido")).toBeInTheDocument();
    });

    it("nao deve renderizar botao 'Remover pedido' quando showDelete e false", () => {
      renderOrderCard({ showDelete: false });

      expect(screen.queryByTitle("Remover pedido")).not.toBeInTheDocument();
    });

    it("nao deve renderizar secao de acoes quando todos os flags sao false", () => {
      const { container } = renderOrderCard({
        showView: false,
        showManage: false,
        showDelete: false,
      });

      expect(container.querySelector(".border-t.border-gray-100")).not.toBeInTheDocument();
    });

    it("deve renderizar todos os botoes quando todos os flags sao true", () => {
      const order = createMockOrder({ isPaid: false });
      renderOrderCard({ order, showView: true, showManage: true, showDelete: true });

      expect(screen.getByTitle("Visualizar pedido")).toBeInTheDocument();
      expect(screen.getByTitle("Enviar comprovante de pagamento")).toBeInTheDocument();
      expect(screen.getByTitle("Editar pedido")).toBeInTheDocument();
      expect(screen.getByTitle("Remover pedido")).toBeInTheDocument();
    });
  });

  describe("Callbacks dos botoes", () => {
    it("deve chamar onView ao clicar no botao de visualizar", async () => {
      const onView = vi.fn();
      renderOrderCard({ showView: true, onView });

      await userEvent.click(screen.getByTitle("Visualizar pedido"));

      expect(onView).toHaveBeenCalledOnce();
    });

    it("deve chamar onTogglePayment ao clicar no botao de pagamento", async () => {
      const onTogglePayment = vi.fn();
      const order = createMockOrder({ isPaid: false });
      renderOrderCard({ order, showManage: true, onTogglePayment });

      await userEvent.click(screen.getByTitle("Enviar comprovante de pagamento"));

      expect(onTogglePayment).toHaveBeenCalledOnce();
    });

    it("deve chamar onEdit ao clicar no botao de editar", async () => {
      const onEdit = vi.fn();
      renderOrderCard({ showManage: true, onEdit });

      await userEvent.click(screen.getByTitle("Editar pedido"));

      expect(onEdit).toHaveBeenCalledOnce();
    });

    it("deve chamar onDelete ao clicar no botao de remover", async () => {
      const onDelete = vi.fn();
      renderOrderCard({ showDelete: true, onDelete });

      await userEvent.click(screen.getByTitle("Remover pedido"));

      expect(onDelete).toHaveBeenCalledOnce();
    });
  });

  describe("Exibicao do status de pagamento", () => {
    it("deve exibir 'Pago' com estilo verde quando isPaid e true", () => {
      const order = createMockOrder({ isPaid: true });
      renderOrderCard({ order });

      const badge = screen.getByText("Pago");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass("bg-green-100", "text-green-700");
    });

    it("deve exibir 'Pendente' com estilo vermelho quando isPaid e false", () => {
      const order = createMockOrder({ isPaid: false });
      renderOrderCard({ order });

      const badge = screen.getByText("Pendente");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass("bg-red-100", "text-red-700");
    });

    it("deve exibir titulo 'Marcar como nao pago' no botao de pagamento quando isPaid e true", () => {
      const order = createMockOrder({ isPaid: true });
      renderOrderCard({ order, showManage: true });

      expect(screen.getByTitle("Marcar como não pago")).toBeInTheDocument();
      expect(screen.queryByTitle("Enviar comprovante de pagamento")).not.toBeInTheDocument();
    });

    it("deve exibir titulo 'Enviar comprovante de pagamento' no botao quando isPaid e false", () => {
      const order = createMockOrder({ isPaid: false });
      renderOrderCard({ order, showManage: true });

      expect(screen.getByTitle("Enviar comprovante de pagamento")).toBeInTheDocument();
      expect(screen.queryByTitle("Marcar como não pago")).not.toBeInTheDocument();
    });
  });
});
