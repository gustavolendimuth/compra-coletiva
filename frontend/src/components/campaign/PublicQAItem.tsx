import { CheckCircle } from 'lucide-react';
import { CampaignMessage } from '@/api';
import { sanitizeText } from '@/lib/sanitize';
import { formatTimeAgo } from './chatUtils';

interface PublicQAItemProps {
  message: CampaignMessage;
}

/**
 * Public Q&A display card
 * Shows question and answer in user-facing format
 */
export const PublicQAItem = ({ message }: PublicQAItemProps) => {
  return (
    <div className="border rounded-lg p-3 md:p-4 bg-gray-50">
      {/* Question */}
      <div className="mb-3">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 mb-1">
          <span className="text-sm font-medium text-gray-700 truncate">
            {message.sender.name}
          </span>
          <span className="text-xs text-gray-500 whitespace-nowrap">
            {formatTimeAgo(message.createdAt)}
          </span>
        </div>
        <p
          className="text-gray-900 break-words"
          dangerouslySetInnerHTML={{ __html: sanitizeText(message.question) }}
        />
        {message.isEdited && (
          <span className="text-xs text-gray-500 ml-2">(editada)</span>
        )}
      </div>

      {/* Answer */}
      {message.answer && (
        <div className="bg-blue-50 border-l-4 border-blue-500 rounded p-3">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span className="text-sm font-medium text-blue-900">
              {message.answerer?.name || 'Criador'}
            </span>
            <span className="text-xs text-blue-700 whitespace-nowrap">
              {formatTimeAgo(message.answeredAt!)}
            </span>
          </div>
          <p
            className="text-gray-900 break-words"
            dangerouslySetInnerHTML={{ __html: sanitizeText(message.answer!) }}
          />
        </div>
      )}
    </div>
  );
};
