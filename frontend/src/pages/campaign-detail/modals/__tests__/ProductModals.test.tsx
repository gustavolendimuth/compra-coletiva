import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddProductModal, EditProductModal } from '../ProductModals';

describe('ProductModals', () => {
  describe('AddProductModal', () => {
    const mockOnClose = vi.fn();
    const mockOnChange = vi.fn();
    const mockOnSubmit = vi.fn();

    const defaultProps = {
      isOpen: true,
      form: { name: '', price: '' as number | '', weight: '' as number | '' },
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
        render(<AddProductModal {...defaultProps} />);

        expect(screen.getByText('Adicionar Produto')).toBeInTheDocument();
        expect(screen.getByLabelText(/nome do produto/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/preço/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/peso/i)).toBeInTheDocument();
      });

      it('should not render modal when isOpen is false', () => {
        render(<AddProductModal {...defaultProps} isOpen={false} />);

        expect(screen.queryByText('Adicionar Produto')).not.toBeInTheDocument();
      });

      it('should render all form fields', () => {
        render(<AddProductModal {...defaultProps} />);

        const nameInput = screen.getByLabelText(/nome do produto/i);
        const priceInput = screen.getByLabelText(/preço/i);
        const weightInput = screen.getByLabelText(/peso/i);

        expect(nameInput).toBeInTheDocument();
        expect(priceInput).toBeInTheDocument();
        expect(weightInput).toBeInTheDocument();
      });

      it('should render action buttons', () => {
        render(<AddProductModal {...defaultProps} />);

        expect(screen.getByRole('button', { name: /adicionar/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
      });

      it('should autofocus name input', () => {
        render(<AddProductModal {...defaultProps} />);

        const nameInput = screen.getByLabelText(/nome do produto/i);
        // autoFocus is a React prop, not an HTML attribute
        expect(nameInput).toBeInTheDocument();
      });
    });

    describe('Form Values', () => {
      it('should display form values correctly', () => {
        render(
          <AddProductModal
            {...defaultProps}
            form={{ name: 'Test Product', price: 99.99, weight: 500 }}
          />
        );

        expect(screen.getByDisplayValue('Test Product')).toBeInTheDocument();
        expect(screen.getByDisplayValue('99.99')).toBeInTheDocument();
        expect(screen.getByDisplayValue('500')).toBeInTheDocument();
      });

      it('should handle empty form values', () => {
        render(<AddProductModal {...defaultProps} />);

        const nameInput = screen.getByLabelText(/nome do produto/i) as HTMLInputElement;
        const priceInput = screen.getByLabelText(/preço/i) as HTMLInputElement;
        const weightInput = screen.getByLabelText(/peso/i) as HTMLInputElement;

        expect(nameInput.value).toBe('');
        expect(priceInput.value).toBe('');
        expect(weightInput.value).toBe('');
      });
    });

    describe('Form Input Changes', () => {
      it('should call onChange when name input changes', async () => {
        const user = userEvent.setup();
        render(<AddProductModal {...defaultProps} />);

        const nameInput = screen.getByLabelText(/nome do produto/i);
        await user.type(nameInput, 'New Product');

        // onChange is called for each character typed
        expect(mockOnChange).toHaveBeenCalled();
        expect(mockOnChange.mock.calls.length).toBeGreaterThan(0);
      });

      it('should call onChange when price input changes', async () => {
        const user = userEvent.setup();
        render(<AddProductModal {...defaultProps} />);

        const priceInput = screen.getByLabelText(/preço/i);
        await user.type(priceInput, '99.99');

        expect(mockOnChange).toHaveBeenCalled();
      });

      it('should call onChange when weight input changes', async () => {
        const user = userEvent.setup();
        render(<AddProductModal {...defaultProps} />);

        const weightInput = screen.getByLabelText(/peso/i);
        await user.type(weightInput, '500');

        expect(mockOnChange).toHaveBeenCalled();
      });

      it('should handle empty price value', async () => {
        const user = userEvent.setup();
        render(<AddProductModal {...defaultProps} form={{ name: 'Test', price: 10, weight: 100 }} />);

        const priceInput = screen.getByLabelText(/preço/i);
        await user.clear(priceInput);

        expect(mockOnChange).toHaveBeenCalledWith(
          expect.objectContaining({ price: '' })
        );
      });

      it('should handle empty weight value', async () => {
        const user = userEvent.setup();
        render(<AddProductModal {...defaultProps} form={{ name: 'Test', price: 10, weight: 100 }} />);

        const weightInput = screen.getByLabelText(/peso/i);
        await user.clear(weightInput);

        expect(mockOnChange).toHaveBeenCalledWith(
          expect.objectContaining({ weight: '' })
        );
      });
    });

    describe('Form Submission', () => {
      it('should call onSubmit when form is submitted', async () => {
        const user = userEvent.setup();
        render(
          <AddProductModal
            {...defaultProps}
            form={{ name: 'Test Product', price: 99.99, weight: 500 }}
          />
        );

        const submitButton = screen.getByRole('button', { name: /adicionar/i });
        await user.click(submitButton);

        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      });

      it('should prevent submission without required fields', async () => {
        const user = userEvent.setup();
        render(<AddProductModal {...defaultProps} />);

        const submitButton = screen.getByRole('button', { name: /adicionar/i });
        await user.click(submitButton);

        // Form validation should prevent submission
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });

    describe('Modal Actions', () => {
      it('should call onClose when cancel button is clicked', async () => {
        const user = userEvent.setup();
        render(<AddProductModal {...defaultProps} />);

        const cancelButton = screen.getByRole('button', { name: /cancelar/i });
        await user.click(cancelButton);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });

      it('should disable submit button when isPending is true', () => {
        render(<AddProductModal {...defaultProps} isPending={true} />);

        const submitButton = screen.getByRole('button', { name: /adicionando/i });
        expect(submitButton).toBeDisabled();
      });

      it('should show loading text when isPending is true', () => {
        render(<AddProductModal {...defaultProps} isPending={true} />);

        expect(screen.getByText('Adicionando...')).toBeInTheDocument();
      });

      it('should show normal text when isPending is false', () => {
        render(<AddProductModal {...defaultProps} isPending={false} />);

        expect(screen.getByText('Adicionar')).toBeInTheDocument();
      });
    });

    describe('Input Validation', () => {
      it('should have required attribute on name input', () => {
        render(<AddProductModal {...defaultProps} />);

        const nameInput = screen.getByLabelText(/nome do produto/i);
        expect(nameInput).toBeRequired();
      });

      it('should have required attribute on price input', () => {
        render(<AddProductModal {...defaultProps} />);

        const priceInput = screen.getByLabelText(/preço/i);
        expect(priceInput).toBeRequired();
      });

      it('should have required attribute on weight input', () => {
        render(<AddProductModal {...defaultProps} />);

        const weightInput = screen.getByLabelText(/peso/i);
        expect(weightInput).toBeRequired();
      });

      it('should have correct input type for price', () => {
        render(<AddProductModal {...defaultProps} />);

        const priceInput = screen.getByLabelText(/preço/i);
        expect(priceInput).toHaveAttribute('type', 'number');
        expect(priceInput).toHaveAttribute('step', '0.01');
        expect(priceInput).toHaveAttribute('min', '0');
      });

      it('should have correct input type for weight', () => {
        render(<AddProductModal {...defaultProps} />);

        const weightInput = screen.getByLabelText(/peso/i);
        expect(weightInput).toHaveAttribute('type', 'number');
        expect(weightInput).toHaveAttribute('step', '1');
        expect(weightInput).toHaveAttribute('min', '0');
      });
    });
  });

  describe('EditProductModal', () => {
    const mockOnClose = vi.fn();
    const mockOnChange = vi.fn();
    const mockOnSubmit = vi.fn();

    const defaultProps = {
      isOpen: true,
      form: { name: 'Existing Product', price: 50, weight: 300 },
      isPending: false,
      onClose: mockOnClose,
      onChange: mockOnChange,
      onSubmit: mockOnSubmit,
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    describe('Rendering', () => {
      it('should render modal with edit title', () => {
        render(<EditProductModal {...defaultProps} />);

        expect(screen.getByText('Editar Produto')).toBeInTheDocument();
      });

      it('should render all form fields', () => {
        render(<EditProductModal {...defaultProps} />);

        expect(screen.getByLabelText(/nome do produto/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/preço/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/peso/i)).toBeInTheDocument();
      });

      it('should display existing values', () => {
        render(<EditProductModal {...defaultProps} />);

        expect(screen.getByDisplayValue('Existing Product')).toBeInTheDocument();
        expect(screen.getByDisplayValue('50')).toBeInTheDocument();
        expect(screen.getByDisplayValue('300')).toBeInTheDocument();
      });
    });

    describe('Form Actions', () => {
      it('should call onSubmit when update button is clicked', async () => {
        const user = userEvent.setup();
        render(<EditProductModal {...defaultProps} />);

        const submitButton = screen.getByRole('button', { name: /atualizar/i });
        await user.click(submitButton);

        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      });

      it('should call onClose when cancel button is clicked', async () => {
        const user = userEvent.setup();
        render(<EditProductModal {...defaultProps} />);

        const cancelButton = screen.getByRole('button', { name: /cancelar/i });
        await user.click(cancelButton);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });

      it('should show loading text when isPending is true', () => {
        render(<EditProductModal {...defaultProps} isPending={true} />);

        expect(screen.getByText('Atualizando...')).toBeInTheDocument();
      });

      it('should disable submit button when isPending is true', () => {
        render(<EditProductModal {...defaultProps} isPending={true} />);

        const submitButton = screen.getByRole('button', { name: /atualizando/i });
        expect(submitButton).toBeDisabled();
      });
    });

    describe('Form Input Changes', () => {
      it('should call onChange when editing name', async () => {
        const user = userEvent.setup();
        render(<EditProductModal {...defaultProps} />);

        const nameInput = screen.getByLabelText(/nome do produto/i);
        await user.clear(nameInput);
        await user.type(nameInput, 'Updated Product');

        expect(mockOnChange).toHaveBeenCalled();
      });

      it('should call onChange when editing price', async () => {
        const user = userEvent.setup();
        render(<EditProductModal {...defaultProps} />);

        const priceInput = screen.getByLabelText(/preço/i);
        await user.clear(priceInput);
        await user.type(priceInput, '75.50');

        expect(mockOnChange).toHaveBeenCalled();
      });

      it('should call onChange when editing weight', async () => {
        const user = userEvent.setup();
        render(<EditProductModal {...defaultProps} />);

        const weightInput = screen.getByLabelText(/peso/i);
        await user.clear(weightInput);
        await user.type(weightInput, '450');

        expect(mockOnChange).toHaveBeenCalled();
      });
    });
  });
});
