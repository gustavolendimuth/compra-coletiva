import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { Notification } from "@/api/types";
import { useNotifications } from "../useNotifications";

const {
  mockInvalidateQueries,
  mockSocketOn,
  mockSocketOff,
  mockToastSuccess,
} = vi.hoisted(() => ({
  mockInvalidateQueries: vi.fn(),
  mockSocketOn: vi.fn(),
  mockSocketOff: vi.fn(),
  mockToastSuccess: vi.fn(),
}));

let notificationCreatedHandler: ((notification: Notification) => void) | null = null;
let connectHandler: (() => void) | null = null;

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(() => ({
    data: { notifications: [], unreadCount: 0 },
    isLoading: false,
  })),
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
  })),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: mockInvalidateQueries,
  })),
}));

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true,
    user: { id: "user-1" },
  })),
}));

vi.mock("../../api", () => ({
  notificationService: {
    list: vi.fn(),
    markAsRead: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("../../lib/socket", () => ({
  getSocket: vi.fn(() => ({
    connected: true,
    on: mockSocketOn.mockImplementation((event: string, handler: unknown) => {
      if (event === "notification-created") {
        notificationCreatedHandler = handler as (notification: Notification) => void;
      }
      if (event === "connect") {
        connectHandler = handler as () => void;
      }
    }),
    off: mockSocketOff,
  })),
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}));

vi.mock("react-hot-toast", () => ({
  default: {
    success: mockToastSuccess,
    error: vi.fn(),
  },
}));

describe("useNotifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    notificationCreatedHandler = null;
    connectHandler = null;
  });

  it("should show notification toast with stable id based on notification id", () => {
    renderHook(() => useNotifications());

    expect(mockSocketOn).toHaveBeenCalledWith("notification-created", expect.any(Function));
    expect(mockSocketOn).toHaveBeenCalledWith("connect", expect.any(Function));

    const notification = {
      id: "notif-123",
      userId: "user-1",
      type: "PAYMENT_RELEASED",
      title: "Pagamento liberado",
      message: "Você já pode pagar",
      isRead: false,
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } satisfies Notification;

    act(() => {
      notificationCreatedHandler?.(notification);
    });

    expect(mockToastSuccess).toHaveBeenCalledWith("Pagamento liberado", {
      id: "notification-notif-123",
      duration: 4000,
      icon: "🔔",
    });
  });

  it("should invalidate notifications when socket connects", () => {
    renderHook(() => useNotifications());

    act(() => {
      connectHandler?.();
    });

    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["notifications"] });
  });
});
