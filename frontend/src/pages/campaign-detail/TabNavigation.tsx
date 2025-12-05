import { TrendingUp, ShoppingBag, Package, Truck, MessagesSquare } from 'lucide-react';

type TabType = 'overview' | 'products' | 'orders' | 'shipping' | 'questions';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  canEditCampaign: boolean;
}

export function TabNavigation({ activeTab, onTabChange, canEditCampaign }: TabNavigationProps) {
  const tabs = [
    { id: 'overview' as const, label: 'Visão Geral', shortLabel: 'Geral', icon: TrendingUp },
    { id: 'orders' as const, label: 'Pedidos', shortLabel: 'Pedidos', icon: ShoppingBag },
    { id: 'products' as const, label: 'Produtos', shortLabel: 'Produtos', icon: Package },
    { id: 'shipping' as const, label: 'Frete', shortLabel: 'Frete', icon: Truck },
  ];

  if (canEditCampaign) {
    tabs.push({ id: 'questions' as const, label: 'Moderar', shortLabel: 'Moderar', icon: MessagesSquare });
  }

  return (
    <>
      {/* Desktop Tabs */}
      <div className="hidden md:flex gap-1 mb-6 border-b">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`flex items-center justify-center gap-2 px-3 py-2 font-medium transition-colors flex-1 md:flex-initial rounded-t-lg ${
              activeTab === id
                ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border-b-2 border-transparent'
            }`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Mobile Tabs */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-primary-600 border-t-2 border-primary-700 shadow-lg z-50">
        <div className="flex">
          {tabs.map(({ id, shortLabel, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex flex-col items-center justify-center flex-1 py-2 px-1 transition-colors ${
                activeTab === id
                  ? 'text-yellow-300 font-bold border-b-4 border-yellow-300'
                  : 'text-white hover:text-yellow-200'
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
