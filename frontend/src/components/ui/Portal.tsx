/**
 * Portal Component
 * Renders children into a DOM node outside the component hierarchy
 * Useful for modals, dropdowns, and tooltips to avoid z-index and overflow issues
 */

import { useEffect, useState, ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
  children: ReactNode;
  container?: HTMLElement;
}

export function Portal({ children, container }: PortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) {
    return null;
  }

  const portalContainer = container || document.body;
  return createPortal(children, portalContainer);
}
