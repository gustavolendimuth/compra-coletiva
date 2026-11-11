import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock environment variables for Next.js
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000';

function createStorageMock() {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => (key in store ? store[key] : null)),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = String(value);
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
    get length() {
      return Object.keys(store).length;
    },
  };
}

function installStorageMocks() {
  const localStorageMock = createStorageMock();
  const sessionStorageMock = createStorageMock();

  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    configurable: true,
    writable: true,
  });

  Object.defineProperty(window, 'sessionStorage', {
    value: sessionStorageMock,
    configurable: true,
    writable: true,
  });

  Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock,
    configurable: true,
    writable: true,
  });

  Object.defineProperty(globalThis, 'sessionStorage', {
    value: sessionStorageMock,
    configurable: true,
    writable: true,
  });
}

installStorageMocks();

beforeEach(() => {
  installStorageMocks();
});

// JSDOM exposes requestSubmit but throws "Not implemented" in some versions.
Object.defineProperty(HTMLFormElement.prototype, 'requestSubmit', {
  configurable: true,
  writable: true,
  value: function requestSubmit(this: HTMLFormElement) {
    this.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  },
});

// Mock AuthContext globally
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    user: null,
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
    requireAuth: vi.fn(),
    setPendingAction: vi.fn(),
    hasPendingAction: vi.fn(() => false),
    executePendingActionFromData: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as unknown;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as unknown;
