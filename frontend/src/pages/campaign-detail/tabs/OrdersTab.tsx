import { useState } from "react";
import {
  ShoppingBag,
  Search,
  X,
  Eye,
  CircleDollarSign,
  Edit,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Card, Input, ConfirmModal } from "@/components/ui";
import IconButton from "@/components/IconButton";
import OrderCard from "@/components/campaign/OrderCard";
import { formatCurrency } from "@/lib/utils";
import { Order } from "@/api";
import { getCustomerDisplayName } from "../utils";

interface OrdersTabProps {
  orders: Order[];
  filteredOrders: Order[];
  isActive: boolean;
  canEditCampaign: boolean;
  currentUserId?: string;
  orderSearch: string;
  sortField: "customerName" | "subtotal" | "shippingFee" | "total" | "isPaid";
  sortDirection: "asc" | "desc";
  onAddOrder: () => void;
  onViewOrder: (order: Order) => void;
  onTogglePayment: (order: Order) => void;
  onEditOrder: (order: Order) => void;
  onDeleteOrder: (orderId: string) => void;
  onSearchChange: (value: string) => void;
  onSort: (
    field: "customerName" | "subtotal" | "shippingFee" | "total" | "isPaid"
  ) => void;
}

export function OrdersTab({
  orders: _orders,
  filteredOrders,
  isActive,
  canEditCampaign,
  currentUserId,
  orderSearch,
  sortField,
  sortDirection,
  onAddOrder,
  onViewOrder,
  onTogglePayment,
  onEditOrder,
  onDeleteOrder,
  onSearchChange,
  onSort,
}: OrdersTabProps) {
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

  const handleDeleteClick = (order: Order) => {
    setOrderToDelete(order);
  };

  const handleConfirmDelete = () => {
    if (orderToDelete) {
      onDeleteOrder(orderToDelete.id);
      setOrderToDelete(null);
    }
  };

  const renderSortIcon = (field: typeof sortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="w-4 h-4 text-primary-600" />
    ) : (
      <ArrowDown className="w-4 h-4 text-primary-600" />
    );
  };

  return (
    <div className="pb-20 md:pb-0">
      <div className="mb-4 space-y-3">
        <div className="flex justify-between items-center gap-2">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-primary-600" />
            Pedidos
          </h2>
          {isActive && (
            <IconButton
              size="sm"
              icon={<ShoppingBag className="w-4 h-4" />}
              onClick={onAddOrder}
              className="text-xs sm:text-sm whitespace-nowrap"
              title="Adicionar Pedido (Alt+N)"
            >
              Adicionar Pedido
            </IconButton>
          )}
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
          <Input
            type="text"
            placeholder="Buscar por pessoa..."
            value={orderSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-10 py-2 text-sm"
          />
          {orderSearch && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors z-10"
              title="Limpar busca"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {filteredOrders && filteredOrders.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-500">
              {orderSearch
                ? "Nenhum pedido encontrado"
                : "Nenhum pedido criado"}
            </p>
          </div>
        </Card>
      ) : (
        <>
          {/* Mobile: Sorting Controls */}
          <div className="md:hidden mb-3">
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => onSort("customerName")}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  sortField === "customerName"
                    ? "bg-primary-100 text-primary-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <span>Pessoa</span>
                {renderSortIcon("customerName")}
              </button>
              <button
                onClick={() => onSort("total")}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  sortField === "total"
                    ? "bg-primary-100 text-primary-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <span>Total</span>
                {renderSortIcon("total")}
              </button>
              <button
                onClick={() => onSort("isPaid")}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  sortField === "isPaid"
                    ? "bg-primary-100 text-primary-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <span>Status</span>
                {renderSortIcon("isPaid")}
              </button>
            </div>
          </div>

          {/* Mobile: Cards */}
          <div className="space-y-2 md:hidden">
            {filteredOrders?.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                canEditCampaign={!!canEditCampaign}
                isActive={isActive}
                currentUserId={currentUserId}
                onView={() => onViewOrder(order)}
                onTogglePayment={() => onTogglePayment(order)}
                onEdit={() => onEditOrder(order)}
                onDelete={() => handleDeleteClick(order)}
              />
            ))}
          </div>

          {/* Desktop: Table */}
          <Card className="hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th
                      className="px-4 py-3 text-left text-sm font-medium text-gray-900 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => onSort("isPaid")}
                    >
                      <div className="flex items-center gap-2">
                        <span>Status</span>
                        {renderSortIcon("isPaid")}
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-sm font-medium text-gray-900 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => onSort("customerName")}
                    >
                      <div className="flex items-center gap-2">
                        <span>Pessoa</span>
                        {renderSortIcon("customerName")}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 min-w-[200px]">
                      Produtos
                    </th>
                    <th
                      className="px-4 py-3 text-right text-sm font-medium text-gray-900 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => onSort("subtotal")}
                    >
                      <div className="flex items-center justify-end gap-2">
                        <span>Subtotal</span>
                        {renderSortIcon("subtotal")}
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-right text-sm font-medium text-gray-900 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => onSort("shippingFee")}
                    >
                      <div className="flex items-center justify-end gap-2">
                        <span>Frete</span>
                        {renderSortIcon("shippingFee")}
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-right text-sm font-medium text-gray-900 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => onSort("total")}
                    >
                      <div className="flex items-center justify-end gap-2">
                        <span>Total</span>
                        {renderSortIcon("total")}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredOrders?.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${
                            order.isPaid
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {order.isPaid ? "Pago" : "Pendente"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {getCustomerDisplayName(order)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex flex-col gap-1 max-w-xs">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="inline-flex items-center justify-center min-w-[24px] h-5 px-1.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                                {item.quantity}x
                              </span>
                              <span
                                className="text-gray-700 truncate"
                                title={item.product.name}
                              >
                                {item.product.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        {formatCurrency(order.subtotal)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        {formatCurrency(order.shippingFee)}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right whitespace-nowrap">
                        <div className="flex gap-1 justify-end">
                          <IconButton
                            size="sm"
                            variant="secondary"
                            icon={<Eye className="w-5 h-5" />}
                            onClick={() => onViewOrder(order)}
                            title="Visualizar pedido"
                          />
                          {canEditCampaign && (
                            <IconButton
                              size="sm"
                              variant={order.isPaid ? "success" : "secondary"}
                              icon={<CircleDollarSign className="w-5 h-5" />}
                              onClick={() => onTogglePayment(order)}
                              title={
                                order.isPaid
                                  ? "Marcar como não pago"
                                  : "Marcar como pago"
                              }
                            />
                          )}
                          {isActive &&
                            (currentUserId === order.userId ||
                              canEditCampaign) && (
                              <IconButton
                                size="sm"
                                variant="secondary"
                                icon={<Edit className="w-4 h-4" />}
                                onClick={() => onEditOrder(order)}
                                title="Editar pedido"
                              />
                            )}
                          {isActive && canEditCampaign && (
                            <IconButton
                              size="sm"
                              variant="danger"
                              icon={<Trash2 className="w-4 h-4" />}
                              onClick={() => handleDeleteClick(order)}
                              title="Remover pedido"
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!orderToDelete}
        onClose={() => setOrderToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Remover Pedido"
        message={
          orderToDelete ? (
            <>
              <p>Tem certeza que deseja remover o pedido de <strong>{getCustomerDisplayName(orderToDelete)}</strong>?</p>
              <p className="mt-2 text-sm text-gray-600">Esta ação não pode ser desfeita.</p>
            </>
          ) : (
            ""
          )
        }
        confirmText="Remover"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
}
