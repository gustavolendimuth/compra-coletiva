import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOrderAutosave } from '../useOrderAutosave';
import type { OrderFormItem } from '@/api/types';

describe('useOrderAutosave', () => {
  const mockOnSave = vi.fn();

  const defaultOptions = {
    orderId: 'order-1',
    items: [{ productId: 'product-1', quantity: 2 }] as OrderFormItem[],
    isEnabled: true,
    onSave: mockOnSave,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Initial State', () => {
    it('should return isAutosaving as false initially', () => {
      const { result } = renderHook(() => useOrderAutosave(defaultOptions));

      expect(result.current.isAutosaving).toBe(false);
    });

    it('should return lastSaved as null initially', () => {
      const { result } = renderHook(() => useOrderAutosave(defaultOptions));

      expect(result.current.lastSaved).toBeNull();
    });

    it('should return a reset function', () => {
      const { result } = renderHook(() => useOrderAutosave(defaultOptions));

      expect(typeof result.current.reset).toBe('function');
    });
  });

  describe('Autosave Trigger', () => {
    it('should not call onSave when items have not changed from initial snapshot', () => {
      renderHook(() => useOrderAutosave(defaultOptions));

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should call onSave after debounce when items change', () => {
      const { rerender } = renderHook(
        (props) => useOrderAutosave(props),
        { initialProps: defaultOptions }
      );

      // Change items to trigger autosave
      rerender({
        ...defaultOptions,
        items: [{ productId: 'product-1', quantity: 5 }],
      });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(mockOnSave).toHaveBeenCalledWith('order-1', [
        { productId: 'product-1', quantity: 5 },
      ]);
    });

    it('should not call onSave before debounce period', () => {
      const { rerender } = renderHook(
        (props) => useOrderAutosave(props),
        { initialProps: defaultOptions }
      );

      rerender({
        ...defaultOptions,
        items: [{ productId: 'product-1', quantity: 5 }],
      });

      act(() => {
        vi.advanceTimersByTime(400); // Less than 500ms debounce
      });

      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should debounce multiple rapid changes', () => {
      const { rerender } = renderHook(
        (props) => useOrderAutosave(props),
        { initialProps: defaultOptions }
      );

      // Rapid changes
      rerender({
        ...defaultOptions,
        items: [{ productId: 'product-1', quantity: 3 }],
      });

      act(() => {
        vi.advanceTimersByTime(200);
      });

      rerender({
        ...defaultOptions,
        items: [{ productId: 'product-1', quantity: 4 }],
      });

      act(() => {
        vi.advanceTimersByTime(200);
      });

      rerender({
        ...defaultOptions,
        items: [{ productId: 'product-1', quantity: 5 }],
      });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Only the last change should trigger a save
      expect(mockOnSave).toHaveBeenCalledTimes(1);
      expect(mockOnSave).toHaveBeenCalledWith('order-1', [
        { productId: 'product-1', quantity: 5 },
      ]);
    });
  });

  describe('Disabled State', () => {
    it('should not call onSave when isEnabled is false', () => {
      const { rerender } = renderHook(
        (props) => useOrderAutosave(props),
        { initialProps: { ...defaultOptions, isEnabled: false } }
      );

      rerender({
        ...defaultOptions,
        isEnabled: false,
        items: [{ productId: 'product-1', quantity: 5 }],
      });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should not call onSave when orderId is null', () => {
      const { rerender } = renderHook(
        (props) => useOrderAutosave(props),
        { initialProps: { ...defaultOptions, orderId: null } }
      );

      rerender({
        ...defaultOptions,
        orderId: null,
        items: [{ productId: 'product-1', quantity: 5 }],
      });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });

  describe('Item Filtering', () => {
    it('should filter out items without productId', () => {
      const { rerender } = renderHook(
        (props) => useOrderAutosave(props),
        { initialProps: defaultOptions }
      );

      rerender({
        ...defaultOptions,
        items: [
          { productId: '', quantity: 1 },
          { productId: 'product-1', quantity: 3 },
        ],
      });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(mockOnSave).toHaveBeenCalledWith('order-1', [
        { productId: 'product-1', quantity: 3 },
      ]);
    });

    it('should filter out items with zero quantity', () => {
      const { rerender } = renderHook(
        (props) => useOrderAutosave(props),
        { initialProps: defaultOptions }
      );

      rerender({
        ...defaultOptions,
        items: [
          { productId: 'product-1', quantity: 0 },
          { productId: 'product-2', quantity: 2 },
        ],
      });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(mockOnSave).toHaveBeenCalledWith('order-1', [
        { productId: 'product-2', quantity: 2 },
      ]);
    });

    it('should not call onSave when all items are invalid', () => {
      const { rerender } = renderHook(
        (props) => useOrderAutosave(props),
        { initialProps: defaultOptions }
      );

      rerender({
        ...defaultOptions,
        items: [
          { productId: '', quantity: 1 },
          { productId: 'product-1', quantity: 0 },
        ],
      });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });

  describe('Reset', () => {
    it('should reset autosave state', () => {
      const { result } = renderHook(() => useOrderAutosave(defaultOptions));

      act(() => {
        result.current.reset();
      });

      expect(result.current.isAutosaving).toBe(false);
      expect(result.current.lastSaved).toBeNull();
    });
  });

  describe('Modal Close Reset', () => {
    it('should reset when isEnabled changes to false', () => {
      const { result, rerender } = renderHook(
        (props) => useOrderAutosave(props),
        { initialProps: defaultOptions }
      );

      rerender({ ...defaultOptions, isEnabled: false });

      expect(result.current.isAutosaving).toBe(false);
      expect(result.current.lastSaved).toBeNull();
    });
  });

  describe('Internal Methods', () => {
    it('should expose _markSaved and _markError methods', () => {
      const { result } = renderHook(() => useOrderAutosave(defaultOptions));

      const extendedResult = result.current as ReturnType<typeof useOrderAutosave> & {
        _markSaved: () => void;
        _markError: () => void;
      };

      expect(typeof extendedResult._markSaved).toBe('function');
      expect(typeof extendedResult._markError).toBe('function');
    });
  });
});
