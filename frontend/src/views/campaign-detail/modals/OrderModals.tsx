import { Plus, Trash2, Edit, Check, Loader } from "lucide-react";
/* eslint-disable @next/next/no-img-element */
import { Modal, Button, Input, Select, Badge } from "@/components/ui";
import IconButton from "@/components/IconButton";
import { OrderChat } from "@/components/campaign";
import { formatCurrency } from "@/lib/utils";
import { getImageUrl } from "@/lib/imageUrl";
import { Order, Product } from "@/api";
import type { OrderFormItem } from "@/api/types";

// Order form for modal component (without campaignId)
interface OrderModalForm {
  items: OrderFormItem[];
}

function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 5) return "agora";
  if (seconds < 60) return `${seconds}s atrás`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m atrás`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h atrás`;
}

interface OrderModalBaseProps {
  isOpen: boolean;
  form: OrderModalForm;
  products: Product[];
  onClose: () => void;
  onChange: (form: OrderModalForm) => void;
}

interface AddOrderModalProps extends OrderModalBaseProps {
  title?: string;
  isAutosaving?: boolean;
  lastSaved?: Date | null;
}

interface AdminCreateOrderModalProps {
  isOpen: boolean;
  form: {
    mode: "self" | "customer";
    name: string;
    email: string;
    phone: string;
  };
  isPending?: boolean;
  onClose: () => void;
  onChange: (form: { mode: "self" | "customer"; name: string; email: string; phone: string }) => void;
  onSubmit: () => void;
}

export function AdminCreateOrderModal({
  isOpen,
  form,
  isPending = false,
  onClose,
  onChange,
  onSubmit,
}: AdminCreateOrderModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Novo Pedido">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-sky-700 mb-2">
            Para quem e o pedido?
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={form.mode === "self" ? "primary" : "secondary"}
              onClick={() => onChange({ ...form, mode: "self" })}
            >
              Pedido para mim
            </Button>
            <Button
              type="button"
              variant={form.mode === "customer" ? "primary" : "secondary"}
              onClick={() => onChange({ ...form, mode: "customer" })}
            >
              Para outro usuario
            </Button>
          </div>
        </div>

        {form.mode === "customer" && (
          <>
            <p className="text-sm text-sky-700">
              Informe os dados do cliente. Se o email ja existir, o pedido sera vinculado ao usuario existente.
            </p>

            <div>
              <label className="block text-sm font-medium text-sky-700 mb-2">
                Nome do cliente *
              </label>
              <Input
                type="text"
                value={form.name}
                onChange={(e) => onChange({ ...form, name: e.target.value })}
                placeholder="Ex: Maria Silva"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-sky-700 mb-2">
                Email do cliente *
              </label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => onChange({ ...form, email: e.target.value })}
                placeholder="cliente@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-sky-700 mb-2">
                Telefone (opcional)
              </label>
              <Input
                type="text"
                value={form.phone}
                onChange={(e) => onChange({ ...form, phone: e.target.value })}
                placeholder="(11) 99999-9999"
              />
            </div>
          </>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="w-full">
            Cancelar
          </Button>
          <Button type="button" onClick={onSubmit} className="w-full" disabled={isPending}>
            {isPending ? "Criando..." : "Continuar"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function AddOrderModal({
  isOpen,
  form,
  products,
  onClose,
  onChange,
  title = "Novo Pedido",
  isAutosaving = false,
  lastSaved = null,
}: AddOrderModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-blue-800">
              <strong>Atalho:</strong> Alt+P para adicionar produto
            </p>
            {isAutosaving && (
              <Badge variant="neutral" className="text-xs">
                <Loader className="w-3 h-3 animate-spin mr-1" />
                Salvando...
              </Badge>
            )}
            {!isAutosaving && lastSaved && (
              <Badge variant="success" className="text-xs">
                <Check className="w-3 h-3 mr-1" />
                Salvo {formatRelativeTime(lastSaved)}
              </Badge>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-sky-700 mb-2">
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

interface EditOrderModalProps extends OrderModalBaseProps {
  isAutosaving?: boolean;
  lastSaved?: Date | null;
}

export function EditOrderModal({
  isOpen,
  form,
  products,
  onClose,
  onChange,
  isAutosaving = false,
  lastSaved = null,
}: EditOrderModalProps) {
  return (
    <AddOrderModal
      isOpen={isOpen}
      form={form}
      products={products}
      onClose={onClose}
      onChange={onChange}
      title="Editar Pedido"
      isAutosaving={isAutosaving}
      lastSaved={lastSaved}
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
          <div className="bg-sky-50 rounded-2xl p-4 space-y-3">
            <div>
              <span className="text-sm text-sky-600">Cliente</span>
              <p className="font-semibold text-sky-900">
                {order.customer.name}
              </p>
            </div>

            <div>
              <span className="text-sm text-sky-600">Status de Pagamento</span>
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
            <h4 className="font-semibold text-sky-900 mb-2">Produtos</h4>
            <div className="border border-sky-100 rounded-2xl divide-y divide-sky-100">
              {order.items.map((item, index) => (
                <div
                  key={index}
                  className="p-3 flex justify-between items-center"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sky-900">
                      {item.product.name}
                    </p>
                    <p className="text-sm text-sky-600">
                      {item.quantity}x {formatCurrency(item.unitPrice)}
                    </p>
                  </div>
                  <p className="font-semibold text-sky-900">
                    {formatCurrency(item.subtotal)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Resumo Financeiro */}
          <div className="bg-sky-50 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-sky-600">Subtotal</span>
              <span className="font-medium text-sky-900">
                {formatCurrency(order.subtotal)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-sky-600">Frete</span>
              <span className="font-medium text-sky-900">
                {formatCurrency(order.shippingFee)}
              </span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-sky-200">
              <span className="text-sky-900">Total</span>
              <span className="text-sky-600">
                {formatCurrency(order.total)}
              </span>
            </div>
          </div>

          {/* Comprovante de Pagamento */}
          {order.paymentProofUrl && (
            <div>
              <h4 className="font-semibold text-sky-900 mb-2">
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
