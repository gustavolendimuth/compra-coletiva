import {
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
  const tabs: Array<{
    id: TabType;
    label: string;
    shortLabel: string;
    icon: any;
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

  return (
    <>
      {/* Desktop Tabs */}
      <div className="hidden md:flex gap-1 mb-6 border-b border-sky-100">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`flex items-center justify-center gap-2 px-3 py-2 font-medium transition-colors flex-1 md:flex-initial rounded-t-xl ${
              activeTab === id
                ? "text-sky-600 border-b-2 border-sky-500 bg-sky-50/70"
                : "text-sky-700/50 hover:text-sky-900 hover:bg-sky-50/50 border-b-2 border-transparent"
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
