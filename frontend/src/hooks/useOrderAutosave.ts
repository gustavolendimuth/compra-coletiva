import { useState, useEffect, useRef, useCallback } from 'react';
import type { OrderFormItem } from '@/api/types';

interface UseOrderAutosaveOptions {
  orderId: string | null;
  items: OrderFormItem[];
  isEnabled: boolean;
  onSave: (orderId: string, validItems: Array<{ productId: string; quantity: number }>) => void;
}

interface UseOrderAutosaveReturn {
  isAutosaving: boolean;
  lastSaved: Date | null;
  reset: () => void;
}

export function useOrderAutosave({
  orderId,
  items,
  isEnabled,
  onSave,
}: UseOrderAutosaveOptions): UseOrderAutosaveReturn {
  const [isAutosaving, setIsAutosaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const initialSnapshotRef = useRef<string>('');
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isAutosavingRef = useRef(false);

  // Capture initial snapshot when modal opens (orderId + isEnabled change)
  useEffect(() => {
    if (isEnabled && orderId) {
      initialSnapshotRef.current = JSON.stringify(items);
    }
  // Only capture snapshot when modal opens, not on every items change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEnabled, orderId]);

  // Autosave effect
  useEffect(() => {
    if (!isEnabled || !orderId) return;

    // Compare with initial snapshot - don't save if unchanged
    const currentSnapshot = JSON.stringify(items);
    if (currentSnapshot === initialSnapshotRef.current) return;

    // Clear previous timer
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(() => {
      const validItems = items
        .filter((item): item is { productId: string; quantity: number } =>
          !!item.productId && typeof item.quantity === 'number' && item.quantity > 0
        );

      if (validItems.length > 0) {
        isAutosavingRef.current = true;
        setIsAutosaving(true);
        onSave(orderId, validItems);
      }
    }, 500);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, isEnabled, orderId]);

  const markSaved = useCallback(() => {
    if (isAutosavingRef.current) {
      isAutosavingRef.current = false;
      setIsAutosaving(false);
      setLastSaved(new Date());
      // Update snapshot after save so next change is detected from new baseline
      initialSnapshotRef.current = JSON.stringify(items);
    }
  }, [items]);

  const markError = useCallback(() => {
    isAutosavingRef.current = false;
    setIsAutosaving(false);
  }, []);

  const reset = useCallback(() => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }
    isAutosavingRef.current = false;
    setIsAutosaving(false);
    setLastSaved(null);
    initialSnapshotRef.current = '';
  }, []);

  // Reset when modal closes
  useEffect(() => {
    if (!isEnabled) {
      reset();
    }
  }, [isEnabled, reset]);

  return {
    isAutosaving,
    lastSaved,
    reset,
    // Expose these for mutation callbacks
    _markSaved: markSaved,
    _markError: markError,
  } as UseOrderAutosaveReturn & { _markSaved: () => void; _markError: () => void };
}
