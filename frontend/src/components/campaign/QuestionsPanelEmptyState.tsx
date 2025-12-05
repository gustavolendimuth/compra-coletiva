import { CheckCircle, MessageSquare } from 'lucide-react';

interface QuestionsPanelEmptyStateProps {
  type: 'unanswered' | 'answered';
}

/**
 * Empty state for questions panel
 * Shows different messages for unanswered vs answered tabs
 */
export const QuestionsPanelEmptyState = ({ type }: QuestionsPanelEmptyStateProps) => {
  if (type === 'unanswered') {
    return (
      <div className="text-center text-gray-500 py-8 md:py-12">
        <CheckCircle className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 text-gray-300" />
        <p className="font-medium text-sm md:text-base">Nenhuma pergunta pendente</p>
        <p className="text-xs md:text-sm mt-1">Todas as perguntas foram respondidas!</p>
      </div>
    );
  }

  return (
    <div className="text-center text-gray-500 py-8 md:py-12">
      <MessageSquare className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 text-gray-300" />
      <p className="font-medium text-sm md:text-base">Nenhuma pergunta respondida ainda</p>
    </div>
  );
};
