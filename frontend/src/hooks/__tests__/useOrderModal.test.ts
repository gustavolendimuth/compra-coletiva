import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useOrderModal } from '../useOrderModal';
import { createMockOrder } from '@/__tests__/mock-data';

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock the order API
vi.mock('@/api', () => ({
  orderApi: {
    create: vi.fn(),
    updateWithItems: vi.fn(),
    delete: vi.fn(),
    updatePayment: vi.fn(),
  },
  Order: {},
  Product: {},
}));

// Import after mock
import { orderApi } from '@/api';

interface AutosaveOptions {
  orderId: string | null;
  items: Array<{ productId: string; quantity: number }>;
  isEnabled: boolean;
  onSave: (orderId: string, validItems: Array<{ productId: string; quantity: number }>) => void;
}

const autosaveState = {
  isAutosaving: false,
  lastSaved: null,
  reset: vi.fn(),
  _markSaved: vi.fn(),
  _markError: vi.fn(),
};

let lastAutosaveOptions: AutosaveOptions | null = null;

// Mock useOrderAutosave
vi.mock('../useOrderAutosave', () => ({
  useOrderAutosave: (options: AutosaveOptions) => {
    lastAutosaveOptions = options;
    return autosaveState;
  },
}));

describe('useOrderModal', () => {
  let queryClient: QueryClient;

  const mockOrders = [
    createMockOrder({
      id: 'order-1',
      userId: 'user-1',
      customer: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
    }),
  ];

  const mockUser = { id: 'user-1', name: 'Test User' };
  const mockRequireAuth = vi.fn((cb: () => void) => cb());

  const defaultOptions = {
    orders: mockOrders,
    campaignId: 'campaign-1',
    user: mockUser,
    isActive: true,
    requireAuth: mockRequireAuth,
  };

  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false },
      },
    });

    return ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    lastAutosaveOptions = null;
    vi.mocked(orderApi.create).mockResolvedValue(createMockOrder({ id: 'new-order' }));
    vi.mocked(orderApi.updateWithItems).mockResolvedValue(createMockOrder({ id: 'order-1' }));
    vi.mocked(orderApi.delete).mockResolvedValue(undefined);
    vi.mocked(orderApi.updatePayment).mockResolvedValue(undefined);
  });

  describe('Initial State', () => {
    it('should return all modal states as closed initially', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useOrderModal(defaultOptions), { wrapper });

      expect(result.current.isEditOrderModalOpen).toBe(false);
      expect(result.current.isViewOrderModalOpen).toBe(false);
      expect(result.current.isPaymentProofModalOpen).toBe(false);
    });

    it('should return null for editing/viewing orders initially', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useOrderModal(defaultOptions), { wrapper });

      expect(result.current.editingOrder).toBeNull();
      expect(result.current.viewingOrder).toBeNull();
      expect(result.current.orderForPayment).toBeNull();
    });

    it('should return autosave state', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useOrderModal(defaultOptions), { wrapper });

      expect(result.current.isAutosaving).toBe(false);
      expect(result.current.lastSaved).toBeNull();
    });

    it('should return all handler functions', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useOrderModal(defaultOptions), { wrapper });

      expect(typeof result.current.handleAddOrder).toBe('function');
      expect(typeof result.current.handleAddToOrder).toBe('function');
      expect(typeof result.current.handleEditOrder).toBe('function');
      expect(typeof result.current.handleDeleteOrder).toBe('function');
      expect(typeof result.current.handleEditOrderFromView).toBe('function');
      expect(typeof result.current.handleTogglePayment).toBe('function');
      expect(typeof result.current.handlePaymentProofSubmit).toBe('function');
      expect(typeof result.current.openEditOrderModal).toBe('function');
    });

    it('should return mutation objects', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useOrderModal(defaultOptions), { wrapper });

      expect(result.current.createOrderMutation).toBeDefined();
      expect(result.current.updateOrderWithItemsMutation).toBeDefined();
      expect(result.current.updatePaymentMutation).toBeDefined();
    });
  });

  describe('Modal State Setters', () => {
    it('should expose setIsEditOrderModalOpen', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useOrderModal(defaultOptions), { wrapper });

      act(() => {
        result.current.setIsEditOrderModalOpen(true);
      });

      expect(result.current.isEditOrderModalOpen).toBe(true);
    });

    it('should expose setIsViewOrderModalOpen', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useOrderModal(defaultOptions), { wrapper });

      act(() => {
        result.current.setIsViewOrderModalOpen(true);
      });

      expect(result.current.isViewOrderModalOpen).toBe(true);
    });

    it('should expose setIsPaymentProofModalOpen', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useOrderModal(defaultOptions), { wrapper });

      act(() => {
        result.current.setIsPaymentProofModalOpen(true);
      });

      expect(result.current.isPaymentProofModalOpen).toBe(true);
    });

    it('should expose setEditingOrder', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useOrderModal(defaultOptions), { wrapper });
      const order = createMockOrder({ id: 'order-test' });

      act(() => {
        result.current.setEditingOrder(order);
      });

      expect(result.current.editingOrder).toEqual(order);
    });

    it('should expose setViewingOrder', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useOrderModal(defaultOptions), { wrapper });
      const order = createMockOrder({ id: 'order-test' });

      act(() => {
        result.current.setViewingOrder(order);
      });

      expect(result.current.viewingOrder).toEqual(order);
    });

    it('should expose setEditOrderForm', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useOrderModal(defaultOptions), { wrapper });

      act(() => {
        result.current.setEditOrderForm({
          campaignId: 'campaign-1',
          items: [{ productId: 'p1', quantity: 3 }],
        });
      });

      expect(result.current.editOrderForm.items).toEqual([
        { productId: 'p1', quantity: 3 },
      ]);
    });
  });

  describe('openEditOrderModal', () => {
    it('should set editingOrder and open edit modal', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useOrderModal(defaultOptions), { wrapper });
      const order = createMockOrder({ id: 'order-edit' });

      act(() => {
        result.current.openEditOrderModal(order);
      });

      expect(result.current.editingOrder).toEqual(order);
      expect(result.current.isEditOrderModalOpen).toBe(true);
    });

    it('should populate editOrderForm from the order items', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useOrderModal(defaultOptions), { wrapper });
      const order = createMockOrder({
        id: 'order-edit',
        items: [
          {
            id: 'item-1',
            orderId: 'order-edit',
            productId: 'product-1',
            quantity: 3,
            unitPrice: 10,
            subtotal: 30,
            product: {
              id: 'product-1',
              campaignId: 'campaign-1',
              name: 'Product 1',
              price: 10,
              weight: 100,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          },
        ],
      });

      act(() => {
        result.current.openEditOrderModal(order);
      });

      expect(result.current.editOrderForm.items).toEqual([
        { productId: 'product-1', quantity: 3 },
      ]);
    });
  });

  describe('closeEditOrderModal', () => {
    it('should close modal and reset edit form state', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useOrderModal(defaultOptions), { wrapper });
      const order = createMockOrder({ id: 'order-edit' });

      act(() => {
        result.current.openEditOrderModal(order);
      });

      act(() => {
        result.current.closeEditOrderModal();
      });

      expect(result.current.isEditOrderModalOpen).toBe(false);
      expect(result.current.editingOrder).toBeNull();
      expect(result.current.editOrderForm).toEqual({ campaignId: '', items: [] });
    });
  });

  describe('Autosave Integration', () => {
    it('should call updateWithItems when autosave onSave is invoked', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useOrderModal(defaultOptions), { wrapper });

      act(() => {
        result.current.openEditOrderModal(mockOrders[0]);
      });

      expect(lastAutosaveOptions?.isEnabled).toBe(true);

      act(() => {
        lastAutosaveOptions?.onSave('order-1', [
          { productId: 'product-1', quantity: 2 },
        ]);
      });

      await waitFor(() => {
        expect(orderApi.updateWithItems).toHaveBeenCalledWith('order-1', {
          items: [{ productId: 'product-1', quantity: 2 }],
        });
      });
    });
  });

  describe('handleAddOrder', () => {
    it('should call requireAuth', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useOrderModal(defaultOptions), { wrapper });

      act(() => {
        result.current.handleAddOrder();
      });

      expect(mockRequireAuth).toHaveBeenCalled();
    });

    it('should open edit modal for existing order when user already has one', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useOrderModal(defaultOptions), { wrapper });

      act(() => {
        result.current.handleAddOrder();
      });

      // User has existing order (mockOrders[0].userId === 'user-1')
      expect(result.current.editingOrder).toBeDefined();
      expect(result.current.isEditOrderModalOpen).toBe(true);
    });

    it('should create a new order when user has no existing order', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useOrderModal({
          ...defaultOptions,
          orders: [], // No existing orders
        }),
        { wrapper }
      );

      act(() => {
        result.current.handleAddOrder();
      });

      await waitFor(() => {
        expect(orderApi.create).toHaveBeenCalled();
        const callArgs = vi.mocked(orderApi.create).mock.calls[0];
        expect(callArgs[0]).toEqual({
          campaignId: 'campaign-1',
          items: [],
        });
      });
    });
  });

  describe('handleDeleteOrder', () => {
    it('should call deleteOrderMutation.mutate with orderId', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useOrderModal(defaultOptions), { wrapper });

      act(() => {
        result.current.handleDeleteOrder('order-1');
      });

      await waitFor(() => {
        expect(orderApi.delete).toHaveBeenCalled();
        const callArgs = vi.mocked(orderApi.delete).mock.calls[0];
        expect(callArgs[0]).toBe('order-1');
      });
    });
  });

  describe('handleEditOrderFromView', () => {
    it('should close view modal and open edit modal when viewingOrder exists', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useOrderModal(defaultOptions), { wrapper });
      const order = createMockOrder({ id: 'order-view' });

      // Set a viewing order first
      act(() => {
        result.current.setViewingOrder(order);
        result.current.setIsViewOrderModalOpen(true);
      });

      act(() => {
        result.current.handleEditOrderFromView();
      });

      expect(result.current.isViewOrderModalOpen).toBe(false);
      expect(result.current.isEditOrderModalOpen).toBe(true);
      expect(result.current.editingOrder).toEqual(order);
    });
  });

  describe('handleTogglePayment', () => {
    it('should open payment proof modal for unpaid order', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useOrderModal(defaultOptions), { wrapper });
      const unpaidOrder = createMockOrder({ id: 'order-unpaid', isPaid: false });

      act(() => {
        result.current.handleTogglePayment(unpaidOrder);
      });

      expect(result.current.isPaymentProofModalOpen).toBe(true);
      expect(result.current.orderForPayment).toEqual(unpaidOrder);
    });

    it('should trigger updatePayment mutation for paid order (toggle off)', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useOrderModal(defaultOptions), { wrapper });
      const paidOrder = createMockOrder({ id: 'order-paid', isPaid: true });

      act(() => {
        result.current.handleTogglePayment(paidOrder);
      });

      await waitFor(() => {
        expect(orderApi.updatePayment).toHaveBeenCalled();
      });
    });
  });

  describe('handlePaymentProofSubmit', () => {
    it('should trigger updatePayment mutation with file', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useOrderModal(defaultOptions), { wrapper });
      const order = createMockOrder({ id: 'order-payment' });
      const mockFile = new File(['test'], 'proof.jpg', { type: 'image/jpeg' });

      // Set order for payment first
      act(() => {
        result.current.setOrderForPayment(order);
      });

      act(() => {
        result.current.handlePaymentProofSubmit(mockFile);
      });

      await waitFor(() => {
        expect(orderApi.updatePayment).toHaveBeenCalled();
      });
    });

    it('should not call mutation when orderForPayment is null', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useOrderModal(defaultOptions), { wrapper });
      const mockFile = new File(['test'], 'proof.jpg', { type: 'image/jpeg' });

      act(() => {
        result.current.handlePaymentProofSubmit(mockFile);
      });

      expect(orderApi.updatePayment).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should register keyboard event listener', () => {
      const addEventSpy = vi.spyOn(window, 'addEventListener');
      const wrapper = createWrapper();

      renderHook(() => useOrderModal(defaultOptions), { wrapper });

      expect(addEventSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

      addEventSpy.mockRestore();
    });

    it('should clean up keyboard event listener on unmount', () => {
      const removeEventSpy = vi.spyOn(window, 'removeEventListener');
      const wrapper = createWrapper();

      const { unmount } = renderHook(() => useOrderModal(defaultOptions), { wrapper });

      unmount();

      expect(removeEventSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

      removeEventSpy.mockRestore();
    });
  });
});
