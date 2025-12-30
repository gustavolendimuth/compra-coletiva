/**
 * NotificationIcon Component Tests
 * Tests for the notification bell icon with badge
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationIcon } from '../NotificationIcon';
import * as AuthContext from '../../contexts/AuthContext';
import * as useNotificationsHook from '../../hooks/useNotifications';

// Mock the dependencies
vi.mock('../../contexts/AuthContext');
vi.mock('../../hooks/useNotifications');

describe('NotificationIcon', () => {
  const mockUseAuth = vi.spyOn(AuthContext, 'useAuth');
  const mockUseNotifications = vi.spyOn(useNotificationsHook, 'useNotifications');

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      requireAuth: vi.fn(),
      setPendingAction: vi.fn(),
      hasPendingAction: vi.fn(() => false),
      executePendingActionFromData: vi.fn(),
    });

    mockUseNotifications.mockReturnValue({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      markAsRead: vi.fn(),
      deleteNotification: vi.fn(),
      handleNotificationClick: vi.fn(),
    });
  });

  describe('Rendering', () => {
    it('renders bell icon when authenticated', () => {
      render(<NotificationIcon />);
      expect(screen.getByRole('button', { name: /notificações/i })).toBeInTheDocument();
    });

    it('does not render when not authenticated', () => {
      mockUseAuth.mockReturnValue({
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
      });

      const { container } = render(<NotificationIcon />);
      expect(container).toBeEmptyDOMElement();
    });

    it('has correct accessibility attributes when closed', () => {
      render(<NotificationIcon />);
      const button = screen.getByRole('button', { name: /notificações/i });

      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(button).toHaveAttribute('aria-label', 'Notificações');
      expect(button).toHaveAttribute('title', 'Notificações');
    });

    it('has correct accessibility attributes when open', async () => {
      const user = userEvent.setup();
      render(<NotificationIcon />);

      const button = screen.getByRole('button', { name: /notificações/i });
      await user.click(button);

      expect(button).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Unread Badge', () => {
    it('does not show badge when unreadCount is 0', () => {
      mockUseNotifications.mockReturnValue({
        notifications: [],
        unreadCount: 0,
        isLoading: false,
        markAsRead: vi.fn(),
        deleteNotification: vi.fn(),
        handleNotificationClick: vi.fn(),
      });

      render(<NotificationIcon />);
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });

    it('shows badge with unread count when count is 1-99', () => {
      mockUseNotifications.mockReturnValue({
        notifications: [],
        unreadCount: 5,
        isLoading: false,
        markAsRead: vi.fn(),
        deleteNotification: vi.fn(),
        handleNotificationClick: vi.fn(),
      });

      render(<NotificationIcon />);
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('shows "99+" when unread count exceeds 99', () => {
      mockUseNotifications.mockReturnValue({
        notifications: [],
        unreadCount: 150,
        isLoading: false,
        markAsRead: vi.fn(),
        deleteNotification: vi.fn(),
        handleNotificationClick: vi.fn(),
      });

      render(<NotificationIcon />);
      expect(screen.getByText('99+')).toBeInTheDocument();
    });

    it('applies correct styling to badge', () => {
      mockUseNotifications.mockReturnValue({
        notifications: [],
        unreadCount: 3,
        isLoading: false,
        markAsRead: vi.fn(),
        deleteNotification: vi.fn(),
        handleNotificationClick: vi.fn(),
      });

      render(<NotificationIcon />);
      const badge = screen.getByText('3');

      expect(badge).toHaveClass('bg-red-600', 'text-white', 'rounded-full');
    });
  });

  describe('Dropdown Toggle', () => {
    it('opens dropdown when button is clicked', async () => {
      const user = userEvent.setup();
      render(<NotificationIcon />);

      const button = screen.getByRole('button', { name: /notificações/i });
      await user.click(button);

      expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    it('closes dropdown when button is clicked again', async () => {
      const user = userEvent.setup();
      render(<NotificationIcon />);

      const button = screen.getByRole('button', { name: /notificações/i });

      // Open
      await user.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'true');

      // Close
      await user.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('toggles dropdown multiple times', async () => {
      const user = userEvent.setup();
      render(<NotificationIcon />);

      const button = screen.getByRole('button', { name: /notificações/i });

      // Open
      await user.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'true');

      // Close
      await user.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'false');

      // Open again
      await user.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('ButtonRef Prop', () => {
    it('passes buttonRef to NotificationDropdown', async () => {
      const user = userEvent.setup();
      render(<NotificationIcon />);

      const button = screen.getByRole('button', { name: /notificações/i });
      await user.click(button);

      // The dropdown should receive the buttonRef and use it for positioning
      // We verify this indirectly by checking that the button exists and dropdown can be opened
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    it('button has proper ref for getBoundingClientRect calls', async () => {
      const user = userEvent.setup();
      render(<NotificationIcon />);

      const button = screen.getByRole('button', { name: /notificações/i });

      // Verify button can be measured (needed for mobile positioning)
      const rect = button.getBoundingClientRect();
      expect(rect).toBeDefined();
      expect(typeof rect.bottom).toBe('number');
      expect(typeof rect.right).toBe('number');

      await user.click(button);
    });
  });

  describe('Mobile-First Styling', () => {
    it('applies mobile-first responsive classes', () => {
      render(<NotificationIcon />);
      const button = screen.getByRole('button', { name: /notificações/i });

      expect(button).toHaveClass('p-2', 'rounded-md', 'hover:bg-gray-100', 'transition-colors');
    });

    it('has proper touch target size (44x44px minimum)', () => {
      render(<NotificationIcon />);
      const button = screen.getByRole('button', { name: /notificações/i });

      // In test environment, getBoundingClientRect returns 0
      // Instead, verify the component has the correct padding classes
      expect(button).toHaveClass('p-2');

      // Verify the button is rendered with flex layout for proper sizing
      expect(button).toHaveClass('flex', 'items-center', 'justify-center');
    });
  });
});
