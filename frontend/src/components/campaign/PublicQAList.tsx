import { MessageCircle } from 'lucide-react';
import { CampaignMessage } from '@/api';
import { PublicQAItem } from './PublicQAItem';

interface PublicQAListProps {
  messages: CampaignMessage[];
  total: number;
  isLoading: boolean;
}

/**
 * List of public Q&As
 * Shows all answered questions in scrollable container
 */
export const PublicQAList = ({ messages, total, isLoading }: PublicQAListProps) => {
  return (
    <div className="bg-white border rounded-lg">
      <div className="p-3 md:p-4 border-b bg-gray-50">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm md:text-base">
          <MessageCircle className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
          Perguntas e Respostas ({total})
        </h3>
      </div>

      <div className="p-3 md:p-4 space-y-4 max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="text-center text-gray-500 py-8">Carregando...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <MessageCircle className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 text-gray-300" />
            <p className="font-medium text-sm md:text-base">
              Nenhuma pergunta respondida ainda
            </p>
            <p className="text-xs md:text-sm mt-1">Seja o primeiro a perguntar!</p>
          </div>
        ) : (
          messages.map((msg) => <PublicQAItem key={msg.id} message={msg} />)
        )}
      </div>
    </div>
  );
};
