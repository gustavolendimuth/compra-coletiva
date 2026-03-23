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
  const tabs: Array<{
    id: TabType;
    label: string;
    shortLabel: string;
    icon: LucideIcon;
  }> = [
    {
      id: "overview",
      label: "Visao Geral",
      shortLabel: "Inicio",
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
      <div className="hidden md:flex gap-1 mb-8 bg-white rounded-2xl border border-sky-100/80 p-1.5 shadow-sm">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`flex items-center justify-center gap-2.5 px-5 py-3 font-medium transition-all duration-200 flex-1 rounded-xl text-base ${
              activeTab === id
                ? "text-white bg-sky-600 shadow-md shadow-sky-200/50"
                : "text-sky-700/60 hover:text-sky-900 hover:bg-sky-50"
            }`}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Mobile Bottom Tabs - Larger, clearer */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-sky-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-50">
        <div className="flex">
          {tabs.map(({ id, shortLabel, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex flex-col items-center justify-center flex-1 py-2.5 px-1 transition-all duration-200 min-h-[60px] ${
                activeTab === id
                  ? "text-sky-600 bg-sky-50"
                  : "text-sky-400 hover:text-sky-600 active:bg-sky-50"
              }`}
            >
              <div
                className={`p-1 rounded-lg mb-0.5 transition-colors ${
                  activeTab === id ? "bg-sky-100" : ""
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
              </div>
              <span
                className={`text-xs font-medium leading-tight ${
                  activeTab === id ? "font-bold" : ""
                }`}
              >
                {shortLabel}
              </span>
            </button>
          ))}
        </div>
        {/* Safe area for devices with home indicator */}
        <div className="h-[env(safe-area-inset-bottom,0px)]" />
      </div>
    </>
  );
}
