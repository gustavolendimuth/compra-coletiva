"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import {
  Bell,
  CreditCard,
  MapPin,
  MessageCircle,
  Search,
  ShieldCheck,
  ShoppingBag,
  Truck,
  Users,
} from "lucide-react";
import { getImageUrl } from "@/lib/imageUrl";
import type { MercadoVivoHomeData } from "./useMercadoVivoHomeData";
import {
  formatCampaignDistance,
  formatCompactNumber,
  getCampaignEmoji,
  getDeadlineLabel,
  sanitizeDescription,
  sanitizeInlineText,
} from "./utils";
import styles from "./MercadoVivoHome.module.css";
import { MercadoVivoFooter } from "./MercadoVivoFooter";

interface MercadoVivoSectionsProps {
  data: MercadoVivoHomeData | undefined;
}

const campaignBackgrounds = [
  "from-amber-100 via-amber-50 to-sky-50",
  "from-sky-100 via-sky-50 to-emerald-50",
  "from-terracotta-400/20 via-amber-50 to-cream-100",
];

const featureCards = [
  {
    title: "Busca por proximidade",
    description: "Encontre campanhas perto de voce com dados de retirada e bairro.",
    icon: MapPin,
    tone: "from-sky-100 to-sky-200 text-sky-600",
  },
  {
    title: "Chat em tempo real",
    description: "Converse com organizadores e participantes sem sair da campanha.",
    icon: MessageCircle,
    tone: "from-amber-100 to-amber-200 text-amber-600",
  },
  {
    title: "Frete dividido",
    description: "Rateio automatico de frete entre os pedidos de cada campanha.",
    icon: Truck,
    tone: "from-emerald-100 to-emerald-200 text-emerald-600",
  },
  {
    title: "Pagamento via PIX",
    description: "Fluxo de pagamento rapido para fechar os pedidos da comunidade.",
    icon: CreditCard,
    tone: "from-red-100 to-red-200 text-red-600",
  },
  {
    title: "Notificacoes",
    description: "Avisos de prazo e atualizacoes para voce nao perder nenhuma campanha.",
    icon: Bell,
    tone: "from-rose-100 to-rose-200 text-rose-600",
  },
  {
    title: "Seguro e confiavel",
    description: "Historico e status das campanhas com transparencia para todos.",
    icon: ShieldCheck,
    tone: "from-terracotta-400/20 to-terracotta-400/30 text-terracotta-500",
  },
];

