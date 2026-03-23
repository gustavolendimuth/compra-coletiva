import { useState } from "react";
import { Card, PixDisplay, PaymentPendingNotice } from "@/components/ui";
import IconButton from "@/components/IconButton";
import { CampaignChat } from "@/components/campaign";
import { Skeleton } from "@/components/Skeleton";
import { formatCurrency } from "@/lib/utils";
import { getImageUrl } from "@/lib/imageUrl";
import { Order, Product, CampaignAnalytics, Campaign } from "@/api";
import { useAuth } from "@/contexts/AuthContext";
import { CampaignLocationSection } from "../CampaignLocationSection";
import { getCustomerDisplayName } from "../utils";
import { Edit, Eye, LogIn, Upload, ShoppingBag, Users, Hash, CreditCard, Truck as TruckIcon, TrendingUp, TrendingDown, MessageCircle } from "lucide-react";
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
      <div className="w-full aspect-square rounded-2xl bg-cream-100 border border-sky-100 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-sky-300"
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
    <div className="w-full aspect-square rounded-2xl overflow-hidden bg-sky-50 border border-sky-100">
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

/* ---------- Section wrapper for visual rhythm ---------- */
function Section({
  title,
  icon,
  iconBg = "bg-sky-100",
  iconColor = "text-sky-600",
  children,
  className = "",
}: {
  title: string;
  icon: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`space-y-4 ${className}`}>
      <h2 className="font-display text-xl md:text-2xl font-bold text-sky-900 flex items-center gap-3">
        <span
          className={`w-9 h-9 md:w-10 md:h-10 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}
        >
          <span className={iconColor}>{icon}</span>
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

/* ---------- Stat card for financial summary ---------- */
function StatCard({
  label,
  value,
  icon,
  accent = false,
  negative = false,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: boolean;
  negative?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-sky-100/60 p-4 md:p-5">
      <div className="flex items-center gap-2.5 mb-2">
        <span className="flex-shrink-0">{icon}</span>
        <span className="text-sm md:text-base text-sky-600 font-medium">{label}</span>
      </div>
      <div
        className={`text-xl md:text-2xl font-bold ${
          accent
            ? "text-emerald-600"
            : negative
              ? "text-red-500"
              : "text-sky-900"
        }`}
      >
        {value}
      </div>
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

  const userOrder = user ? orders.find((o) => o.userId === user.id) : undefined;

  const isAdmin = user?.role === "ADMIN";
  const isCreator = campaign.creatorId === user?.id;

  const paymentReleaseTrigger = getPaymentReleaseTrigger(
    campaign.paymentReleaseTrigger,
    campaign.pixVisibleAtStatus
  );
  const hasUserOrder = userOrder !== undefined;
  const shouldShowPix = canShowPixToBuyer(campaign, hasUserOrder);
  const shouldShowPaymentPending = canShowPaymentPendingNotice(
    campaign,
    hasUserOrder
  );
  const hasPixConfigured = Boolean(
    campaign.pixKey && campaign.pixType && campaign.status !== "ARCHIVED"
  );
  const shouldShowPixLoginNotice = !user && hasPixConfigured;

  return (
    <div className="space-y-8 md:space-y-10 pb-24 md:pb-4">
      {/* ========== Location ========== */}
      {(campaign.pickupAddress || canEditCampaign) && (
        <CampaignLocationSection
          campaign={campaign}
          canEditCampaign={canEditCampaign}
          onEditAddress={onEditAddress}
        />
      )}

      {/* ========== PIX Payment ========== */}
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
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-emerald-50 to-green-100 border-2 border-emerald-200 rounded-2xl p-5 md:p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center">
              <LogIn className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center bg-emerald-600 text-white px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase">
                  PIX
                </span>
              </div>
              <p className="text-base font-semibold text-emerald-900 mb-1">
                Esta campanha possui pagamento via PIX
              </p>
              <p className="text-sm text-emerald-700/80 leading-relaxed mb-4">
                Faca login ou crie uma conta para ver os dados de pagamento e
                participar da campanha.
              </p>
              <button
                onClick={() => requireAuth(() => {})}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-base font-medium px-6 py-3 rounded-xl transition-colors min-h-[48px]"
              >
                <LogIn className="w-5 h-5" />
                Fazer login
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== Products ========== */}
      {products && products.length > 0 && (
        <Section
          title="Produtos Disponiveis"
          icon={<ShoppingBag className="w-5 h-5" />}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        >
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {products
              .slice()
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((product) => (
                <div
                  key={product.id}
                  className="bg-white border border-sky-100/60 rounded-2xl p-3 md:p-4 hover:border-sky-200 hover:shadow-md hover:shadow-sky-100/40 transition-all duration-200 flex flex-col"
                >
                  <div className="mb-3">
                    <ProductImage product={product} />
                  </div>

                  <h4 className="font-semibold text-sky-900 mb-2 line-clamp-2 text-sm md:text-base leading-snug min-h-[2.5rem] md:min-h-[3rem]">
                    {product.name}
                  </h4>

                  <div className="mt-auto space-y-2.5">
                    <span className="block text-lg md:text-xl font-bold text-sky-800">
                      {formatCurrency(product.price)}
                    </span>

                    {isActive && (
                      <button
                        onClick={() => onAddToOrder(product)}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 text-base min-h-[48px] shadow-sm shadow-emerald-200/40 hover:shadow-md hover:shadow-emerald-200/50"
                      >
                        Pedir
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </Section>
      )}

      {/* ========== Financial Summary ========== */}
      <Section
        title="Resumo Financeiro"
        icon={<CreditCard className="w-5 h-5" />}
        iconBg="bg-emerald-50"
        iconColor="text-emerald-600"
      >
        {isAnalyticsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl border border-sky-100/60 p-4 md:p-5"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-7 w-20" />
              </div>
            ))}
          </div>
        ) : analytics ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard
              label="Pessoas"
              value={analytics.byCustomer.length}
              icon={<Users className="w-5 h-5 text-sky-500" />}
            />
            <StatCard
              label="Itens"
              value={analytics.totalQuantity}
              icon={<Hash className="w-5 h-5 text-sky-500" />}
            />
            <StatCard
              label="Sem Frete"
              value={formatCurrency(analytics.totalWithoutShipping)}
              icon={<ShoppingBag className="w-5 h-5 text-sky-500" />}
            />
            <StatCard
              label="Com Frete"
              value={formatCurrency(analytics.totalWithShipping)}
              icon={<TruckIcon className="w-5 h-5 text-sky-500" />}
            />
            <StatCard
              label="Pago"
              value={formatCurrency(analytics.totalPaid)}
              icon={<TrendingUp className="w-5 h-5 text-emerald-500" />}
              accent
            />
            <StatCard
              label="Pendente"
              value={formatCurrency(analytics.totalUnpaid)}
              icon={<TrendingDown className="w-5 h-5 text-red-400" />}
              negative
            />
          </div>
        ) : (
          <Card>
            <p className="text-base text-sky-600">
              Nenhum dado financeiro disponivel.
            </p>
          </Card>
        )}
      </Section>

      {/* ========== Breakdown by Customer & Product ========== */}
      <Section
        title="Detalhamento"
        icon={
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        }
      >
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
            {/* By Customer */}
            <Card className="h-fit">
              <h4 className="font-semibold text-base md:text-lg mb-4 text-sky-900 flex items-center gap-2.5">
                <Users className="w-5 h-5 text-sky-500" />
                Por Pessoa
              </h4>
              <div className="space-y-4">
                {[...analytics.byCustomer]
                  .sort((a, b) =>
                    (a.customerAlias || "").localeCompare(
                      b.customerAlias || ""
                    )
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
                        className="pb-4 border-b border-sky-100 last:border-b-0 last:pb-0"
                      >
                        {/* Name row */}
                        <div className="flex justify-between items-center gap-3 mb-2">
                          <span className="text-sky-900 font-semibold text-base flex-1 min-w-0">
                            {item.customerAlias}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {order &&
                              (isAdmin ||
                                isCreator ||
                                order.userId === user?.id) && (
                                <IconButton
                                  size="sm"
                                  variant="secondary"
                                  icon={<Eye className="w-5 h-5" />}
                                  onClick={() => onViewOrder(order)}
                                  title="Visualizar pedido"
                                  className="min-w-[44px] min-h-[44px]"
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
                                        ? "Marcar como nao pago"
                                        : "Enviar comprovante"
                                    }
                                    className="min-w-[44px] min-h-[44px]"
                                  />
                                  <IconButton
                                    size="sm"
                                    variant="secondary"
                                    icon={<Edit className="w-4 h-4" />}
                                    onClick={() => onEditOrder(order)}
                                    title="Editar pedido"
                                    className="min-w-[44px] min-h-[44px]"
                                  />
                                </>
                              )}
                          </div>
                        </div>

                        {/* Status + Total row */}
                        <div className="flex items-center justify-between gap-3">
                          <span
                            className={`px-3 py-1.5 text-sm font-semibold rounded-full whitespace-nowrap ${
                              item.isPaid
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-red-50 text-red-600"
                            }`}
                          >
                            {item.isPaid ? "Pago" : "Pendente"}
                          </span>
                          <span className="font-bold text-lg text-sky-900 whitespace-nowrap">
                            {formatCurrency(item.total)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </Card>

            {/* By Product */}
            <Card className="h-fit">
              <h4 className="font-semibold text-base md:text-lg mb-4 text-sky-900 flex items-center gap-2.5">
                <ShoppingBag className="w-5 h-5 text-amber-500" />
                Por Produto
              </h4>
              <div className="space-y-3">
                {analytics.byProduct.map((item) => (
                  <div
                    key={item.productId}
                    className="flex justify-between items-center gap-3 py-2 border-b border-sky-50 last:border-b-0"
                  >
                    <span className="text-sky-800 text-base flex-1 min-w-0 truncate">
                      {item.productName}
                    </span>
                    <span className="font-semibold text-sky-900 whitespace-nowrap text-base flex-shrink-0">
                      {item.quantity}{" "}
                      <span className="text-sky-500 font-normal">un.</span>
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        ) : (
          <Card>
            <p className="text-base text-sky-600">
              Nenhum dado de detalhamento disponivel.
            </p>
          </Card>
        )}
      </Section>

      {/* ========== Q&A Section ========== */}
      <Section
        title="Perguntas e Respostas"
        icon={<MessageCircle className="w-5 h-5" />}
      >
        <p className="text-sky-600 text-base -mt-2 mb-2">
          Tire suas duvidas sobre os produtos e a campanha.
        </p>
        <CampaignChat campaignId={campaignId} isCreator={canEditCampaign} />
      </Section>
    </div>
  );
}
