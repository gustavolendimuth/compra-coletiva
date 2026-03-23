import { useState } from "react";
import { Card, PixDisplay, PaymentPendingNotice } from "@/components/ui";
import { CampaignChat } from "@/components/campaign";
import { Skeleton } from "@/components/Skeleton";
import { formatCurrency } from "@/lib/utils";
import { getImageUrl } from "@/lib/imageUrl";
import { Order, Product, CampaignAnalytics, Campaign } from "@/api";
import { useAuth } from "@/contexts/AuthContext";
import { CampaignLocationSection } from "../CampaignLocationSection";
import { getCustomerDisplayName } from "../utils";
import { Edit, Eye, LogIn, Upload, ChevronDown, ChevronUp } from "lucide-react";
import IconButton from "@/components/IconButton";
import {
  canShowPaymentPendingNotice,
  canShowPixToBuyer,
  getPaymentReleaseTrigger,
} from "@/lib/paymentRelease";

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
  onEditOrder: (order: Order) => void;
  onAddToOrder: (product: Product) => void;
  onEditAddress?: () => void;
}

function ProductImage({ product }: { product: Product }) {
  const [hasError, setHasError] = useState(false);
  const imageUrl = getImageUrl(product.imageUrl);

  if (!imageUrl || hasError) {
    return (
      <div className="w-full aspect-square rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center mb-3">
        <svg
          className="w-8 h-8 text-amber-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className="w-full aspect-square rounded-xl overflow-hidden bg-sky-50 border border-sky-100 mb-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={product.name}
        className="w-full h-full object-cover"
        onError={() => setHasError(true)}
      />
    </div>
  );
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
  onEditOrder,
  onAddToOrder,
  onEditAddress,
}: OverviewTabProps) {
  const { user, requireAuth } = useAuth();
  const [showDetails, setShowDetails] = useState(false);

  const userOrder = user ? orders.find((o) => o.userId === user.id) : undefined;

  const isAdmin = user?.role === "ADMIN";
  const isCreator = campaign.creatorId === user?.id;

  const paymentReleaseTrigger = getPaymentReleaseTrigger(
    campaign.paymentReleaseTrigger,
    campaign.pixVisibleAtStatus
  );
  const hasUserOrder = userOrder !== undefined;
  const shouldShowPix = canShowPixToBuyer(campaign, hasUserOrder);
  const shouldShowPaymentPending = canShowPaymentPendingNotice(campaign, hasUserOrder);
  const hasPixConfigured = Boolean(
    campaign.pixKey && campaign.pixType && campaign.status !== "ARCHIVED"
  );
  const shouldShowPixLoginNotice = !user && hasPixConfigured;

  return (
    <div className="space-y-8 pb-28 md:pb-8">

      {/* PIX / Pagamento — seção mais importante para o participante */}
      {shouldShowPix && (
        <PixDisplay
          pixKey={campaign.pixKey!}
          pixType={campaign.pixType!}
          pixName={campaign.pixName}
          userOrder={userOrder}
          onUploadProof={onTogglePayment}
        />
      )}

      {shouldShowPaymentPending && (
        <PaymentPendingNotice
          paymentReleaseTrigger={paymentReleaseTrigger}
          campaignStatus={campaign.status}
        />
      )}

      {shouldShowPixLoginNotice && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center">
              <LogIn className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="text-base font-semibold text-emerald-900 mb-1">
                Esta campanha possui pagamento via PIX
              </p>
              <p className="text-base text-emerald-700 mb-4">
                Faça login para ver os dados de pagamento e participar da campanha.
              </p>
              <button
                onClick={() => requireAuth(() => {})}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-3 rounded-xl text-base transition-colors"
              >
                <LogIn className="w-5 h-5" />
                Fazer Login
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Local de Retirada */}
      {(campaign.pickupAddress || canEditCampaign) && (
        <CampaignLocationSection
          campaign={campaign}
          canEditCampaign={canEditCampaign}
          onEditAddress={onEditAddress}
        />
      )}

      {/* Produtos Disponíveis */}
      {products && products.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-sky-900 mb-4 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-amber-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </span>
            Produtos Disponíveis
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products
              .slice()
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((product) => (
                <div
                  key={product.id}
                  className="bg-white border border-sky-100 rounded-2xl p-4 hover:border-sky-300 hover:shadow-md transition-all flex flex-col"
                >
                  <ProductImage product={product} />

                  <h3 className="font-semibold text-sky-900 mb-2 line-clamp-2 text-base leading-snug">
                    {product.name}
                  </h3>

                  <div className="mt-auto space-y-3">
                    <span className="text-xl font-bold text-sky-700 block">
                      {formatCurrency(product.price)}
                    </span>

                    {isActive && (
                      <button
                        onClick={() => onAddToOrder(product)}
                        className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 px-4 rounded-xl text-base transition-colors"
                      >
                        Pedir
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* Resumo Financeiro — apenas para criador/admin */}
      {(isCreator || isAdmin) && (
        <section>
          <h2 className="text-xl font-bold text-sky-900 mb-4 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-emerald-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </span>
            Resumo Financeiro
          </h2>

          {isAnalyticsLoading ? (
            <div className="grid grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <Skeleton className="h-4 w-20 mb-3" />
                  <Skeleton className="h-8 w-16" />
                </Card>
              ))}
            </div>
          ) : analytics ? (
            <>
              {/* 3 métricas principais */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <Card>
                  <div className="text-sm font-semibold text-sky-600 mb-2">Pessoas</div>
                  <div className="text-3xl font-bold text-sky-900">
                    {analytics.byCustomer.length}
                  </div>
                </Card>
                <Card>
                  <div className="text-sm font-semibold text-sky-600 mb-2">Total</div>
                  <div className="text-2xl font-bold text-sky-900">
                    {formatCurrency(analytics.totalWithShipping)}
                  </div>
                </Card>
                <Card>
                  <div className="text-sm font-semibold text-emerald-600 mb-2">Pago</div>
                  <div className="text-2xl font-bold text-emerald-600">
                    {formatCurrency(analytics.totalPaid)}
                  </div>
                </Card>
              </div>

              {/* Detalhamento colapsável */}
              <button
                onClick={() => setShowDetails((v) => !v)}
                className="flex items-center gap-2 text-sky-600 hover:text-sky-800 font-semibold text-base transition-colors py-2"
              >
                {showDetails ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
                {showDetails ? "Ocultar detalhamento" : "Ver detalhamento completo"}
              </button>

              {showDetails && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  {/* Por Pessoa */}
                  <Card className="h-fit">
                    <h3 className="font-semibold text-base text-sky-900 mb-4">
                      Por Pessoa
                    </h3>
                    <div className="space-y-4">
                      {[...analytics.byCustomer]
                        .sort((a, b) =>
                          (a.customerAlias || "").localeCompare(b.customerAlias || "")
                        )
                        .map((item, index) => {
                          const order =
                            orders?.find(
                              (o) =>
                                getCustomerDisplayName(o) === item.customerAlias
                            ) ??
                            orders?.find(
                              (o) =>
                                o.isPaid === item.isPaid &&
                                Math.abs(o.total - item.total) < 0.01
                            );

                          return (
                            <div
                              key={index}
                              className="flex flex-col gap-2 pb-4 border-b border-sky-100 last:border-b-0 last:pb-0"
                            >
                              <div className="flex justify-between items-center gap-2">
                                <span className="text-base text-sky-900 font-medium flex-1 min-w-0">
                                  {item.customerAlias}
                                </span>
                                <div className="flex items-center gap-1">
                                  {order &&
                                    (isAdmin ||
                                      isCreator ||
                                      order.userId === user?.id) && (
                                      <IconButton
                                        size="sm"
                                        variant="secondary"
                                        icon={<Eye className="w-5 h-5" />}
                                        onClick={() => onViewOrder(order)}
                                        title="Ver pedido"
                                      />
                                    )}
                                  {order &&
                                    (isAdmin || order.userId === user?.id) && (
                                      <>
                                        <IconButton
                                          size="sm"
                                          variant={
                                            item.isPaid ? "success" : "secondary"
                                          }
                                          icon={<Upload className="w-5 h-5" />}
                                          onClick={() => onTogglePayment(order)}
                                          title={
                                            item.isPaid
                                              ? "Marcar como não pago"
                                              : "Enviar comprovante"
                                          }
                                        />
                                        <IconButton
                                          size="sm"
                                          variant="secondary"
                                          icon={<Edit className="w-4 h-4" />}
                                          onClick={() => onEditOrder(order)}
                                          title="Editar pedido"
                                        />
                                      </>
                                    )}
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <span
                                  className={`px-3 py-1 text-sm font-semibold rounded-full ${
                                    item.isPaid
                                      ? "bg-emerald-100 text-emerald-700"
                                      : "bg-red-100 text-red-600"
                                  }`}
                                >
                                  {item.isPaid ? "Pago" : "Pendente"}
                                </span>
                                <span className="font-bold text-sky-900 text-base">
                                  {formatCurrency(item.total)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </Card>

                  {/* Por Produto */}
                  <Card className="h-fit">
                    <h3 className="font-semibold text-base text-sky-900 mb-4">
                      Por Produto
                    </h3>
                    <div className="space-y-3">
                      {analytics.byProduct.map((item) => (
                        <div
                          key={item.productId}
                          className="flex justify-between items-center gap-3"
                        >
                          <span className="text-base text-sky-700 truncate flex-1 min-w-0">
                            {item.productName}
                          </span>
                          <span className="font-semibold text-sky-900 whitespace-nowrap flex-shrink-0">
                            {item.quantity} unidades
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              )}
            </>
          ) : (
            <Card>
              <p className="text-base text-sky-600">Nenhum dado disponível.</p>
            </Card>
          )}
        </section>
      )}

      {/* Perguntas e Respostas */}
      <section>
        <h2 className="text-xl font-bold text-sky-900 mb-2 flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-sky-100 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-sky-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
          </span>
          Perguntas e Respostas
        </h2>
        <p className="text-base text-sky-600 mb-4">
          Tem dúvidas? Pergunte aqui — o organizador vai responder em breve.
        </p>
        <CampaignChat campaignId={campaignId} isCreator={canEditCampaign} />
      </section>
    </div>
  );
}
