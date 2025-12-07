import { Modal, Button, Input, CurrencyInput } from "@/components/ui";

interface ProductForm {
  name: string;
  price: string;
  weight: string;
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
        <Input
          id="add-product-name"
          type="text"
          required
          autoFocus
          value={form.name}
          onChange={(e) => onChange({ ...form, name: e.target.value })}
          label="Nome do Produto *"
        />

        <CurrencyInput
          id="add-product-price"
          required
          value={form.price}
          onChange={(value) => onChange({ ...form, price: value })}
          label="Preço *"
        />

        <Input
          id="add-product-weight"
          type="number"
          step="1"
          min="0"
          required
          value={form.weight}
          onChange={(e) => onChange({ ...form, weight: e.target.value })}
          label="Peso (gramas) *"
        />

        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={isPending}
            className="flex-1 whitespace-nowrap"
          >
            {isPending ? "Adicionando..." : "Adicionar"}
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
        <Input
          id="edit-product-name"
          type="text"
          required
          autoFocus
          value={form.name}
          onChange={(e) => onChange({ ...form, name: e.target.value })}
          label="Nome do Produto *"
        />

        <CurrencyInput
          id="edit-product-price"
          required
          value={form.price}
          onChange={(value) => onChange({ ...form, price: value })}
          label="Preço *"
        />

        <Input
          id="edit-product-weight"
          type="number"
          step="1"
          min="0"
          required
          value={form.weight}
          onChange={(e) => onChange({ ...form, weight: e.target.value })}
          label="Peso (gramas) *"
        />

        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={isPending}
            className="flex-1 whitespace-nowrap"
          >
            {isPending ? "Atualizando..." : "Atualizar"}
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
