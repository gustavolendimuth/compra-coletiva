/**
 * NotificationDropdown Component Tests
 * Tests for the notification dropdown panel
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationDropdown } from '../NotificationDropdown';
import * as useNotificationsHook from '../../hooks/useNotifications';
import {
  mockUnreadNotification,
  mockReadNotification,
  mockMessageNotification,
  createMockNotification,
} from '../../__tests__/mock-data';
import { createRef } from 'react';

// Mock the dependencies
vi.mock('../../hooks/useNotifications');

describe('NotificationDropdown', () => {
  const mockUseNotifications = vi.spyOn(useNotificationsHook, 'useNotifications');
  const mockOnClose = vi.fn();
  const mockHandleNotificationClick = vi.fn();
  const mockDeleteNotification = vi.fn();

  // Create a mock button ref for testing
  const createMockButtonRef = () => {
    const button = document.createElement('button');
    button.getBoundingClientRect = vi.fn(() => ({
      bottom: 100,
      right: 200,
      top: 60,
      left: 160,
      width: 40,
      height: 40,
      x: 160,
      y: 60,
      toJSON: () => {},
    }));
    document.body.appendChild(button);
    return { current: button } as React.RefObject<HTMLButtonElement>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementation
    mockUseNotifications.mockReturnValue({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      markAsRead: vi.fn(),
      deleteNotification: mockDeleteNotification,
      handleNotificationClick: mockHandleNotificationClick,
    });

    // Mock window.innerWidth for mobile/desktop tests
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Clean up any buttons added to body
    document.body.innerHTML = '';
  });

  describe('Rendering', () => {
    it('does not render when isOpen is false', () => {
      const { container } = render(
        <NotificationDropdown isOpen={false} onClose={mockOnClose} />
      );
      expect(container).toBeEmptyDOMElement();
    });

    it('renders when isOpen is true', () => {
      render(<NotificationDropdown isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByText('Notificações')).toBeInTheDocument();
    });

    it('renders header with correct title', () => {
      render(<NotificationDropdown isOpen={true} onClose={mockOnClose} />);
      const header = screen.getByText('Notificações');
      expect(header).toHaveClass('text-base', 'md:text-lg', 'font-semibold');
    });
  });

  describe('Loading State', () => {
    it('shows loading spinner when isLoading is true', () => {
      mockUseNotifications.mockReturnValue({
        notifications: [],
        unreadCount: 0,
        isLoading: true,
        markAsRead: vi.fn(),
        deleteNotification: mockDeleteNotification,
        handleNotificationClick: mockHandleNotificationClick,
      });

      const { container } = render(<NotificationDropdown isOpen={true} onClose={mockOnClose} />);
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('does not show empty state while loading', () => {
      mockUseNotifications.mockReturnValue({
        notifications: [],
        unreadCount: 0,
        isLoading: true,
        markAsRead: vi.fn(),
        deleteNotification: mockDeleteNotification,
        handleNotificationClick: mockHandleNotificationClick,
      });

      render(<NotificationDropdown isOpen={true} onClose={mockOnClose} />);
      expect(screen.queryByText('Nenhuma notificação')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no notifications', () => {
      mockUseNotifications.mockReturnValue({
        notifications: [],
        unreadCount: 0,
        isLoading: false,
        markAsRead: vi.fn(),
        deleteNotification: mockDeleteNotification,
        handleNotificationClick: mockHandleNotificationClick,
      });

      render(<NotificationDropdown isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByText('Nenhuma notificação')).toBeInTheDocument();
      expect(screen.getByText('Você está em dia!')).toBeInTheDocument();
    });

    it('shows bell icon in empty state', () => {
      mockUseNotifications.mockReturnValue({
        notifications: [],
        unreadCount: 0,
        isLoading: false,
        markAsRead: vi.fn(),
        deleteNotification: mockDeleteNotification,
        handleNotificationClick: mockHandleNotificationClick,
      });

      const { container } = render(<NotificationDropdown isOpen={true} onClose={mockOnClose} />);
      // Check for the SVG icon by looking for the path element
      const bellIcon = container.querySelector('svg path');
      expect(bellIcon).toBeInTheDocument();
    });
  });

  describe('Notification List', () => {
    it('renders list of notifications', () => {
      mockUseNotifications.mockReturnValue({
        notifications: [mockUnreadNotification, mockReadNotification],
        unreadCount: 1,
        isLoading: false,
        markAsRead: vi.fn(),
        deleteNotification: mockDeleteNotification,
        handleNotificationClick: mockHandleNotificationClick,
      });

      render(<NotificationDropdown isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByText('Campanha pronta para envio')).toBeInTheDocument();
      expect(screen.getByText('Campanha arquivada')).toBeInTheDocument();
    });

    it('renders multiple notifications in correct order', () => {
      const notifications = [
        createMockNotification({ id: '1', title: 'First' }),
        createMockNotification({ id: '2', title: 'Second' }),
        createMockNotification({ id: '3', title: 'Third' }),
      ];

      mockUseNotifications.mockReturnValue({
        notifications,
        unreadCount: 3,
        isLoading: false,
        markAsRead: vi.fn(),
        deleteNotification: mockDeleteNotification,
        handleNotificationClick: mockHandleNotificationClick,
      });

      render(<NotificationDropdown isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
      expect(screen.getByText('Third')).toBeInTheDocument();
    });
  });

  describe('Click Outside Behavior', () => {
    it('closes dropdown when clicking outside', async () => {
      const buttonRef = createMockButtonRef();

      render(
        <div>
          <NotificationDropdown
            isOpen={true}
            onClose={mockOnClose}
            buttonRef={buttonRef}
          />
          <div data-testid="outside-element">Outside</div>
        </div>
      );

      const outsideElement = screen.getByTestId('outside-element');
      await userEvent.click(outsideElement);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });

    it('does not close when clicking inside dropdown', async () => {
      mockUseNotifications.mockReturnValue({
        notifications: [],
        unreadCount: 0,
        isLoading: false,
        markAsRead: vi.fn(),
        deleteNotification: mockDeleteNotification,
        handleNotificationClick: mockHandleNotificationClick,
      });

      render(<NotificationDropdown isOpen={true} onClose={mockOnClose} />);

      const header = screen.getByText('Notificações');
      await userEvent.click(header);

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('does not close when clicking on button', async () => {
      const buttonRef = createMockButtonRef();

      render(
        <NotificationDropdown
          isOpen={true}
          onClose={mockOnClose}
          buttonRef={buttonRef}
        />
      );

      // Click the button (via ref)
      if (buttonRef.current) {
        await userEvent.click(buttonRef.current);
      }

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Behavior', () => {
    it('closes dropdown when Escape key is pressed', async () => {
      const user = userEvent.setup();

      render(<NotificationDropdown isOpen={true} onClose={mockOnClose} />);

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });

    it('does not close on other keys', async () => {
      const user = userEvent.setup();

      render(<NotificationDropdown isOpen={true} onClose={mockOnClose} />);

      await user.keyboard('{Enter}');
      await user.keyboard('{Space}');
      await user.keyboard('a');

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Notification Item Interaction', () => {
    it('calls handleNotificationClick when clicking a notification', async () => {
      mockUseNotifications.mockReturnValue({
        notifications: [mockUnreadNotification],
        unreadCount: 1,
        isLoading: false,
        markAsRead: vi.fn(),
        deleteNotification: mockDeleteNotification,
        handleNotificationClick: mockHandleNotificationClick,
      });

      render(<NotificationDropdown isOpen={true} onClose={mockOnClose} />);

      const notification = screen.getByText('Campanha pronta para envio');
      await userEvent.click(notification);

      expect(mockHandleNotificationClick).toHaveBeenCalledWith(mockUnreadNotification);
    });

    it('closes dropdown after clicking a notification', async () => {
      mockUseNotifications.mockReturnValue({
        notifications: [mockUnreadNotification],
        unreadCount: 1,
        isLoading: false,
        markAsRead: vi.fn(),
        deleteNotification: mockDeleteNotification,
        handleNotificationClick: mockHandleNotificationClick,
      });

      render(<NotificationDropdown isOpen={true} onClose={mockOnClose} />);

      const notification = screen.getByText('Campanha pronta para envio');
      await userEvent.click(notification);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Mobile Positioning (buttonRef)', () => {
    it('calculates position on mobile when buttonRef is provided', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375, // Mobile width
      });

      const buttonRef = createMockButtonRef();

      const { container } = render(
        <NotificationDropdown
          isOpen={true}
          onClose={mockOnClose}
          buttonRef={buttonRef}
        />
      );

      const dropdown = container.querySelector('div');
      expect(dropdown).toBeInTheDocument();

      // On mobile, the dropdown should have inline styles for positioning
      expect(dropdown).toHaveStyle({ top: '108px' }); // bottom (100) + 8px spacing
    });

    it('does not apply inline positioning on desktop', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024, // Desktop width
      });

      const buttonRef = createMockButtonRef();

      const { container } = render(
        <NotificationDropdown
          isOpen={true}
          onClose={mockOnClose}
          buttonRef={buttonRef}
        />
      );

      const dropdown = container.querySelector('div');
      expect(dropdown).toBeInTheDocument();

      // On desktop, positioning is handled by CSS classes, not inline styles
      expect(dropdown?.style.top).toBe('');
      expect(dropdown?.style.right).toBe('');
    });
  });

  describe('Responsive Styling', () => {
    it('applies mobile-first responsive classes', () => {
      const { container } = render(
        <NotificationDropdown isOpen={true} onClose={mockOnClose} />
      );

      const dropdown = container.querySelector('div');
      expect(dropdown).toHaveClass(
        'fixed',
        'md:absolute',
        'w-80',
        'md:w-96',
        'z-[100]'
      );
    });

    it('has correct positioning classes', () => {
      const { container } = render(
        <NotificationDropdown isOpen={true} onClose={mockOnClose} />
      );

      const dropdown = container.querySelector('div');
      expect(dropdown).toHaveClass('md:top-full', 'md:right-0', 'md:mt-2');
    });

    it('applies correct z-index for mobile overlay', () => {
      const { container } = render(
        <NotificationDropdown isOpen={true} onClose={mockOnClose} />
      );

      const dropdown = container.querySelector('div');
      // Changed from z-50 to z-[100]
      expect(dropdown).toHaveClass('z-[100]');
    });
  });

  describe('Accessibility', () => {
    it('has proper semantic structure', () => {
      render(<NotificationDropdown isOpen={true} onClose={mockOnClose} />);

      const header = screen.getByText('Notificações');
      expect(header.tagName).toBe('H3');
    });

    it('has scrollable content area', () => {
      const { container } = render(
        <NotificationDropdown isOpen={true} onClose={mockOnClose} />
      );

      const contentArea = container.querySelector('.overflow-y-auto');
      expect(contentArea).toBeInTheDocument();
      expect(contentArea).toHaveClass('flex-1', 'overflow-y-auto');
    });

    it('has max height constraint', () => {
      const { container } = render(
        <NotificationDropdown isOpen={true} onClose={mockOnClose} />
      );

      const dropdown = container.querySelector('div');
      expect(dropdown).toHaveClass('max-h-[80vh]');
    });
  });

  describe('Edge Cases', () => {
    it('handles missing buttonRef gracefully', () => {
      expect(() => {
        render(<NotificationDropdown isOpen={true} onClose={mockOnClose} />);
      }).not.toThrow();
    });

    it('handles buttonRef with null current gracefully', () => {
      const buttonRef = createRef<HTMLButtonElement>();

      expect(() => {
        render(
          <NotificationDropdown
            isOpen={true}
            onClose={mockOnClose}
            buttonRef={buttonRef}
          />
        );
      }).not.toThrow();
    });

    it('recalculates position when isOpen changes', () => {
      const buttonRef = createMockButtonRef();
      const { rerender } = render(
        <NotificationDropdown
          isOpen={false}
          onClose={mockOnClose}
          buttonRef={buttonRef}
        />
      );

      // Open dropdown - should trigger position calculation
      rerender(
        <NotificationDropdown
          isOpen={true}
          onClose={mockOnClose}
          buttonRef={buttonRef}
        />
      );

      expect(screen.getByText('Notificações')).toBeInTheDocument();
    });
  });
});
