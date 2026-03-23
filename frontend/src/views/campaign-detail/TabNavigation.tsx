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
    icon: LucideIcon;
  }> = [
    { id: "overview", label: "Geral", icon: LayoutDashboard },
    { id: "orders", label: "Pedidos", icon: ShoppingBag },
    { id: "products", label: "Produtos", icon: Package },
    { id: "shipping", label: "Frete", icon: Truck },
  ];

  if (canEditCampaign) {
    tabs.push({ id: "questions", label: "Moderar", icon: MessagesSquare });
  }

  return (
    <>
      {/* Desktop Tabs */}
      <div className="hidden md:flex gap-1 mb-8 border-b-2 border-sky-100">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`flex items-center gap-2 px-5 py-3 font-semibold text-base transition-colors rounded-t-xl ${
              activeTab === id
                ? "text-sky-700 border-b-2 border-sky-600 bg-sky-50 -mb-px"
                : "text-sky-500 hover:text-sky-800 hover:bg-sky-50/60 border-b-2 border-transparent -mb-px"
            }`}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Mobile Bottom Tab Bar — fundo claro para maior legibilidade */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-sky-100 shadow-lg z-50">
        <div className="flex">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex flex-col items-center justify-center flex-1 py-3 px-1 transition-colors ${
                activeTab === id
                  ? "text-sky-700 font-bold border-t-2 border-sky-600 -mt-px bg-sky-50"
                  : "text-sky-400 hover:text-sky-700 border-t-2 border-transparent -mt-px"
              }`}
            >
              <Icon className="w-6 h-6 flex-shrink-0 mb-1" />
              <span className="text-xs font-semibold">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