export function MercadoVivoSections({ data }: MercadoVivoSectionsProps) {
  const featuredCampaigns = data?.featuredCampaigns ?? [];

  return (
    <>
      <section id="como-funciona" className="py-20 sm:py-28 bg-sky-50/50 relative">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-sky-100 text-sky-700 text-sm font-semibold rounded-full mb-4">Simples assim</span>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-sky-950 tracking-tight">Como funciona?</h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { title: "Encontre", description: "Descubra campanhas ativas no seu bairro.", icon: Search, tone: "from-amber-200 to-amber-400" },
              { title: "Participe", description: "Faca seu pedido e junte-se ao grupo.", icon: Users, tone: "from-sky-300 to-sky-500" },
              { title: "Economize", description: "Compre junto e pague menos no frete e produtos.", icon: ShoppingBag, tone: "from-terracotta-400 to-terracotta-600" },
            ].map((step, index) => {
              const Icon = step.icon;

              return (
                <article key={step.title} className="relative bg-white rounded-3xl p-8 shadow-sm border border-sky-100/50 text-center group hover:shadow-md transition-all">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.tone} mx-auto mb-5 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="absolute top-6 left-6 w-7 h-7 rounded-full bg-sky-100 flex items-center justify-center">
                    <span className="font-display font-bold text-sky-600 text-sm">{index + 1}</span>
                  </div>
                  <h3 className="font-display font-bold text-sky-900 text-lg mb-2">{step.title}</h3>
                  <p className="text-sm text-sky-700/50 leading-relaxed">{step.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="campanhas" className="py-20 sm:py-28 relative">
        <div className="blob-2 -bottom-40 -right-40 opacity-50" />
        <div className="max-w-7xl mx-auto px-5 sm:px-8 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-12 gap-4">
            <div>
              <span className="inline-block px-4 py-1.5 bg-amber-100 text-amber-700 text-sm font-semibold rounded-full mb-4">Destaque</span>
              <h2 className="font-display text-4xl sm:text-5xl font-bold text-sky-950 tracking-tight">Campanhas populares</h2>
            </div>
            <Link href="/campanhas" className="inline-flex items-center gap-2 text-sky-600 font-semibold hover:text-sky-700 transition-colors">
              Ver todas
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCampaigns.length === 0 && (
              <div className="sm:col-span-2 lg:col-span-3 rounded-3xl border border-sky-100/50 bg-white p-10 text-center">
                <h3 className="font-display text-2xl text-sky-900">Nenhuma campanha ativa agora</h3>
                <p className="mt-2 text-sky-700/60">Assim que uma campanha for aberta, ela aparece aqui automaticamente.</p>
              </div>
            )}

            {featuredCampaigns.map((campaign, index) => {
              const imageUrl = getImageUrl(campaign.imageUrl);
              const cardBg = campaignBackgrounds[index % campaignBackgrounds.length] ?? campaignBackgrounds[0];

              return (
                <Link key={campaign.id} href={`/campanhas/${campaign.slug}`} className={`${styles.campaignCard} bg-white rounded-3xl overflow-hidden border border-sky-100/50 shadow-sm block`}>
                  <div className={`h-48 bg-gradient-to-br ${cardBg} flex items-center justify-center relative overflow-hidden`}>
                    {imageUrl ? (
                      <img src={imageUrl} alt={campaign.name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                    ) : (
                      <span className="text-7xl">{getCampaignEmoji(index)}</span>
                    )}
                    <span className="absolute top-4 left-4 px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full shadow-sm">Ativa</span>
                    <span className="absolute top-4 right-4 px-3 py-1 bg-white/90 text-sky-700 text-xs font-semibold rounded-full backdrop-blur-sm">{formatCampaignDistance(campaign)}</span>
                  </div>
                  <div className="p-6">
                    <h3
                      className="font-display font-bold text-sky-900 text-xl mb-1"
                      dangerouslySetInnerHTML={{ __html: sanitizeInlineText(campaign.name, "Campanha local") }}
                    />
                    <p
                      className="text-sm text-sky-700/50 mb-4"
                      dangerouslySetInnerHTML={{
                        __html: sanitizeDescription(
                          campaign.description,
                          "Campanha comunitaria com produtos selecionados para o bairro."
                        ),
                      }}
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-sky-700/40 font-medium">+{formatCompactNumber(campaign._count?.orders ?? 0)} pedidos</span>
                      <span className="text-xs text-amber-600 font-semibold bg-amber-50 px-2.5 py-1 rounded-full">{getDeadlineLabel(campaign.deadline)}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section id="comunidade" className="py-16 bg-gradient-to-r from-sky-500 via-sky-600 to-sky-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:24px_24px]" />
        <div className="max-w-7xl mx-auto px-5 sm:px-8 relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center text-white">
            <div>
              <div className="font-display text-4xl sm:text-5xl font-bold mb-1">{formatCompactNumber(data?.totalOrdersSample ?? 0)}</div>
              <div className="text-sky-100/80 text-sm font-medium">Pedidos registrados</div>
            </div>
            <div>
              <div className="font-display text-4xl sm:text-5xl font-bold mb-1">{formatCompactNumber(data?.allCampaignsTotal ?? 0)}</div>
              <div className="text-sky-100/80 text-sm font-medium">Campanhas totais</div>
            </div>
            <div>
              <div className="font-display text-4xl sm:text-5xl font-bold mb-1">{formatCompactNumber(data?.completedCampaignsTotal ?? 0)}</div>
              <div className="text-sky-100/80 text-sm font-medium">Campanhas concluidas</div>
            </div>
            <div>
              <div className="font-display text-4xl sm:text-5xl font-bold mb-1">{formatCompactNumber(data?.totalProductsSample ?? 0)}</div>
              <div className="text-sky-100/80 text-sm font-medium">Produtos catalogados</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28 bg-cream-50 relative">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-terracotta-400/10 text-terracotta-500 text-sm font-semibold rounded-full mb-4">Recursos</span>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-sky-950 tracking-tight mb-4">Tudo para comprar melhor</h2>
            <p className="text-sky-700/50 max-w-lg mx-auto">Ferramentas que facilitam a organizacao de compras coletivas no seu bairro.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featureCards.map((feature) => {
              const Icon = feature.icon;

              return (
                <article key={feature.title} className="bg-white rounded-3xl p-7 border border-sky-100/50 shadow-sm hover:shadow-md transition-shadow group">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.tone} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-display font-bold text-sky-900 text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm text-sky-700/50 leading-relaxed">{feature.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28 relative overflow-hidden">
        <div className="blob-1 top-0 left-1/4" />
        <div className="max-w-4xl mx-auto px-5 sm:px-8 text-center relative z-10">
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-sky-950 tracking-tight mb-6">Pronto para economizar com a vizinhanca?</h2>
          <p className="text-lg text-sky-700/50 max-w-lg mx-auto mb-10">Cadastre-se gratuitamente e comece a participar de campanhas de compra coletiva hoje mesmo.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => window.dispatchEvent(new CustomEvent("openAuthModal", { detail: { tab: "register" } }))} className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-gradient-to-r from-sky-500 to-sky-600 text-white font-semibold rounded-2xl shadow-xl shadow-sky-300/30 hover:shadow-sky-400/40 hover:from-sky-600 hover:to-sky-700 transition-all text-lg">
              Criar conta gratuita
            </button>
            <Link href="/campanhas" className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-amber-100 text-amber-800 font-semibold rounded-2xl hover:bg-amber-200 transition-all text-lg">
              Criar uma campanha
            </Link>
          </div>
        </div>
      </section>

      <MercadoVivoFooter />
    </>
  );
}
