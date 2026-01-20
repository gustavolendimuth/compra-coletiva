import { Plus, Trash2, Edit } from "lucide-react";
import { Modal, Button, Input, Select } from "@/components/ui";
import IconButton from "@/components/IconButton";
import { OrderChat } from "@/components/campaign";
import { formatCurrency } from "@/lib/utils";
import { getImageUrl } from "@/lib/imageUrl";
import { Order, Product } from "@/api";

interface OrderForm {
  items: Array<{ productId: string; quantity: number | "" }>;
}

interface OrderModalBaseProps {
  isOpen: boolean;
  form: OrderForm;
  products: Product[];
  isPending: boolean;
  onClose: () => void;
  onChange: (form: OrderForm) => void;
}

interface AddOrderModalProps extends OrderModalBaseProps {
  title?: string;
}

export function AddOrderModal({
  isOpen,
  form,
  products,
  isPending,
  onClose,
  onChange,
  title = "Novo Pedido",
}: AddOrderModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Atalho:</strong> Alt+P para adicionar produto
          </p>
          {isPending && (
            <p className="text-sm text-blue-600 mt-2 flex items-center gap-2">
              <span className="animate-spin">⏳</span> Salvando
              automaticamente...
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Produtos *
          </label>
          {form.items.map((item, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <Select
                required
                value={item.productId}
                onChange={(e) => {
                  const newItems = [...form.items];
                  newItems[index].productId = e.target.value;
                  onChange({ items: newItems });
                }}
                className="flex-1 min-w-0"
              >
                <option value="">Selecione um produto</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} - {formatCurrency(product.price)}
                  </option>
                ))}
              </Select>
              <Input
                type="number"
                min="1"
                required
                value={item.quantity}
                onChange={(e) => {
                  const newItems = [...form.items];
                  newItems[index].quantity =
                    e.target.value === "" ? "" : parseInt(e.target.value);
                  onChange({ items: newItems });
                }}
                className="w-24"
                placeholder="Qtd"
              />
              {form.items.length > 1 && (
                <IconButton
                  type="button"
                  variant="danger"
                  size="sm"
                  icon={<Trash2 className="w-4 h-4" />}
                  onClick={() => {
                    const newItems = form.items.filter((_, i) => i !== index);
                    onChange({ items: newItems });
                  }}
                />
              )}
            </div>
          ))}
          <IconButton
            type="button"
            variant="secondary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              onChange({
                items: [...form.items, { productId: "", quantity: 1 }],
              });
            }}
          >
            Adicionar Produto
          </IconButton>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="w-full whitespace-nowrap"
          >
            Fechar
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function EditOrderModal({
  isOpen,
  form,
  products,
  isPending,
  onClose,
  onChange,
}: OrderModalBaseProps) {
  return (
    <AddOrderModal
      isOpen={isOpen}
      form={form}
      products={products}
      isPending={isPending}
      onClose={onClose}
      onChange={onChange}
      title="Editar Pedido"
    />
  );
}

interface ViewOrderModalProps {
  isOpen: boolean;
  order: Order | null;
  isActive: boolean;
  canEdit: boolean;
  onClose: () => void;
  onEdit: () => void;
}

export function ViewOrderModal({
  isOpen,
  order,
  isActive,
  canEdit,
  onClose,
  onEdit,
}: ViewOrderModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalhes do Pedido">
      {order && (
        <div className="space-y-4">
          {/* Informações do Pedido */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div>
              <span className="text-sm text-gray-500">Cliente</span>
              <p className="font-semibold text-gray-900">
                {order.customerName}
              </p>
            </div>

            <div>
              <span className="text-sm text-gray-500">Status de Pagamento</span>
              <p
                className={`font-medium ${
                  order.isPaid ? "text-green-600" : "text-red-600"
                }`}
              >
                {order.isPaid ? "Pago" : "Pendente"}
              </p>
            </div>
          </div>

          {/* Produtos do Pedido */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Produtos</h4>
            <div className="border rounded-lg divide-y">
              {order.items.map((item, index) => (
                <div
                  key={index}
                  className="p-3 flex justify-between items-center"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {item.product.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {item.quantity}x {formatCurrency(item.unitPrice)}
                    </p>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(item.subtotal)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Resumo Financeiro */}
          <div className="bg-primary-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(order.subtotal)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Frete</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(order.shippingFee)}
              </span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-primary-200">
              <span className="text-gray-900">Total</span>
              <span className="text-primary-600">
                {formatCurrency(order.total)}
              </span>
            </div>
          </div>

          {/* Comprovante de Pagamento */}
          {order.paymentProofUrl && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Comprovante de Pagamento
              </h4>
              <div className="border rounded-lg overflow-hidden">
                <img
                  src={getImageUrl(order.paymentProofUrl) || undefined}
                  alt="Comprovante PIX"
                  className="w-full h-auto"
                />
              </div>
            </div>
          )}

          {/* Chat */}
          <div>
            <OrderChat orderId={order.id} />
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-3 pt-4">
            {isActive && canEdit && (
              <Button onClick={onEdit} className="flex-1 gap-2">
                <Edit className="w-4 h-4" />
                Editar Pedido
              </Button>
            )}
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              Fechar
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
