import { Modal, Button, Input } from "@/components/ui";

interface ProductForm {
  name: string;
  price: number | "";
  weight: number | "";
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

        <Input
          id="add-product-price"
          type="number"
          step="0.01"
          min="0"
          required
          value={form.price}
          onChange={(e) =>
            onChange({
              ...form,
              price: e.target.value === "" ? "" : parseFloat(e.target.value),
            })
          }
          label="Preço (R$) *"
        />

        <Input
          id="add-product-weight"
          type="number"
          step="1"
          min="0"
          required
          value={form.weight}
          onChange={(e) =>
            onChange({
              ...form,
              weight: e.target.value === "" ? "" : parseFloat(e.target.value),
            })
          }
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

        <Input
          id="edit-product-price"
          type="number"
          step="0.01"
          min="0"
          required
          value={form.price}
          onChange={(e) =>
            onChange({
              ...form,
              price: e.target.value === "" ? "" : parseFloat(e.target.value),
            })
          }
          label="Preço (R$) *"
        />

        <Input
          id="edit-product-weight"
          type="number"
          step="1"
          min="0"
          required
          value={form.weight}
          onChange={(e) =>
            onChange({
              ...form,
              weight: e.target.value === "" ? "" : parseFloat(e.target.value),
            })
          }
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
