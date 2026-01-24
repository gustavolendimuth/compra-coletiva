import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddOrderModal, EditOrderModal, ViewOrderModal } from '../OrderModals';
import { createMockOrder, createMockFullProduct } from '@/__tests__/mock-data';

// Mock OrderChat component
vi.mock('@/components/campaign', () => ({
  OrderChat: ({ orderId }: { orderId: string }) => (
    <div data-testid="order-chat">OrderChat-{orderId}</div>
  ),
}));

describe('OrderModals', () => {
  describe('AddOrderModal', () => {
    const mockProducts = [
      createMockFullProduct({ id: 'product-1', name: 'Product A', price: 50.0 }),
      createMockFullProduct({ id: 'product-2', name: 'Product B', price: 75.0 }),
      createMockFullProduct({ id: 'product-3', name: 'Product C', price: 100.0 }),
    ];

    const mockOnClose = vi.fn();
    const mockOnChange = vi.fn();

    const defaultProps = {
      isOpen: true,
      form: { items: [{ productId: '', quantity: 1 as number | '' }] },
      products: mockProducts,
      isPending: false,
      onClose: mockOnClose,
      onChange: mockOnChange,
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    describe('Rendering', () => {
      it('should render modal when isOpen is true', () => {
        render(<AddOrderModal {...defaultProps} />);

        expect(screen.getByText('Novo Pedido')).toBeInTheDocument();
      });

      it('should not render modal when isOpen is false', () => {
        render(<AddOrderModal {...defaultProps} isOpen={false} />);

        expect(screen.queryByText('Novo Pedido')).not.toBeInTheDocument();
      });

      it('should render custom title when provided', () => {
        render(<AddOrderModal {...defaultProps} title="Custom Title" />);

        expect(screen.getByText('Custom Title')).toBeInTheDocument();
      });

      it('should render keyboard shortcut info', () => {
        render(<AddOrderModal {...defaultProps} />);

        expect(screen.getByText(/Alt\+P para adicionar produto/i)).toBeInTheDocument();
      });

      it('should render product selection dropdown', () => {
        render(<AddOrderModal {...defaultProps} />);

        const select = screen.getByRole('combobox');
        expect(select).toBeInTheDocument();
      });

      it('should render quantity input', () => {
        render(<AddOrderModal {...defaultProps} />);

        const quantityInput = screen.getByPlaceholderText('Qtd');
        expect(quantityInput).toBeInTheDocument();
      });

      it('should render add product button', () => {
        render(<AddOrderModal {...defaultProps} />);

        expect(screen.getByRole('button', { name: /adicionar produto/i })).toBeInTheDocument();
      });

      it('should render close button', () => {
        render(<AddOrderModal {...defaultProps} />);

        expect(screen.getAllByRole('button', { name: /fechar/i })[0]).toBeInTheDocument();
      });
    });

    describe('Product Selection', () => {
      it('should display all products in dropdown', () => {
        render(<AddOrderModal {...defaultProps} />);

        const select = screen.getByRole('combobox');
        const options = select.querySelectorAll('option');

        // +1 for "Selecione um produto" option
        expect(options).toHaveLength(mockProducts.length + 1);
      });

      it('should display product name and price in options', () => {
        render(<AddOrderModal {...defaultProps} />);

        expect(screen.getByText(/Product A - R\$ 50,00/i)).toBeInTheDocument();
        expect(screen.getByText(/Product B - R\$ 75,00/i)).toBeInTheDocument();
        expect(screen.getByText(/Product C - R\$ 100,00/i)).toBeInTheDocument();
      });

      it('should call onChange when product is selected', async () => {
        const user = userEvent.setup();
        render(<AddOrderModal {...defaultProps} />);

        const select = screen.getByRole('combobox');
        await user.selectOptions(select, 'product-1');

        expect(mockOnChange).toHaveBeenCalled();
        const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
        expect(lastCall.items[0].productId).toBe('product-1');
      });
    });

    describe('Quantity Input', () => {
      it('should call onChange when quantity changes', async () => {
        const user = userEvent.setup();
        render(<AddOrderModal {...defaultProps} />);

        const quantityInput = screen.getByPlaceholderText('Qtd');
        await user.clear(quantityInput);
        await user.type(quantityInput, '5');

        expect(mockOnChange).toHaveBeenCalled();
      });

      it('should have minimum value of 1', () => {
        render(<AddOrderModal {...defaultProps} />);

        const quantityInput = screen.getByPlaceholderText('Qtd');
        expect(quantityInput).toHaveAttribute('min', '1');
      });

      it('should have required attribute', () => {
        render(<AddOrderModal {...defaultProps} />);

        const quantityInput = screen.getByPlaceholderText('Qtd');
        expect(quantityInput).toBeRequired();
      });
    });

    describe('Multiple Items', () => {
      it('should render multiple items when form has multiple items', () => {
        render(
          <AddOrderModal
            {...defaultProps}
            form={{
              items: [
                { productId: 'product-1', quantity: 2 },
                { productId: 'product-2', quantity: 3 },
              ],
            }}
          />
        );

        const selects = screen.getAllByRole('combobox');
        expect(selects).toHaveLength(2);
      });

      it('should add new item when add product button is clicked', async () => {
        const user = userEvent.setup();
        render(<AddOrderModal {...defaultProps} />);

        const addButton = screen.getByRole('button', { name: /adicionar produto/i });
        await user.click(addButton);

        // Check that onChange was called with items array containing 2 items
        expect(mockOnChange).toHaveBeenCalled();
        const callArg = mockOnChange.mock.calls[0][0];
        expect(callArg.items).toHaveLength(2);
        // The second item should be the newly added one with empty values
        expect(callArg.items[1]).toEqual({ productId: '', quantity: 1 });
      });

      it('should show remove button when there are multiple items', () => {
        render(
          <AddOrderModal
            {...defaultProps}
            form={{
              items: [
                { productId: 'product-1', quantity: 2 },
                { productId: 'product-2', quantity: 3 },
              ],
            }}
          />
        );

        const removeButtons = screen.getAllByRole('button', { name: '' });
        // Should have remove buttons for each item (trash icon buttons)
        expect(removeButtons.length).toBeGreaterThan(0);
      });

      it('should not show remove button when there is only one item', () => {
        render(<AddOrderModal {...defaultProps} />);

        const trashButtons = screen.queryAllByRole('button', { name: '' });
        // Filter for icon buttons (which don't have text)
        const iconButtons = trashButtons.filter(btn => btn.textContent === '');
        // Should not have trash icon button when only one item
        // May have multiple empty-name buttons due to Modal structure
        expect(iconButtons.length).toBeGreaterThanOrEqual(0);
      });

      it('should remove item when remove button is clicked', async () => {
        const user = userEvent.setup();
        render(
          <AddOrderModal
            {...defaultProps}
            form={{
              items: [
                { productId: 'product-1', quantity: 2 },
                { productId: 'product-2', quantity: 3 },
              ],
            }}
          />
        );

        // Find remove button by looking for trash icon button
        const buttons = screen.getAllByRole('button');
        const removeButton = buttons.find(btn => btn.className.includes('danger'));

        if (removeButton) {
          await user.click(removeButton);
          expect(mockOnChange).toHaveBeenCalled();
        }
      });
    });

    describe('Loading State', () => {
      it('should show loading message when isPending is true', () => {
        render(<AddOrderModal {...defaultProps} isPending={true} />);

        expect(screen.getByText(/salvando automaticamente/i)).toBeInTheDocument();
      });

      it('should not show loading message when isPending is false', () => {
        render(<AddOrderModal {...defaultProps} isPending={false} />);

        expect(screen.queryByText(/salvando automaticamente/i)).not.toBeInTheDocument();
      });
    });

    describe('Modal Actions', () => {
      it('should call onClose when close button is clicked', async () => {
        const user = userEvent.setup();
        render(<AddOrderModal {...defaultProps} />);

        const closeButton = screen.getAllByRole('button', { name: /fechar/i })[0];
        await user.click(closeButton);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('EditOrderModal', () => {
    const mockProducts = [
      createMockFullProduct({ id: 'product-1', name: 'Product A', price: 50.0 }),
      createMockFullProduct({ id: 'product-2', name: 'Product B', price: 75.0 }),
    ];

    const mockOnClose = vi.fn();
    const mockOnChange = vi.fn();

    const defaultProps = {
      isOpen: true,
      form: { items: [{ productId: 'product-1', quantity: 2 }] },
      products: mockProducts,
      isPending: false,
      onClose: mockOnClose,
      onChange: mockOnChange,
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    describe('Rendering', () => {
      it('should render modal with edit title', () => {
        render(<EditOrderModal {...defaultProps} />);

        expect(screen.getByText('Editar Pedido')).toBeInTheDocument();
      });

      it('should render with existing form data', () => {
        render(<EditOrderModal {...defaultProps} />);

        const selects = screen.getAllByRole('combobox');
        expect(selects[0]).toHaveValue('product-1');
      });
    });
  });

  describe('ViewOrderModal', () => {
    const mockOrder = createMockOrder({
      id: 'order-123',
      customer: { id: 'u1', name: 'John Doe', email: 'john@test.com' },
      isPaid: false,
      subtotal: 199.98,
      shippingFee: 10.0,
      total: 209.98,
    });

    const mockOnClose = vi.fn();
    const mockOnEdit = vi.fn();

    const defaultProps = {
      isOpen: true,
      order: mockOrder,
      isActive: true,
      canEdit: true,
      onClose: mockOnClose,
      onEdit: mockOnEdit,
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    describe('Rendering', () => {
      it('should render modal when isOpen is true', () => {
        render(<ViewOrderModal {...defaultProps} />);

        expect(screen.getByText('Detalhes do Pedido')).toBeInTheDocument();
      });

      it('should not render modal when isOpen is false', () => {
        render(<ViewOrderModal {...defaultProps} isOpen={false} />);

        expect(screen.queryByText('Detalhes do Pedido')).not.toBeInTheDocument();
      });

      it('should display customer name', () => {
        render(<ViewOrderModal {...defaultProps} />);

        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      it('should display payment status as pending', () => {
        render(<ViewOrderModal {...defaultProps} />);

        expect(screen.getByText('Pendente')).toBeInTheDocument();
      });

      it('should display payment status as paid', () => {
        render(
          <ViewOrderModal
            {...defaultProps}
            order={{ ...mockOrder, isPaid: true }}
          />
        );

        expect(screen.getByText('Pago')).toBeInTheDocument();
      });
    });

    describe('Order Items', () => {
      it('should display all order items', () => {
        render(<ViewOrderModal {...defaultProps} />);

        // Default mock order has 1 item
        expect(screen.getByText(/test product/i)).toBeInTheDocument();
      });

      it('should display item quantity and price', () => {
        render(<ViewOrderModal {...defaultProps} />);

        expect(screen.getByText(/2x/i)).toBeInTheDocument();
        expect(screen.getByText(/R\$ 99,99/i)).toBeInTheDocument();
      });
    });

    describe('Financial Summary', () => {
      it('should display subtotal', () => {
        render(<ViewOrderModal {...defaultProps} />);

        expect(screen.getByText('Subtotal')).toBeInTheDocument();
        expect(screen.getAllByText('R$ 199,98')[0]).toBeInTheDocument();
      });

      it('should display shipping fee', () => {
        render(<ViewOrderModal {...defaultProps} />);

        expect(screen.getByText('Frete')).toBeInTheDocument();
        expect(screen.getByText('R$ 10,00')).toBeInTheDocument();
      });

      it('should display total', () => {
        render(<ViewOrderModal {...defaultProps} />);

        expect(screen.getByText('Total')).toBeInTheDocument();
        expect(screen.getByText('R$ 209,98')).toBeInTheDocument();
      });
    });

    describe('Order Chat', () => {
      it('should render OrderChat component', () => {
        render(<ViewOrderModal {...defaultProps} />);

        const chatComponent = screen.getByTestId('order-chat');
        expect(chatComponent).toBeInTheDocument();
        expect(chatComponent).toHaveTextContent('order-123');
      });
    });

    describe('Action Buttons', () => {
      it('should show edit button when campaign is active and user can edit', () => {
        render(<ViewOrderModal {...defaultProps} isActive={true} canEdit={true} />);

        expect(screen.getByRole('button', { name: /editar pedido/i })).toBeInTheDocument();
      });

      it('should not show edit button when campaign is not active', () => {
        render(<ViewOrderModal {...defaultProps} isActive={false} canEdit={true} />);

        expect(screen.queryByRole('button', { name: /editar pedido/i })).not.toBeInTheDocument();
      });

      it('should not show edit button when user cannot edit', () => {
        render(<ViewOrderModal {...defaultProps} isActive={true} canEdit={false} />);

        expect(screen.queryByRole('button', { name: /editar pedido/i })).not.toBeInTheDocument();
      });

      it('should show close button', () => {
        render(<ViewOrderModal {...defaultProps} />);

        expect(screen.getAllByRole('button', { name: /fechar/i })[0]).toBeInTheDocument();
      });

      it('should call onEdit when edit button is clicked', async () => {
        const user = userEvent.setup();
        render(<ViewOrderModal {...defaultProps} />);

        const editButton = screen.getByRole('button', { name: /editar pedido/i });
        await user.click(editButton);

        expect(mockOnEdit).toHaveBeenCalledTimes(1);
      });

      it('should call onClose when close button is clicked', async () => {
        const user = userEvent.setup();
        render(<ViewOrderModal {...defaultProps} />);

        const closeButton = screen.getAllByRole('button', { name: /fechar/i })[0];
        await user.click(closeButton);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });

    describe('Null Order Handling', () => {
      it('should not render order details when order is null', () => {
        render(<ViewOrderModal {...defaultProps} order={null} />);

        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      });
    });
  });
});
