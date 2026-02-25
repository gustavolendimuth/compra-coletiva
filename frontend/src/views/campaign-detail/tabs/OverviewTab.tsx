import { Card, PixDisplay } from "@/components/ui";
import IconButton from "@/components/IconButton";
import { CampaignChat } from "@/components/campaign";
import { Skeleton } from "@/components/Skeleton";
import { formatCurrency } from "@/lib/utils";
import { Order, Product, CampaignAnalytics, Campaign } from "@/api";
import { getCustomerDisplayName } from "../utils";
import { useAuth } from "@/contexts/AuthContext";
import { CampaignLocationSection } from "../CampaignLocationSection";
import { Eye, Upload } from "lucide-react";

interface OverviewTabProps {
  campaign: Campaign;
  campaignId: string;
  analytics?: CampaignAnalytics;
  isAnalyticsLoading?: boolean;
  products: Product[];
  orders: Order[];
  isActive: boolean;
  canEditCampaign: boolean;
  onViewOrder: (order: Order) => void;
  onTogglePayment: (order: Order) => void;
  onAddToOrder: (product: Product) => void;
  onEditAddress?: () => void;
}

export function OverviewTab({
  campaign,
  campaignId,
  analytics,
  isAnalyticsLoading = false,
  products,
  orders,
  isActive,
  canEditCampaign,
  onViewOrder,
  onTogglePayment,
  onAddToOrder,
  onEditAddress,
}: OverviewTabProps) {
  const { user } = useAuth();

  const userOrder = user ? orders.find(o => o.userId === user.id) : undefined;

  const shouldShowPix =
    campaign.pixKey &&
    campaign.pixType &&
    campaign.status !== "ARCHIVED" &&
    campaign.status === campaign.pixVisibleAtStatus &&
    userOrder !== undefined;

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <h2 className="font-display text-2xl font-bold text-sky-900 flex items-center gap-2">
        <span className="w-7 h-7 rounded-xl bg-sky-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        </span>
        Visão Geral
      </h2>

      {/* Localização de Retirada */}
      {(campaign.pickupAddress || canEditCampaign) && (
        <CampaignLocationSection
          campaign={campaign}
          canEditCampaign={canEditCampaign}
          onEditAddress={onEditAddress}
        />
      )}

      {/* PIX em Destaque */}
      {shouldShowPix && (
        <PixDisplay
          pixKey={campaign.pixKey!}
          pixType={campaign.pixType!}
          pixName={campaign.pixName}
          userOrder={userOrder}
          onUploadProof={onTogglePayment}
        />
      )}

      {/* Produtos em Destaque */}
      {products && products.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-xl font-semibold text-sky-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </span>
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
                  className="bg-white border border-sky-100/60 rounded-2xl p-3 hover:border-sky-300 hover:shadow-md hover:shadow-sky-100/50 transition-all duration-200 flex flex-col"
                >
                  <div className="bg-amber-50 p-2 rounded-xl mb-2 w-fit">
                    <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>

                  <h4 className="font-semibold text-sky-900 mb-1 line-clamp-2 text-sm md:text-base leading-tight min-h-[2.25rem] md:min-h-[3rem]">
                    {product.name}
                  </h4>

                  <div className="mt-auto mb-2">
                    <span className="text-lg font-bold text-sky-700">
                      {formatCurrency(product.price)}
                    </span>
                  </div>

                  {isActive && (
                    <button
                      onClick={() => onAddToOrder(product)}
                      className="w-full bg-gradient-to-r from-sky-500 to-sky-600 hover:shadow-md hover:shadow-sky-300/30 text-white font-medium py-1.5 px-3 rounded-xl transition-all duration-200 text-sm"
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
        <h3 className="font-display text-lg font-semibold text-sky-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          Resumo Financeiro
        </h3>
        {isAnalyticsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index}>
                <div className="flex items-center gap-2 mb-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <Skeleton className="h-7 w-20" />
              </Card>
            ))}
          </div>
        ) : analytics ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card>
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div className="text-sm text-sky-600">Total de Pessoas</div>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-sky-900">
                {analytics.byCustomer.length}
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
                <div className="text-sm text-sky-600">Total de Itens</div>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-sky-900">
                {analytics.totalQuantity}
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <div className="text-sm text-sky-600">Total sem Frete</div>
              </div>
              <div className="text-xl md:text-3xl font-bold text-sky-900">
                {formatCurrency(analytics.totalWithoutShipping)}
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                </svg>
                <div className="text-sm text-sky-600">Total com Frete</div>
              </div>
              <div className="text-xl md:text-3xl font-bold text-sky-900">
                {formatCurrency(analytics.totalWithShipping)}
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <div className="text-sm text-sky-600">Total Pago</div>
              </div>
              <div className="text-xl md:text-3xl font-bold text-emerald-600">
                {formatCurrency(analytics.totalPaid)}
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-sky-600">Total Não Pago</div>
              </div>
              <div className="text-xl md:text-3xl font-bold text-red-500">
                {formatCurrency(analytics.totalUnpaid)}
              </div>
            </Card>
          </div>
        ) : (
          <Card>
            <p className="text-sm text-sky-600">Nenhum dado financeiro disponível.</p>
          </Card>
        )}
      </div>

      {/* Detalhes por Produto e Cliente */}
      <div>
        <h3 className="font-display text-lg font-semibold text-sky-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-sky-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-3.5 h-3.5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </span>
          Detalhamento
        </h3>
        {isAnalyticsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:items-start">
            <Card className="h-fit space-y-3">
              <Skeleton className="h-5 w-32" />
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </Card>
            <Card className="h-fit space-y-3">
              <Skeleton className="h-5 w-32" />
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-4 w-full" />
              ))}
            </Card>
          </div>
        ) : analytics ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:items-start">
            <Card className="h-fit">
              <h4 className="font-semibold mb-4 text-sky-900 flex items-center gap-2">
                <svg className="w-4 h-4 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
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
                        className="flex flex-col gap-2 pb-3 border-b border-sky-100 last:border-b-0 last:pb-0"
                      >
                        <div className="flex justify-between items-center gap-3">
                          <span className="text-sky-900 font-medium flex-1 min-w-0">
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
                                  icon={<Upload className="w-5 h-5" />}
                                  onClick={() => onTogglePayment(order)}
                                  title={
                                    item.isPaid
                                      ? "Marcar como não pago"
                                      : "Enviar comprovante de pagamento"
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
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-red-100 text-red-600"
                            }`}
                          >
                            {item.isPaid ? "Pago" : "Pendente"}
                          </span>

                          <span className="font-semibold text-sky-900 whitespace-nowrap">
                            {formatCurrency(item.total)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </Card>

            <Card className="h-fit">
              <h4 className="font-semibold mb-4 text-sky-900 flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Por Produto
              </h4>
              <div className="space-y-2">
                {analytics.byProduct.map((item) => (
                  <div
                    key={item.productId}
                    className="flex justify-between items-center gap-3"
                  >
                    <span className="text-sky-700 truncate flex-1 min-w-0">
                      {item.productName}
                    </span>
                    <span className="font-medium text-sky-900 whitespace-nowrap flex-shrink-0">
                      {item.quantity}{" "}
                      <span className="hidden sm:inline">unidades</span>
                      <span className="sm:hidden">un.</span>
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        ) : (
          <Card>
            <p className="text-sm text-sky-600">Nenhum dado de detalhamento disponível.</p>
          </Card>
        )}
      </div>

      {/* Seção de Perguntas e Respostas */}
      <div>
        <div className="mb-4">
          <h3 className="font-display text-xl font-bold text-sky-900 mb-2 flex items-center gap-2">
            <span className="w-7 h-7 rounded-xl bg-sky-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </span>
            Perguntas e Respostas
          </h3>
          <p className="text-sky-600 text-sm">
            Faça perguntas sobre os produtos e a campanha. O criador responderá
            em breve.
          </p>
        </div>
        <CampaignChat campaignId={campaignId} isCreator={canEditCampaign} />
      </div>
    </div>
  );
}
