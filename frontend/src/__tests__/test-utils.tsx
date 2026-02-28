/**
 * Test Utilities
 * Shared utilities and helpers for testing
 */

import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import * as AuthContext from '@/contexts/AuthContext';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// Mock AuthContext
export const mockAuthContext = {
  isAuthenticated: true,
  user: {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'CUSTOMER' as const,
  },
  isLoading: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  refreshUser: vi.fn(),
  setUser: vi.fn(),
  requireAuth: vi.fn(),
  setPendingAction: vi.fn(),
  hasPendingAction: vi.fn(() => false),
  executePendingActionFromData: vi.fn(),
};

// Create a fresh QueryClient for each test
export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

// Type for auth context that allows user to be null
type MockAuthContextType = typeof mockAuthContext | Omit<typeof mockAuthContext, 'user'> & { user: null };

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  authContext?: MockAuthContextType;
  initialRoute?: string;
}

export function renderWithProviders(
  ui: ReactElement,
  {
    queryClient = createTestQueryClient(),
    authContext,
    initialRoute = '/',
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  // Override the default mock with custom auth context if provided
  if (authContext) {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue(authContext);
  }

  if (initialRoute !== '/') {
    window.history.pushState({}, 'Test page', initialRoute);
  }

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
}

// Mock Socket.IO client
export const createMockSocket = () => {
  const listeners = new Map<string, Array<(...args: unknown[]) => void>>();

  return {
    connected: true,
    on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      if (!listeners.has(event)) {
        listeners.set(event, []);
      }
      listeners.get(event)!.push(handler);
    }),
    off: vi.fn((event: string, handler?: (...args: unknown[]) => void) => {
      if (handler) {
        const handlers = listeners.get(event);
        if (handlers) {
          const index = handlers.indexOf(handler);
          if (index > -1) {
            handlers.splice(index, 1);
          }
        }
      } else {
        listeners.delete(event);
      }
    }),
    emit: vi.fn((event: string, ...args: unknown[]) => {
      const handlers = listeners.get(event);
      if (handlers) {
        handlers.forEach(handler => handler(...args));
      }
    }),
    disconnect: vi.fn(),
    connect: vi.fn(),
    // Helper to trigger event from "server"
    _triggerEvent: (event: string, ...args: unknown[]) => {
      const handlers = listeners.get(event);
      if (handlers) {
        handlers.forEach(handler => handler(...args));
      }
    },
    _getListeners: () => listeners,
  };
};

// Mock notification data
export const createMockNotification = (
  overrides: Partial<unknown> = {}
): unknown => ({
  id: 'notif-1',
  userId: 'user-1',
  type: 'CAMPAIGN_READY_TO_SEND',
  title: 'Campanha pronta para envio',
  message: 'Sua campanha está pronta para ser enviada',
  isRead: false,
  metadata: {
    campaignId: 'campaign-1',
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

// Wait for a condition with timeout
export const waitFor = (
  condition: () => boolean,
  timeout = 1000,
  interval = 50
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const checkCondition = () => {
      if (condition()) {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        reject(new Error('Timeout waiting for condition'));
      } else {
        setTimeout(checkCondition, interval);
      }
    };
    checkCondition();
  });
};

