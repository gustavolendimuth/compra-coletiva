import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrdersTab } from '../OrdersTab';
import { createMockOrder } from '@/__tests__/mock-data';

// Mock OrderCard component
vi.mock('@/components/campaign/OrderCard', () => ({
  default: ({ order, customerName, onView, onEdit, onDelete, onTogglePayment }: any) => (
    <div data-testid={`order-card-${order.id}`}>
      <span>Order: {customerName}</span>
      <button onClick={onView}>View</button>
      <button onClick={onEdit}>Edit</button>
      <button onClick={onDelete}>Delete</button>
      <button onClick={onTogglePayment}>Toggle Payment</button>
    </div>
  ),
}));

// Mock IconButton component
vi.mock('@/components/IconButton', () => ({
  default: ({ onClick, children, icon, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

describe('OrdersTab', () => {
  const mockOrders = [
    createMockOrder({
      id: 'order-1',
      customer: { id: 'u1', name: 'Alice', email: 'alice@test.com' },
      subtotal: 100,
      shippingFee: 10,
      total: 110,
      isPaid: true,
    }),
    createMockOrder({
      id: 'order-2',
      customer: { id: 'u2', name: 'Bob', email: 'bob@test.com' },
      subtotal: 200,
      shippingFee: 20,
      total: 220,
      isPaid: false,
    }),
    createMockOrder({
      id: 'order-3',
      customer: { id: 'u3', name: 'Charlie', email: 'charlie@test.com' },
      subtotal: 150,
      shippingFee: 15,
      total: 165,
      isPaid: false,
    }),
  ];

  const mockCallbacks = {
    onAddOrder: vi.fn(),
    onViewOrder: vi.fn(),
    onTogglePayment: vi.fn(),
    onEditOrder: vi.fn(),
    onDeleteOrder: vi.fn(),
    onSearchChange: vi.fn(),
    onSort: vi.fn(),
  };

  const defaultProps = {
    orders: mockOrders,
    filteredOrders: mockOrders,
    isActive: true,
    canEditCampaign: true,
    currentUserId: 'user-1',
    orderSearch: '',
    sortField: 'customerName' as const,
    sortDirection: 'asc' as const,
    ...mockCallbacks,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render orders tab header', () => {
      render(<OrdersTab {...defaultProps} />);

      expect(screen.getByText('Pedidos')).toBeInTheDocument();
    });

    it('should render add order button when campaign is active', () => {
      render(<OrdersTab {...defaultProps} isActive={true} />);

      expect(screen.getByRole('button', { name: /adicionar pedido/i })).toBeInTheDocument();
    });

    it('should not render add order button when campaign is not active', () => {
      render(<OrdersTab {...defaultProps} isActive={false} />);

      expect(screen.queryByRole('button', { name: /adicionar pedido/i })).not.toBeInTheDocument();
    });

    it('should render search input', () => {
      render(<OrdersTab {...defaultProps} />);

      expect(screen.getByPlaceholderText(/buscar por pessoa/i)).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should call onSearchChange when search input changes', async () => {
      const user = userEvent.setup();
      render(<OrdersTab {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/buscar por pessoa/i);
      await user.type(searchInput, 'Alice');

      expect(mockCallbacks.onSearchChange).toHaveBeenCalled();
    });

    it('should display search value', () => {
      render(<OrdersTab {...defaultProps} orderSearch="Alice" />);

      const searchInput = screen.getByPlaceholderText(/buscar por pessoa/i) as HTMLInputElement;
      expect(searchInput.value).toBe('Alice');
    });

    it('should show clear button when search has value', () => {
      render(<OrdersTab {...defaultProps} orderSearch="Alice" />);

      const clearButton = screen.getByTitle(/limpar busca/i);
      expect(clearButton).toBeInTheDocument();
    });

    it('should not show clear button when search is empty', () => {
      render(<OrdersTab {...defaultProps} orderSearch="" />);

      expect(screen.queryByTitle(/limpar busca/i)).not.toBeInTheDocument();
    });

    it('should call onSearchChange with empty string when clear button is clicked', async () => {
      const user = userEvent.setup();
      render(<OrdersTab {...defaultProps} orderSearch="Alice" />);

      const clearButton = screen.getByTitle(/limpar busca/i);
      await user.click(clearButton);

      expect(mockCallbacks.onSearchChange).toHaveBeenCalledWith('');
    });
  });

  describe('Empty State', () => {
    it('should show empty state when there are no orders', () => {
      render(<OrdersTab {...defaultProps} filteredOrders={[]} />);

      expect(screen.getByText('Nenhum pedido criado')).toBeInTheDocument();
    });

    it('should show "not found" message when search yields no results', () => {
      render(<OrdersTab {...defaultProps} filteredOrders={[]} orderSearch="Nonexistent" />);

      expect(screen.getByText('Nenhum pedido encontrado')).toBeInTheDocument();
    });
  });

  describe('Mobile View - Cards', () => {
    it('should render OrderCard for each order in mobile view', () => {
      render(<OrdersTab {...defaultProps} />);

      expect(screen.getByTestId('order-card-order-1')).toBeInTheDocument();
      expect(screen.getByTestId('order-card-order-2')).toBeInTheDocument();
      expect(screen.getByTestId('order-card-order-3')).toBeInTheDocument();
    });

    it('should render mobile sorting controls', () => {
      render(<OrdersTab {...defaultProps} />);

      // Mobile sorting buttons (these appear in mobile view)
      const buttons = screen.getAllByRole('button');
      const sortButtons = buttons.filter(btn =>
        btn.textContent?.includes('Pessoa') ||
        btn.textContent?.includes('Total') ||
        btn.textContent?.includes('Status')
      );

      expect(sortButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Desktop View - Table', () => {
    it('should render table headers', () => {
      render(<OrdersTab {...defaultProps} />);

      expect(screen.getAllByText('Status')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Pessoa')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Produtos')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Subtotal')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Frete')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Total')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Ações')[0]).toBeInTheDocument();
    });

    it('should render order data in table rows', () => {
      render(<OrdersTab {...defaultProps} />);

      // Customer names might be rendered multiple times (mobile + desktop views)
      // Just check that at least one instance of each name exists
      const aliceElements = screen.queryAllByText(/alice/i);
      const bobElements = screen.queryAllByText(/bob/i);
      const charlieElements = screen.queryAllByText(/charlie/i);

      expect(aliceElements.length).toBeGreaterThan(0);
      expect(bobElements.length).toBeGreaterThan(0);
      expect(charlieElements.length).toBeGreaterThan(0);
    });

    it('should display payment status badges', () => {
      render(<OrdersTab {...defaultProps} />);

      const paidBadges = screen.getAllByText('Pago');
      const pendingBadges = screen.getAllByText('Pendente');

      expect(paidBadges.length).toBeGreaterThan(0);
      expect(pendingBadges.length).toBeGreaterThan(0);
    });

    it('should display order financial values', () => {
      render(<OrdersTab {...defaultProps} />);

      expect(screen.getByText('R$ 100,00')).toBeInTheDocument(); // Alice subtotal
      expect(screen.getByText('R$ 10,00')).toBeInTheDocument(); // Alice shipping
      expect(screen.getByText('R$ 110,00')).toBeInTheDocument(); // Alice total
    });
  });

  describe('Sorting', () => {
    it('should call onSort when clicking on sortable column header', async () => {
      const user = userEvent.setup();
      render(<OrdersTab {...defaultProps} />);

      const customerNameHeader = screen.getAllByText('Pessoa')[0].closest('th');
      if (customerNameHeader) {
        await user.click(customerNameHeader);
        expect(mockCallbacks.onSort).toHaveBeenCalledWith('customerName');
      }
    });

    it('should call onSort with different fields', async () => {
      const user = userEvent.setup();
      render(<OrdersTab {...defaultProps} />);

      const totalHeader = screen.getAllByText('Total')[0].closest('th');
      if (totalHeader) {
        await user.click(totalHeader);
        expect(mockCallbacks.onSort).toHaveBeenCalledWith('total');
      }
    });

    it('should display sort direction indicator for active sort field', () => {
      render(<OrdersTab {...defaultProps} sortField="customerName" sortDirection="asc" />);

      // Check for SVG elements (sort icons)
      const svgs = document.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThan(0);
    });

    it('should call onSort when clicking mobile sort buttons', async () => {
      const user = userEvent.setup();
      render(<OrdersTab {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      const pessoaButton = buttons.find(btn => btn.textContent?.includes('Pessoa'));

      if (pessoaButton) {
        await user.click(pessoaButton);
        expect(mockCallbacks.onSort).toHaveBeenCalledWith('customerName');
      }
    });
  });

  describe('Order Actions', () => {
    it('should call onAddOrder when add button is clicked', async () => {
      const user = userEvent.setup();
      render(<OrdersTab {...defaultProps} />);

      const addButton = screen.getByRole('button', { name: /adicionar pedido/i });
      await user.click(addButton);

      expect(mockCallbacks.onAddOrder).toHaveBeenCalledTimes(1);
    });

    it('should call onViewOrder when view button is clicked in table', async () => {
      const user = userEvent.setup();
      render(<OrdersTab {...defaultProps} />);

      // Find view buttons (Eye icon buttons)
      const viewButtons = screen.getAllByTitle(/visualizar pedido/i);
      await user.click(viewButtons[0]);

      expect(mockCallbacks.onViewOrder).toHaveBeenCalledWith(mockOrders[0]);
    });

    it('should call onTogglePayment when payment button is clicked', async () => {
      const user = userEvent.setup();
      render(<OrdersTab {...defaultProps} />);

      // Find payment toggle buttons
      const paymentButtons = screen.getAllByTitle(/marcar como/i);
      if (paymentButtons.length > 0) {
        await user.click(paymentButtons[0]);
        expect(mockCallbacks.onTogglePayment).toHaveBeenCalled();
      }
    });

    it('should call onEditOrder when edit button is clicked', async () => {
      const user = userEvent.setup();
      render(<OrdersTab {...defaultProps} />);

      // Find edit buttons
      const editButtons = screen.getAllByTitle(/editar pedido/i);
      if (editButtons.length > 0) {
        await user.click(editButtons[0]);
        expect(mockCallbacks.onEditOrder).toHaveBeenCalled();
      }
    });

    it('should confirm before calling onDeleteOrder', async () => {
      const user = userEvent.setup();
      render(<OrdersTab {...defaultProps} />);

      // Find delete buttons
      const deleteButtons = screen.getAllByTitle(/remover pedido/i);
      if (deleteButtons.length > 0) {
        // Click delete button
        await user.click(deleteButtons[0]);

        // Modal should appear with confirmation message
        expect(screen.getByText('Remover Pedido')).toBeInTheDocument();
        expect(screen.getByText(/tem certeza que deseja remover o pedido/i)).toBeInTheDocument();

        // Click confirm button in modal (get all buttons with "Remover" and filter for the modal one)
        const allRemoverButtons = screen.getAllByRole('button', { name: /remover/i });
        // The last one should be the confirm button in the modal
        const confirmButton = allRemoverButtons[allRemoverButtons.length - 1];
        await user.click(confirmButton);

        // onDeleteOrder should be called
        expect(mockCallbacks.onDeleteOrder).toHaveBeenCalledWith(mockOrders[0].id);
      }
    });

    it('should not call onDeleteOrder if user cancels confirmation', async () => {
      const user = userEvent.setup();
      render(<OrdersTab {...defaultProps} />);

      const deleteButtons = screen.getAllByTitle(/remover pedido/i);
      if (deleteButtons.length > 0) {
        // Click delete button
        await user.click(deleteButtons[0]);

        // Modal should appear
        expect(screen.getByText('Remover Pedido')).toBeInTheDocument();

        // Click cancel button in modal
        const cancelButton = screen.getByRole('button', { name: /cancelar/i });
        await user.click(cancelButton);

        // onDeleteOrder should NOT be called
        expect(mockCallbacks.onDeleteOrder).not.toHaveBeenCalled();

        // Modal should be closed
        expect(screen.queryByText('Remover Pedido')).not.toBeInTheDocument();
      }
    });
  });

  describe('Permissions', () => {
    it('should show payment toggle button only when user can edit campaign', () => {
      render(<OrdersTab {...defaultProps} canEditCampaign={true} />);

      expect(screen.queryAllByTitle(/marcar como/i).length).toBeGreaterThan(0);
    });

    it('should not show payment toggle button when user cannot edit campaign', () => {
      render(<OrdersTab {...defaultProps} canEditCampaign={false} />);

      expect(screen.queryAllByTitle(/marcar como/i).length).toBe(0);
    });

    it('should show edit button only when campaign is active', () => {
      render(<OrdersTab {...defaultProps} isActive={true} />);

      expect(screen.queryAllByTitle(/editar pedido/i).length).toBeGreaterThan(0);
    });

    it('should not show edit button when campaign is not active', () => {
      render(<OrdersTab {...defaultProps} isActive={false} />);

      expect(screen.queryAllByTitle(/editar pedido/i).length).toBe(0);
    });

    it('should show delete button only for campaign editors and when active', () => {
      render(<OrdersTab {...defaultProps} isActive={true} canEditCampaign={true} />);

      expect(screen.queryAllByTitle(/remover pedido/i).length).toBeGreaterThan(0);
    });

    it('should not show delete button when user cannot edit campaign', () => {
      render(<OrdersTab {...defaultProps} isActive={true} canEditCampaign={false} />);

      expect(screen.queryAllByTitle(/remover pedido/i).length).toBe(0);
    });
  });

  describe('Responsive Design', () => {
    it('should have mobile-specific container classes', () => {
      const { container } = render(<OrdersTab {...defaultProps} />);

      const mobileContainer = container.querySelector('.md\\:hidden');
      expect(mobileContainer).toBeInTheDocument();
    });

    it('should have desktop-specific container classes', () => {
      const { container } = render(<OrdersTab {...defaultProps} />);

      const desktopContainer = container.querySelector('.hidden.md\\:block');
      expect(desktopContainer).toBeInTheDocument();
    });

    it('should have bottom padding for mobile navigation', () => {
      const { container } = render(<OrdersTab {...defaultProps} />);

      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer).toHaveClass('pb-20');
    });
  });
});
