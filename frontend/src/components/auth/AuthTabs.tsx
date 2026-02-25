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
    <div className="flex border-b border-sky-100">
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
        'flex-1 min-h-[44px] py-4 text-center font-semibold text-sm transition-colors',
        isActive
          ? 'text-sky-700 border-b-2 border-sky-500'
          : 'text-sky-400 hover:text-sky-600'
      )}
    >
      {label}
    </button>
  );
};

export default AuthTabs;
