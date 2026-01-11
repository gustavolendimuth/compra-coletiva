import {
  MessageCircle,
  Package,
  ShoppingBag,
  Eye,
  CircleDollarSign,
  BarChart3,
  Users,
  Hash,
  TrendingUp,
  Truck,
  User,
  LayoutDashboard,
} from "lucide-react";
import { Card, PixDisplay } from "@/components/ui";
import IconButton from "@/components/IconButton";
import { CampaignChat } from "@/components/campaign";
import { formatCurrency } from "@/lib/utils";
import { Order, Product, CampaignAnalytics, Campaign } from "@/api";
import { getCustomerDisplayName } from "../utils";

interface OverviewTabProps {
  campaign: Campaign;
  campaignId: string;
  analytics: CampaignAnalytics;
  products: Product[];
  orders: Order[];
  isActive: boolean;
  canEditCampaign: boolean;
  onAddProduct: () => void;
  onAddOrder: () => void;
  onViewOrder: (order: Order) => void;
  onTogglePayment: (order: Order) => void;
  onAddToOrder: (product: Product) => void;
}

export function OverviewTab({
  campaign,
  campaignId,
  analytics,
  products,
  orders,
  isActive,
  canEditCampaign,
  onAddProduct,
  onAddOrder,
  onViewOrder,
  onTogglePayment,
  onAddToOrder,
}: OverviewTabProps) {
  // Verificar se deve mostrar o PIX baseado no status da campanha
  const shouldShowPix =
    campaign.pixKey &&
    campaign.pixType &&
    campaign.status === campaign.pixVisibleAtStatus;

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <LayoutDashboard className="w-6 h-6 text-primary-600" />
          Visão Geral
        </h2>

        {isActive && (
          <div className="flex gap-2 justify-center md:justify-end flex-wrap">
            {canEditCampaign && (
              <IconButton
                size="sm"
                icon={<Package className="w-4 h-4" />}
                onClick={onAddProduct}
                className="text-xs sm:text-sm"
              >
                Adicionar Produto
              </IconButton>
            )}
            <IconButton
              size="sm"
              icon={<ShoppingBag className="w-4 h-4" />}
              onClick={onAddOrder}
              className="text-xs sm:text-sm"
              title="Adicionar Pedido (Alt+N)"
            >
              Adicionar Pedido
            </IconButton>
          </div>
        )}
      </div>

      {/* PIX em Destaque */}
      {shouldShowPix && (
        <PixDisplay
          pixKey={campaign.pixKey!}
          pixType={campaign.pixType!}
          pixName={campaign.pixName}
        />
      )}

      {/* Produtos em Destaque */}
      {products && products.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary-600" />
              Produtos Disponíveis
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {products
              .slice()
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((product) => (
                <div
                  key={product.id}
                  className="bg-white border border-gray-200 rounded-lg p-3 hover:border-primary-400 hover:shadow-md transition-all duration-200 flex flex-col"
                >
                  <div className="bg-primary-100 p-2 rounded-lg mb-2 w-fit">
                    <Package className="w-5 h-5 text-primary-600" />
                  </div>

                  <h4 className="font-semibold text-gray-900 mb-1 line-clamp-2 text-sm md:text-base leading-tight min-h-[2.25rem] md:min-h-[3rem]">
                    {product.name}
                  </h4>

                  <div className="mt-auto mb-2">
                    <span className="text-lg font-bold text-primary-600">
                      {formatCurrency(product.price)}
                    </span>
                  </div>

                  {isActive && (
                    <button
                      onClick={() => onAddToOrder(product)}
                      className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-1.5 px-3 rounded-lg transition-colors duration-200 text-sm"
                    >
                      Pedir
                    </button>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Resumo Financeiro */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <CircleDollarSign className="w-5 h-5 text-primary-600" />
          Resumo Financeiro
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card>
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-primary-600" />
              <div className="text-sm text-gray-500">Total de Pessoas</div>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-gray-900">
              {analytics.byCustomer.length}
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-2 mb-2">
              <Hash className="w-4 h-4 text-primary-600" />
              <div className="text-sm text-gray-500">Total de Itens</div>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-gray-900">
              {analytics.totalQuantity}
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-2 mb-2">
              <ShoppingBag className="w-4 h-4 text-primary-600" />
              <div className="text-sm text-gray-500">Total sem Frete</div>
            </div>
            <div className="text-xl md:text-3xl font-bold text-gray-900">
              {formatCurrency(analytics.totalWithoutShipping)}
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-2 mb-2">
              <Truck className="w-4 h-4 text-primary-600" />
              <div className="text-sm text-gray-500">Total com Frete</div>
            </div>
            <div className="text-xl md:text-3xl font-bold text-gray-900">
              {formatCurrency(analytics.totalWithShipping)}
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <div className="text-sm text-gray-500">Total Pago</div>
            </div>
            <div className="text-xl md:text-3xl font-bold text-green-600">
              {formatCurrency(analytics.totalPaid)}
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-2 mb-2">
              <CircleDollarSign className="w-4 h-4 text-red-600" />
              <div className="text-sm text-gray-500">Total Não Pago</div>
            </div>
            <div className="text-xl md:text-3xl font-bold text-red-600">
              {formatCurrency(analytics.totalUnpaid)}
            </div>
          </Card>
        </div>
      </div>

      {/* Detalhes por Produto e Cliente */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary-600" />
          Detalhamento
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:items-start">
          <Card className="h-fit">
            <h4 className="font-semibold mb-4 text-gray-800 flex items-center gap-2">
              <User className="w-5 h-5 text-primary-600" />
              Por Pessoa
            </h4>
            <div className="space-y-3">
              {[...analytics.byCustomer]
                .sort((a, b) =>
                  (a.customerName || "").localeCompare(b.customerName || "")
                )
                .map((item, index) => {
                  const order = orders?.find(
                    (o) => getCustomerDisplayName(o) === item.customerName
                  );

                  return (
                    <div
                      key={index}
                      className="flex flex-col gap-2 pb-3 border-b last:border-b-0 last:pb-0"
                    >
                      <div className="flex justify-between items-center gap-3">
                        <span className="text-gray-900 font-medium flex-1 min-w-0">
                          {item.customerName}
                        </span>

                        <div className="flex items-center gap-2">
                          {order && (
                            <>
                              <IconButton
                                size="sm"
                                variant="secondary"
                                icon={<Eye className="w-5 h-5" />}
                                onClick={() => onViewOrder(order)}
                                title="Visualizar pedido"
                              />
                              <IconButton
                                size="sm"
                                variant={item.isPaid ? "success" : "secondary"}
                                icon={<CircleDollarSign className="w-5 h-5" />}
                                onClick={() => onTogglePayment(order)}
                                title={
                                  item.isPaid
                                    ? "Marcar como não pago"
                                    : "Marcar como pago"
                                }
                              />
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                            item.isPaid
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {item.isPaid ? "Pago" : "Pendente"}
                        </span>

                        <span className="font-semibold text-gray-900 whitespace-nowrap">
                          {formatCurrency(item.total)}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </Card>

          <Card className="h-fit">
            <h4 className="font-semibold mb-4 text-gray-800 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary-600" />
              Por Produto
            </h4>
            <div className="space-y-2">
              {analytics.byProduct.map((item) => (
                <div
                  key={item.productId}
                  className="flex justify-between items-center gap-3"
                >
                  <span className="text-gray-600 truncate flex-1 min-w-0">
                    {item.productName}
                  </span>
                  <span className="font-medium text-gray-900 whitespace-nowrap flex-shrink-0">
                    {item.quantity}{" "}
                    <span className="hidden sm:inline">unidades</span>
                    <span className="sm:hidden">un.</span>
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Seção de Perguntas e Respostas */}
      <div className="mt-8">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-primary-600" />
            Perguntas e Respostas
          </h3>
          <p className="text-gray-600 text-sm">
            Faça perguntas sobre os produtos e a campanha. O criador responderá
            em breve.
          </p>
        </div>
        <CampaignChat campaignId={campaignId} isCreator={canEditCampaign} />
      </div>
    </div>
  );
}
