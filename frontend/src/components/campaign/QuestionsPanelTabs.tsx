import { MessageSquare, CheckCircle } from 'lucide-react';

interface QuestionsPanelTabsProps {
  activeTab: 'unanswered' | 'answered';
  onTabChange: (tab: 'unanswered' | 'answered') => void;
  unansweredCount: number;
  answeredCount: number;
}

/**
 * Tab navigation for Campaign Questions Panel
 * Mobile-first with touch-friendly targets
 */
export const QuestionsPanelTabs = ({
  activeTab,
  onTabChange,
  unansweredCount,
  answeredCount
}: QuestionsPanelTabsProps) => {
  return (
    <div className="flex w-full overflow-x-auto">
      <button
        onClick={() => onTabChange('unanswered')}
        className={`flex-1 px-4 md:px-6 py-3 font-medium border-b-2 transition-colors min-h-[48px] ${
          activeTab === 'unanswered'
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700'
        }`}
      >
        <div className="flex items-center justify-center gap-2">
          <MessageSquare className="w-5 h-5" />
          <span className="hidden sm:inline">Pendentes</span>
          <span className="sm:hidden">Pend.</span>
          {unansweredCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full min-w-[20px]">
              {unansweredCount}
            </span>
          )}
        </div>
      </button>
      <button
        onClick={() => onTabChange('answered')}
        className={`flex-1 px-4 md:px-6 py-3 font-medium border-b-2 transition-colors min-h-[48px] ${
          activeTab === 'answered'
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700'
        }`}
      >
        <div className="flex items-center justify-center gap-2">
          <CheckCircle className="w-5 h-5" />
          <span className="hidden sm:inline">Respondidas</span>
          <span className="sm:hidden">Resp.</span>
          <span className="text-gray-500">({answeredCount})</span>
        </div>
      </button>
    </div>
  );
};
