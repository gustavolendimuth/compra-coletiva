import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ShippingModal,
  DeadlineModal,
  CloseConfirmDialog,
  ReopenConfirmDialog,
  SentConfirmDialog,
} from '../CampaignModals';
import { createMockCampaign } from '@/__tests__/mock-data';

// Mock DateTimeInput component
vi.mock('@/components/DateTimeInput', () => ({
  default: ({ value, onChange, className, autoFocus }: any) => (
    <input
      data-testid="datetime-input"
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
      autoFocus={autoFocus}
    />
  ),
}));

// Mock ConfirmDialog component
vi.mock('@/components/ConfirmDialog', () => ({
  default: ({ isOpen, onClose, onConfirm, title, message, confirmText, cancelText }: any) =>
    isOpen ? (
      <div data-testid="confirm-dialog">
        <h2>{title}</h2>
        <p>{message}</p>
        <button onClick={onConfirm}>{confirmText}</button>
        <button onClick={onClose}>{cancelText}</button>
      </div>
    ) : null,
}));

describe('CampaignModals', () => {
  describe('ShippingModal', () => {
    const mockOnClose = vi.fn();
    const mockOnChange = vi.fn();
    const mockOnSubmit = vi.fn();

    const defaultProps = {
      isOpen: true,
      shippingCost: '' as number | '',
      isPending: false,
      onClose: mockOnClose,
      onChange: mockOnChange,
      onSubmit: mockOnSubmit,
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    describe('Rendering', () => {
      it('should render modal when isOpen is true', () => {
        render(<ShippingModal {...defaultProps} />);

        expect(screen.getByText('Editar Frete Total')).toBeInTheDocument();
      });

      it('should not render modal when isOpen is false', () => {
        render(<ShippingModal {...defaultProps} isOpen={false} />);

        expect(screen.queryByText('Editar Frete Total')).not.toBeInTheDocument();
      });

      it('should render shipping cost input', () => {
        render(<ShippingModal {...defaultProps} />);

        expect(screen.getByLabelText(/valor do frete total/i)).toBeInTheDocument();
      });

      it('should render help text', () => {
        render(<ShippingModal {...defaultProps} />);

        expect(
          screen.getByText(/o frete será distribuído proporcionalmente ao peso de cada pedido/i)
        ).toBeInTheDocument();
      });

      it('should render action buttons', () => {
        render(<ShippingModal {...defaultProps} />);

        expect(screen.getByRole('button', { name: /atualizar frete/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
      });
    });

    describe('Form Values', () => {
      it('should display shipping cost value', () => {
        render(<ShippingModal {...defaultProps} shippingCost={50.0} />);

        const input = screen.getByLabelText(/valor do frete total/i) as HTMLInputElement;
        expect(input.value).toBe('50');
      });

      it('should handle empty shipping cost', () => {
        render(<ShippingModal {...defaultProps} shippingCost="" />);

        const input = screen.getByLabelText(/valor do frete total/i) as HTMLInputElement;
        expect(input.value).toBe('');
      });
    });

    describe('Form Input Changes', () => {
      it('should call onChange when input changes', async () => {
        const user = userEvent.setup();
        render(<ShippingModal {...defaultProps} />);

        const input = screen.getByLabelText(/valor do frete total/i);
        await user.type(input, '75.50');

        expect(mockOnChange).toHaveBeenCalled();
      });

      it('should handle empty value correctly', async () => {
        const user = userEvent.setup();
        render(<ShippingModal {...defaultProps} shippingCost={50} />);

        const input = screen.getByLabelText(/valor do frete total/i);
        await user.clear(input);

        expect(mockOnChange).toHaveBeenCalledWith('');
      });
    });

    describe('Form Submission', () => {
      it('should call onSubmit when form is submitted', async () => {
        const user = userEvent.setup();
        render(<ShippingModal {...defaultProps} shippingCost={50} />);

        const submitButton = screen.getByRole('button', { name: /atualizar frete/i });
        await user.click(submitButton);

        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      });
    });

    describe('Modal Actions', () => {
      it('should call onClose when cancel button is clicked', async () => {
        const user = userEvent.setup();
        render(<ShippingModal {...defaultProps} />);

        const cancelButton = screen.getByRole('button', { name: /cancelar/i });
        await user.click(cancelButton);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });

      it('should disable submit button when isPending is true', () => {
        render(<ShippingModal {...defaultProps} isPending={true} />);

        const submitButton = screen.getByRole('button', { name: /atualizando/i });
        expect(submitButton).toBeDisabled();
      });

      it('should show loading text when isPending is true', () => {
        render(<ShippingModal {...defaultProps} isPending={true} />);

        expect(screen.getByText('Atualizando...')).toBeInTheDocument();
      });
    });

    describe('Input Validation', () => {
      it('should have correct input type', () => {
        render(<ShippingModal {...defaultProps} />);

        const input = screen.getByLabelText(/valor do frete total/i);
        expect(input).toHaveAttribute('type', 'number');
        expect(input).toHaveAttribute('step', '0.01');
        expect(input).toHaveAttribute('min', '0');
      });

      it('should autofocus input', () => {
        render(<ShippingModal {...defaultProps} />);

        const input = screen.getByLabelText(/valor do frete total/i);
        expect(input).toHaveAttribute('autoFocus');
      });
    });
  });

  describe('DeadlineModal', () => {
    const mockCampaign = createMockCampaign({
      deadline: '2024-12-31T23:59:59.000Z',
    });

    const mockOnClose = vi.fn();
    const mockOnChange = vi.fn();
    const mockOnSubmit = vi.fn();
    const mockOnRemove = vi.fn();

    const defaultProps = {
      isOpen: true,
      campaign: mockCampaign,
      deadlineForm: '2024-12-31T23:59:59',
      isPending: false,
      onClose: mockOnClose,
      onChange: mockOnChange,
      onSubmit: mockOnSubmit,
      onRemove: mockOnRemove,
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    describe('Rendering', () => {
      it('should render modal when isOpen is true', () => {
        render(<DeadlineModal {...defaultProps} />);

        expect(screen.getByText('Configurar Data Limite')).toBeInTheDocument();
      });

      it('should not render modal when isOpen is false', () => {
        render(<DeadlineModal {...defaultProps} isOpen={false} />);

        expect(screen.queryByText('Configurar Data Limite')).not.toBeInTheDocument();
      });

      it('should render DateTimeInput component', () => {
        render(<DeadlineModal {...defaultProps} />);

        expect(screen.getByTestId('datetime-input')).toBeInTheDocument();
      });

      it('should render help text', () => {
        render(<DeadlineModal {...defaultProps} />);

        expect(
          screen.getByText(/a campanha será fechada automaticamente quando atingir esta data/i)
        ).toBeInTheDocument();
      });

      it('should render action buttons', () => {
        render(<DeadlineModal {...defaultProps} />);

        expect(screen.getByRole('button', { name: /salvar/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
      });

      it('should render remove button when campaign has deadline', () => {
        render(<DeadlineModal {...defaultProps} />);

        expect(screen.getByRole('button', { name: /remover/i })).toBeInTheDocument();
      });

      it('should not render remove button when campaign has no deadline', () => {
        render(
          <DeadlineModal
            {...defaultProps}
            campaign={{ ...mockCampaign, deadline: undefined }}
          />
        );

        expect(screen.queryByRole('button', { name: /remover/i })).not.toBeInTheDocument();
      });
    });

    describe('Form Values', () => {
      it('should display deadline value', () => {
        render(<DeadlineModal {...defaultProps} />);

        const input = screen.getByTestId('datetime-input') as HTMLInputElement;
        expect(input.value).toBe('2024-12-31T23:59:59');
      });
    });

    describe('Form Input Changes', () => {
      it('should call onChange when input changes', async () => {
        const user = userEvent.setup();
        render(<DeadlineModal {...defaultProps} />);

        const input = screen.getByTestId('datetime-input');
        await user.clear(input);
        await user.type(input, '2025-01-15T12:00:00');

        expect(mockOnChange).toHaveBeenCalled();
      });
    });

    describe('Form Submission', () => {
      it('should call onSubmit when form is submitted', async () => {
        const user = userEvent.setup();
        render(<DeadlineModal {...defaultProps} />);

        const submitButton = screen.getByRole('button', { name: /salvar/i });
        await user.click(submitButton);

        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      });
    });

    describe('Modal Actions', () => {
      it('should call onClose when cancel button is clicked', async () => {
        const user = userEvent.setup();
        render(<DeadlineModal {...defaultProps} />);

        const cancelButton = screen.getByRole('button', { name: /cancelar/i });
        await user.click(cancelButton);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });

      it('should call onRemove when remove button is clicked', async () => {
        const user = userEvent.setup();
        render(<DeadlineModal {...defaultProps} />);

        const removeButton = screen.getByRole('button', { name: /remover/i });
        await user.click(removeButton);

        expect(mockOnRemove).toHaveBeenCalledTimes(1);
      });

      it('should disable buttons when isPending is true', () => {
        render(<DeadlineModal {...defaultProps} isPending={true} />);

        const submitButton = screen.getByRole('button', { name: /salvando/i });
        const removeButton = screen.getByRole('button', { name: /remover/i });

        expect(submitButton).toBeDisabled();
        expect(removeButton).toBeDisabled();
      });

      it('should show loading text when isPending is true', () => {
        render(<DeadlineModal {...defaultProps} isPending={true} />);

        expect(screen.getByText('Salvando...')).toBeInTheDocument();
      });
    });
  });

  describe('CloseConfirmDialog', () => {
    const mockOnClose = vi.fn();
    const mockOnConfirm = vi.fn();

    const defaultProps = {
      isOpen: true,
      onClose: mockOnClose,
      onConfirm: mockOnConfirm,
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    describe('Rendering', () => {
      it('should render dialog when isOpen is true', () => {
        render(<CloseConfirmDialog {...defaultProps} />);

        expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
      });

      it('should not render dialog when isOpen is false', () => {
        render(<CloseConfirmDialog {...defaultProps} isOpen={false} />);

        expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument();
      });

      it('should display correct title', () => {
        render(<CloseConfirmDialog {...defaultProps} />);

        expect(screen.getByText('Fechar Campanha')).toBeInTheDocument();
      });

      it('should display warning message', () => {
        render(<CloseConfirmDialog {...defaultProps} />);

        expect(
          screen.getByText(/tem certeza que deseja fechar esta campanha/i)
        ).toBeInTheDocument();
      });

      it('should render action buttons', () => {
        render(<CloseConfirmDialog {...defaultProps} />);

        expect(screen.getByRole('button', { name: /fechar campanha/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
      });
    });

    describe('Dialog Actions', () => {
      it('should call onConfirm when confirm button is clicked', async () => {
        const user = userEvent.setup();
        render(<CloseConfirmDialog {...defaultProps} />);

        const confirmButton = screen.getByRole('button', { name: /fechar campanha/i });
        await user.click(confirmButton);

        expect(mockOnConfirm).toHaveBeenCalledTimes(1);
      });

      it('should call onClose when cancel button is clicked', async () => {
        const user = userEvent.setup();
        render(<CloseConfirmDialog {...defaultProps} />);

        const cancelButton = screen.getByRole('button', { name: /cancelar/i });
        await user.click(cancelButton);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('ReopenConfirmDialog', () => {
    const mockOnClose = vi.fn();
    const mockOnConfirm = vi.fn();

    const defaultProps = {
      isOpen: true,
      onClose: mockOnClose,
      onConfirm: mockOnConfirm,
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    describe('Rendering', () => {
      it('should render dialog when isOpen is true', () => {
        render(<ReopenConfirmDialog {...defaultProps} />);

        expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
      });

      it('should display correct title', () => {
        render(<ReopenConfirmDialog {...defaultProps} />);

        expect(screen.getByText('Reabrir Campanha')).toBeInTheDocument();
      });

      it('should display reopen message', () => {
        render(<ReopenConfirmDialog {...defaultProps} />);

        expect(screen.getByText(/deseja reabrir esta campanha/i)).toBeInTheDocument();
      });

      it('should render action buttons', () => {
        render(<ReopenConfirmDialog {...defaultProps} />);

        expect(screen.getByRole('button', { name: /reabrir/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
      });
    });

    describe('Dialog Actions', () => {
      it('should call onConfirm when confirm button is clicked', async () => {
        const user = userEvent.setup();
        render(<ReopenConfirmDialog {...defaultProps} />);

        const confirmButton = screen.getByRole('button', { name: /reabrir/i });
        await user.click(confirmButton);

        expect(mockOnConfirm).toHaveBeenCalledTimes(1);
      });

      it('should call onClose when cancel button is clicked', async () => {
        const user = userEvent.setup();
        render(<ReopenConfirmDialog {...defaultProps} />);

        const cancelButton = screen.getByRole('button', { name: /cancelar/i });
        await user.click(cancelButton);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('SentConfirmDialog', () => {
    const mockOnClose = vi.fn();
    const mockOnConfirm = vi.fn();

    const defaultProps = {
      isOpen: true,
      onClose: mockOnClose,
      onConfirm: mockOnConfirm,
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    describe('Rendering', () => {
      it('should render dialog when isOpen is true', () => {
        render(<SentConfirmDialog {...defaultProps} />);

        expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
      });

      it('should display correct title', () => {
        render(<SentConfirmDialog {...defaultProps} />);

        expect(screen.getByText('Marcar como Enviado')).toBeInTheDocument();
      });

      it('should display sent message', () => {
        render(<SentConfirmDialog {...defaultProps} />);

        expect(
          screen.getByText(/deseja marcar esta campanha como enviada/i)
        ).toBeInTheDocument();
      });

      it('should render action buttons', () => {
        render(<SentConfirmDialog {...defaultProps} />);

        expect(screen.getByRole('button', { name: /marcar como enviado/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
      });
    });

    describe('Dialog Actions', () => {
      it('should call onConfirm when confirm button is clicked', async () => {
        const user = userEvent.setup();
        render(<SentConfirmDialog {...defaultProps} />);

        const confirmButton = screen.getByRole('button', { name: /marcar como enviado/i });
        await user.click(confirmButton);

        expect(mockOnConfirm).toHaveBeenCalledTimes(1);
      });

      it('should call onClose when cancel button is clicked', async () => {
        const user = userEvent.setup();
        render(<SentConfirmDialog {...defaultProps} />);

        const cancelButton = screen.getByRole('button', { name: /cancelar/i });
        await user.click(cancelButton);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });
  });
});
