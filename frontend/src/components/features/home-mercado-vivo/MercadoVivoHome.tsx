"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Menu, Search, ShoppingBag, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getImageUrl } from "@/lib/imageUrl";
import { MercadoVivoSections } from "./MercadoVivoSections";
import { useMercadoVivoHomeData } from "./useMercadoVivoHomeData";
import {
  formatCampaignDistance,
  formatCompactNumber,
  getCampaignEmoji,
  getDeadlineLabel,
  sanitizeDescription,
  sanitizeInlineText,
} from "./utils";
import styles from "./MercadoVivoHome.module.css";

export function MercadoVivoHome() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();
  const { data } = useMercadoVivoHomeData();

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const floatingCampaigns = data?.activeCampaigns.slice(0, 2) ?? [];
  const latestCompleted = data?.latestCompletedCampaign;

  return (
    <div className="grain bg-cream-50 text-sky-900">
      <nav className={`${styles.navbar} fixed top-0 left-0 right-0 z-50 ${isScrolled ? styles.navbarScrolled : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center shadow-lg shadow-sky-200/50 group-hover:shadow-sky-300/60 transition-shadow">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <span className="font-display text-xl font-bold text-sky-900 tracking-tight">Compra Coletiva</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#campanhas" className="text-sm font-medium text-sky-800/70 hover:text-sky-900 transition-colors">Campanhas</a>
            <a href="#como-funciona" className="text-sm font-medium text-sky-800/70 hover:text-sky-900 transition-colors">Como funciona</a>
            <a href="#comunidade" className="text-sm font-medium text-sky-800/70 hover:text-sky-900 transition-colors">Comunidade</a>
            <div className="h-5 w-px bg-sky-200" />
            {isLoading ? (
              <div className="h-5 w-20 rounded bg-sky-100/70 animate-pulse" />
            ) : isAuthenticated ? (
              <Link href="/perfil" className="text-sm font-medium text-sky-800/70 hover:text-sky-900 transition-colors">Meu perfil</Link>
            ) : (
              <button onClick={() => window.dispatchEvent(new CustomEvent("openAuthModal", { detail: { tab: "login" } }))} className="text-sm font-medium text-sky-800/70 hover:text-sky-900 transition-colors">
                Entrar
              </button>
            )}
            <Link href="/campanhas" className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-sky-600 text-white text-sm font-semibold rounded-full shadow-lg shadow-sky-300/40 hover:shadow-sky-400/50 hover:from-sky-600 hover:to-sky-700 transition-all">
              Criar campanha
            </Link>
          </div>

          <Link href="/campanhas" className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl hover:bg-sky-50 transition-colors" aria-label="Abrir campanhas">
            <Menu className="w-5 h-5 text-sky-800" />
          </Link>
        </div>
      </nav>

      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        <div className="blob-1 -top-40 -right-40" />
        <div className="blob-2 top-1/3 -left-60" />

        <div className="max-w-7xl mx-auto px-5 sm:px-8 w-full relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            <div className="max-w-xl">
              <div className={`${styles.reveal} ${styles.revealD1} inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100/80 border border-amber-200/60 mb-8`}>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-sm font-medium text-amber-800">{formatCompactNumber(data?.activeCampaignsTotal ?? 0)} campanhas ativas na sua regiao</span>
              </div>

              <h1 className={`${styles.reveal} ${styles.revealD2} font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-sky-950 leading-[1.08] tracking-tight mb-6`}>
                Compre <span className="hand-underline">junto</span>,<br />
                pague <span className="text-terracotta-500">menos</span>.
              </h1>

              <p className={`${styles.reveal} ${styles.revealD3} text-lg sm:text-xl text-sky-800/60 leading-relaxed mb-10 max-w-md font-light`}>
                Junte-se a vizinhanca e economize comprando em grupo. Produtos frescos, direto do produtor, com preco justo para todos.
              </p>

              <div className={`${styles.reveal} ${styles.revealD4} flex flex-col sm:flex-row gap-4`}>
                <Link href="/campanhas" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-sky-500 to-sky-600 text-white font-semibold rounded-2xl shadow-xl shadow-sky-300/30 hover:shadow-sky-400/40 hover:from-sky-600 hover:to-sky-700 transition-all text-base">
                  <Search className="w-5 h-5" />
                  Explorar campanhas
                </Link>
                <a href="#como-funciona" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/70 border border-sky-200/60 text-sky-800 font-semibold rounded-2xl hover:bg-white hover:border-sky-300 transition-all text-base">
                  Como funciona
                </a>
              </div>

              <div className={`${styles.reveal} ${styles.revealD5} mt-12 flex items-center gap-6 text-sm text-sky-700/50`}>
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 border-2 border-cream-50 flex items-center justify-center text-xs font-bold text-white">A</div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-300 to-sky-500 border-2 border-cream-50 flex items-center justify-center text-xs font-bold text-white">M</div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-terracotta-400 to-terracotta-600 border-2 border-cream-50 flex items-center justify-center text-xs font-bold text-white">J</div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-300 to-emerald-500 border-2 border-cream-50 flex items-center justify-center text-xs font-bold text-white">+</div>
                </div>
                <span>+{formatCompactNumber(data?.totalOrdersSample ?? 0)} pedidos ja organizados</span>
              </div>
            </div>

            <div className="relative hidden lg:block h-[540px]">
              {floatingCampaigns.map((campaign, index) => {
                const imageUrl = getImageUrl(campaign.imageUrl);
                const cardClass = ["top-4 right-8 w-72", "top-48 left-0 w-64"][index] ?? "top-4 right-8 w-72";
                const imageClass = ["h-40", "h-36"][index] ?? "h-40";
                const delayClass = index === 0 ? "" : styles.floatCardDelay;

                return (
                  <article key={campaign.id} className={`${styles.floatCard} ${delayClass} absolute ${cardClass} bg-white rounded-3xl shadow-xl shadow-sky-100/50 border border-sky-100/40 overflow-hidden`}>
                    <div className={`${imageClass} bg-gradient-to-br from-amber-100 via-amber-50 to-sky-50 flex items-center justify-center`}>
                      {imageUrl ? (
                        <img src={imageUrl} alt={campaign.name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                      ) : (
                        <span className="text-6xl">{getCampaignEmoji(index)}</span>
                      )}
                    </div>
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">Ativa</span>
                        <span className="text-xs text-sky-500/50">{getDeadlineLabel(campaign.deadline)}</span>
                      </div>
                      <h3 className="font-display font-bold text-sky-900 text-lg" dangerouslySetInnerHTML={{ __html: sanitizeInlineText(campaign.name, "Campanha local") }} />
                      <p className="text-sm text-sky-700/50 mt-1 mb-3" dangerouslySetInnerHTML={{ __html: sanitizeDescription(campaign.description, "Produtos frescos com entrega coletiva.") }} />
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-sky-600 font-semibold">{formatCampaignDistance(campaign)}</span>
                        <span className="inline-flex items-center gap-1 text-sm text-amber-600">
                          <Users className="w-4 h-4" />
                          <strong>{formatCompactNumber(campaign._count?.orders ?? 0)} pedidos</strong>
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}

              <div className={`${styles.floatCard} ${styles.floatCardDelay2} absolute bottom-12 right-16 w-80 bg-white rounded-2xl shadow-xl shadow-sky-100/50 border border-sky-100/40 p-4 flex items-center gap-4`}>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-sky-900">Atualizacao recente</p>
                  <p className="text-xs text-sky-700/50 mt-0.5" dangerouslySetInnerHTML={{ __html: sanitizeInlineText(latestCompleted?.name, "Nova atividade na comunidade") }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 ${styles.scrollIndicator}`}>
          <div className="w-6 h-10 rounded-full border-2 border-sky-300/50 flex justify-center pt-2">
            <div className="w-1 h-2.5 rounded-full bg-sky-400/60" />
          </div>
        </div>
      </section>

      <div className="wave-divider">
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none">
          <path d="M0,50 C360,10 720,80 1440,30 L1440,80 L0,80 Z" fill="#f0f9ff" />
        </svg>
      </div>

      <MercadoVivoSections data={data} />
    </div>
  );
}
