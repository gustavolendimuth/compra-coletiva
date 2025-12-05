import { Eye, CircleDollarSign, Edit, Trash2 } from 'lucide-react';
import { Order } from '@/api';
import { formatCurrency } from '@/lib/utils';
import { Card } from '@/components/ui';
import IconButton from '@/components/IconButton';

interface OrderCardProps {
  order: Order;
  customerName: string;
  canEditCampaign: boolean;
  isActive: boolean;
  currentUserId?: string;
  onView: () => void;
  onTogglePayment: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function OrderCard({
  order,
  customerName,
  canEditCampaign,
  isActive,
  currentUserId,
  onView,
  onTogglePayment,
  onEdit,
  onDelete
}: OrderCardProps) {
  const canEdit = isActive && (currentUserId === order.userId || canEditCampaign);
  const canDelete = isActive && canEditCampaign;

  return (
    <Card className="py-3">
      <div className="flex flex-col gap-3">
        {/* Header: Status e Nome do Cliente */}
        <div className="flex items-start gap-2">
          <span
            className={`px-2 py-1 text-xs rounded-full whitespace-nowrap flex-shrink-0 ${
              order.isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}
          >
            {order.isPaid ? 'Pago' : 'Pendente'}
          </span>
          <h3 className="font-semibold text-gray-900 leading-tight flex-1">
            {customerName}
          </h3>
        </div>

        {/* Produtos */}
        <p className="text-xs text-gray-600 leading-relaxed">
          {order.items.map(item => `${item.quantity}x ${item.product.name}`).join(', ')}
        </p>

        {/* Valores */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex-1">
            <div className="text-gray-500 text-xs mb-0.5">Subtotal</div>
            <div className="font-medium text-gray-900">{formatCurrency(order.subtotal)}</div>
          </div>
          <div className="flex-1">
            <div className="text-gray-500 text-xs mb-0.5">Frete</div>
            <div className="font-medium text-gray-900">{formatCurrency(order.shippingFee)}</div>
          </div>
          <div className="flex-1">
            <div className="text-gray-500 text-xs mb-0.5">Total</div>
            <div className="font-semibold text-gray-900">{formatCurrency(order.total)}</div>
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
          {canEditCampaign && (
            <IconButton
              size="sm"
              variant={order.isPaid ? 'success' : 'secondary'}
              icon={<CircleDollarSign className="w-4 h-4" />}
              onClick={onTogglePayment}
              title={order.isPaid ? 'Marcar como não pago' : 'Marcar como pago'}
              className="flex-1"
            />
          )}
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
