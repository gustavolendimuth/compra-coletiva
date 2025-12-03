import { useEffect, useRef } from 'react';

interface FocusTrapOptions {
  /** Whether to return focus to the previously focused element when the trap is deactivated */
  returnFocusOnCleanup?: boolean;
}

/**
 * Custom hook to trap focus within a container element
 * Automatically manages focus when the trap is activated/deactivated
 * Returns focus to the previously focused element on cleanup (e.g., hamburger button)
 *
 * @param containerRef - Ref to the container element that should trap focus
 * @param isActive - Whether the focus trap is currently active
 * @param options - Configuration options for the focus trap
 */
export const useFocusTrap = (
  containerRef: React.RefObject<HTMLElement>,
  isActive: boolean,
  options: FocusTrapOptions = {}
) => {
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const { returnFocusOnCleanup = true } = options;

  useEffect(() => {
    if (!isActive) return;

    // Store currently focused element (e.g., hamburger button)
    previousActiveElement.current = document.activeElement as HTMLElement;

    const container = containerRef.current;
    if (!container) return;

    // Get all focusable elements within the container
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
    );

    // Focus the first focusable element
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    // Handle Tab key to create focus trap
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift+Tab: If on first element, go to last
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: If on last element, go to first
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);

      // Return focus to the element that opened the menu (e.g., hamburger button)
      if (returnFocusOnCleanup && previousActiveElement.current?.isConnected) {
        previousActiveElement.current.focus();
      }
    };
  }, [containerRef, isActive, returnFocusOnCleanup]);
};
