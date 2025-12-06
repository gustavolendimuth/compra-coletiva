import { Modal, Button } from '@/components/ui';

interface ProductForm {
  name: string;
  price: number | '';
  weight: number | '';
}

interface AddProductModalProps {
  isOpen: boolean;
  form: ProductForm;
  isPending: boolean;
  onClose: () => void;
  onChange: (form: ProductForm) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function AddProductModal({
  isOpen,
  form,
  isPending,
  onClose,
  onChange,
  onSubmit,
}: AddProductModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Adicionar Produto">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="add-product-name" className="block text-sm font-medium text-gray-700 mb-1">
            Nome do Produto *
          </label>
          <input
            id="add-product-name"
            type="text"
            required
            autoFocus
            value={form.name}
            onChange={(e) => onChange({ ...form, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="add-product-price" className="block text-sm font-medium text-gray-700 mb-1">
            Preço (R$) *
          </label>
          <input
            id="add-product-price"
            type="number"
            step="0.01"
            min="0"
            required
            value={form.price}
            onChange={(e) =>
              onChange({
                ...form,
                price: e.target.value === '' ? '' : parseFloat(e.target.value),
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="add-product-weight" className="block text-sm font-medium text-gray-700 mb-1">
            Peso (gramas) *
          </label>
          <input
            id="add-product-weight"
            type="number"
            step="1"
            min="0"
            required
            value={form.weight}
            onChange={(e) =>
              onChange({
                ...form,
                weight: e.target.value === '' ? '' : parseFloat(e.target.value),
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={isPending} className="flex-1 whitespace-nowrap">
            {isPending ? 'Adicionando...' : 'Adicionar'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="whitespace-nowrap"
          >
            Cancelar
          </Button>
        </div>
      </form>
    </Modal>
  );
}

interface EditProductModalProps {
  isOpen: boolean;
  form: ProductForm;
  isPending: boolean;
  onClose: () => void;
  onChange: (form: ProductForm) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function EditProductModal({
  isOpen,
  form,
  isPending,
  onClose,
  onChange,
  onSubmit,
}: EditProductModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Produto">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="edit-product-name" className="block text-sm font-medium text-gray-700 mb-1">
            Nome do Produto *
          </label>
          <input
            id="edit-product-name"
            type="text"
            required
            autoFocus
            value={form.name}
            onChange={(e) => onChange({ ...form, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="edit-product-price" className="block text-sm font-medium text-gray-700 mb-1">
            Preço (R$) *
          </label>
          <input
            id="edit-product-price"
            type="number"
            step="0.01"
            min="0"
            required
            value={form.price}
            onChange={(e) =>
              onChange({
                ...form,
                price: e.target.value === '' ? '' : parseFloat(e.target.value),
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="edit-product-weight" className="block text-sm font-medium text-gray-700 mb-1">
            Peso (gramas) *
          </label>
          <input
            id="edit-product-weight"
            type="number"
            step="1"
            min="0"
            required
            value={form.weight}
            onChange={(e) =>
              onChange({
                ...form,
                weight: e.target.value === '' ? '' : parseFloat(e.target.value),
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={isPending} className="flex-1 whitespace-nowrap">
            {isPending ? 'Atualizando...' : 'Atualizar'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="whitespace-nowrap"
          >
            Cancelar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
