import { cn } from '@/lib/utils';

type TabType = 'login' | 'register';

interface AuthTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

/**
 * AuthTabs Component
 *
 * Tab navigation for login/register forms.
 * Mobile-first with touch-friendly targets.
 * Follows design system colors.
 */
export const AuthTabs = ({ activeTab, onTabChange }: AuthTabsProps) => {
  return (
    <div className="flex border-b border-gray-200">
      <Tab
        label="Entrar"
        isActive={activeTab === 'login'}
        onClick={() => onTabChange('login')}
      />
      <Tab
        label="Criar Conta"
        isActive={activeTab === 'register'}
        onClick={() => onTabChange('register')}
      />
    </div>
  );
};

interface TabProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const Tab = ({ label, isActive, onClick }: TabProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex-1 min-h-[44px] py-4 text-center font-medium transition-colors', // Touch-friendly
        isActive
          ? 'text-blue-600 border-b-2 border-blue-600'
          : 'text-gray-500 hover:text-gray-700'
      )}
    >
      {label}
    </button>
  );
};

export default AuthTabs;
