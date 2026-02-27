import {
  Eye,
  Upload,
  Edit,
  Trash2,
  Package,
  Truck,
  ShoppingCart,
} from "lucide-react";
import { Order } from "@/api";
import { formatCurrency } from "@/lib/utils";
import { Card } from "@/components/ui";
import IconButton from "@/components/IconButton";

interface OrderCardProps {
  order: Order;
  canEditCampaign: boolean;
  isActive: boolean;
  onView: () => void;
  onTogglePayment: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function OrderCard({
  order,
  canEditCampaign,
  isActive,
  onView,
  onTogglePayment,
  onEdit,
  onDelete,
}: OrderCardProps) {
  const canEdit = true;
  const canDelete = isActive && canEditCampaign;

  return (
    <Card className="py-3">
      <div className="flex flex-col gap-3">
        {/* Header: Status e Nome do Cliente */}
        <div className="flex items-start gap-2">
          <span
            className={`px-2 py-1 text-xs rounded-full whitespace-nowrap flex-shrink-0 ${
              order.isPaid
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {order.isPaid ? "Pago" : "Pendente"}
          </span>
          <h3 className="font-semibold text-gray-900 leading-tight flex-1">
            {order.customer.name}
          </h3>
        </div>

        {/* Produtos */}
        <div className="flex flex-col gap-1">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center min-w-[24px] h-5 px-1.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                {item.quantity}x
              </span>
              <span className="text-xs text-gray-700">{item.product.name}</span>
            </div>
          ))}
        </div>

        {/* Valores */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex-1">
            <div className="text-gray-500 text-xs mb-0.5 flex items-center gap-1">
              <Package className="w-3 h-3" />
              Subtotal
            </div>
            <div className="font-medium text-gray-900">
              {formatCurrency(order.subtotal)}
            </div>
          </div>
          <div className="flex-1">
            <div className="text-gray-500 text-xs mb-0.5 flex items-center gap-1">
              <Truck className="w-3 h-3" />
              Frete
            </div>
            <div className="font-medium text-gray-900">
              {formatCurrency(order.shippingFee)}
            </div>
          </div>
          <div className="flex-1">
            <div className="text-gray-500 text-xs mb-0.5 flex items-center gap-1">
              <ShoppingCart className="w-3 h-3" />
              Total
            </div>
            <div className="font-semibold text-gray-900">
              {formatCurrency(order.total)}
            </div>
          </div>
        </div>

        {/* Ações - Linha separada com espaçamento adequado para touch */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
          <IconButton
            size="sm"
            variant="secondary"
            icon={<Eye className="w-4 h-4" />}
            onClick={onView}
            title="Visualizar pedido"
            className="flex-1"
          />
          <IconButton
            size="sm"
            variant={order.isPaid ? "success" : "secondary"}
            icon={<Upload className="w-4 h-4" />}
            onClick={onTogglePayment}
            title={order.isPaid ? "Marcar como não pago" : "Enviar comprovante de pagamento"}
            className="flex-1"
          />
          {canEdit && (
            <IconButton
              size="sm"
              variant="secondary"
              icon={<Edit className="w-4 h-4" />}
              onClick={onEdit}
              title="Editar pedido"
              className="flex-1"
            />
          )}
          {canDelete && (
            <IconButton
              size="sm"
              variant="danger"
              icon={<Trash2 className="w-4 h-4" />}
              onClick={onDelete}
              title="Remover pedido"
              className="flex-1"
            />
          )}
        </div>
      </div>
    </Card>
  );
}
