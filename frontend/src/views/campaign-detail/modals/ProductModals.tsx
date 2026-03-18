import { Modal, Button, Input, CurrencyInput, ImageUpload } from "@/components/ui";
import { getImageUrlOrUndefined } from "@/lib/imageUrl";

interface ProductForm {
  name: string;
  price: string;
  weight: string;
  imageUrl?: string;
}

interface AddProductModalProps {
  isOpen: boolean;
  form: ProductForm;
  isPending: boolean;
  onClose: () => void;
  onChange: (form: ProductForm) => void;
  onSubmit: (e: React.FormEvent) => void;
  onImageSelect?: (file: File) => void;
  onImageRemove?: () => void;
}

export function AddProductModal({
  isOpen,
  form,
  isPending,
  onClose,
  onChange,
  onSubmit,
  onImageSelect,
  onImageRemove,
}: AddProductModalProps) {
  const handleImageSelect = (file: File) => {
    onImageSelect?.(file);
  };

  const handleImageRemove = () => {
    onImageRemove?.();
  };

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

        <div className="space-y-2">
          <p className="text-sm font-medium text-sky-900">Imagem do Produto</p>
          <ImageUpload
            onImageSelect={handleImageSelect}
            onImageRemove={handleImageRemove}
            disabled={isPending}
            className="max-w-md"
          />
          <p className="text-xs text-sky-600">
            Opcional. Se não enviar, o produto aparece com ícone padrão.
          </p>
        </div>

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
  currentImageUrl?: string;
  shouldHideCurrentImage?: boolean;
  onImageSelect?: (file: File) => void;
  onImageRemove?: () => void;
}

export function EditProductModal({
  isOpen,
  form,
  isPending,
  onClose,
  onChange,
  onSubmit,
  currentImageUrl,
  shouldHideCurrentImage = false,
  onImageSelect,
  onImageRemove,
}: EditProductModalProps) {
  const currentImage = shouldHideCurrentImage
    ? undefined
    : getImageUrlOrUndefined(currentImageUrl);

  const handleImageSelect = (file: File) => {
    onImageSelect?.(file);
  };

  const handleImageRemove = () => {
    onImageRemove?.();
  };

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

        <div className="space-y-2">
          <p className="text-sm font-medium text-sky-900">Imagem do Produto</p>
          <ImageUpload
            currentImageUrl={currentImage}
            onImageSelect={handleImageSelect}
            onImageRemove={handleImageRemove}
            disabled={isPending}
            className="max-w-md"
          />
          <p className="text-xs text-sky-600">
            Envie uma nova imagem para substituir ou remova para voltar ao ícone padrão.
          </p>
        </div>

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
