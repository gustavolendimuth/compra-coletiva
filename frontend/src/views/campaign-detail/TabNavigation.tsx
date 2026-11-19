"use client";

import { useState, useEffect, useRef } from "react";
import {
  LucideIcon,
  LayoutDashboard,
  ShoppingBag,
  Package,
  Truck,
  MessagesSquare,
} from "lucide-react";

type TabType = "overview" | "products" | "orders" | "shipping" | "questions";

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  canEditCampaign: boolean;
}

export function TabNavigation({
  activeTab,
  onTabChange,
  canEditCampaign,
}: TabNavigationProps) {
  const [isSticky, setIsSticky] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const tabs: Array<{
    id: TabType;
    label: string;
    shortLabel: string;
    icon: LucideIcon;
  }> = [
    {
      id: "overview",
      label: "Visão Geral",
      shortLabel: "Geral",
      icon: LayoutDashboard,
    },
    {
      id: "orders",
      label: "Pedidos",
      shortLabel: "Pedidos",
      icon: ShoppingBag,
    },
    {
      id: "products",
      label: "Produtos",
      shortLabel: "Produtos",
      icon: Package,
    },
    { id: "shipping", label: "Frete", shortLabel: "Frete", icon: Truck },
  ];

  if (canEditCampaign) {
    tabs.push({
      id: "questions",
      label: "Moderar",
      shortLabel: "Moderar",
      icon: MessagesSquare,
    });
  }

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    // -97px: 96px navbar + 1px buffer so detection fires right as tabs reach navbar
    const observer = new IntersectionObserver(
      ([entry]) => setIsSticky(!entry.isIntersecting),
      { rootMargin: "-97px 0px 0px 0px", threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* Sentinel: tracked by IntersectionObserver to detect when tabs become sticky */}
      <div ref={sentinelRef} className="hidden md:block h-px" aria-hidden="true" />

      {/* Desktop Tabs */}
      <div
        className={`hidden md:flex gap-1 sticky top-24 z-40 py-3 mb-6 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 transition-all duration-200 ${
          isSticky
            ? "bg-[#fefdf8]/95 backdrop-blur-sm shadow-[0_2px_16px_-4px_rgba(14,165,233,0.15),0_1px_0_0_rgba(186,230,253,0.7)]"
            : "border-b border-sky-100"
        }`}
      >
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-150 ${
              activeTab === id
                ? "bg-sky-600 text-white shadow-sm shadow-sky-300/40"
                : "text-sky-800 hover:bg-sky-100 hover:text-sky-900"
            }`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Mobile Tabs */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-sky-800 border-t border-sky-700/50 shadow-lg z-50">
        <div className="flex">
          {tabs.map(({ id, shortLabel, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex flex-col items-center justify-center flex-1 py-2 px-1 transition-colors ${
                activeTab === id
                  ? "text-amber-300 font-bold border-t-2 border-amber-300 -mt-px"
                  : "text-white/70 hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0 mb-0.5" />
              <span className="text-xs font-medium">{shortLabel}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
