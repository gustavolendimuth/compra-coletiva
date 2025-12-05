import { OrderMessage } from '@/api';
import { formatTime } from './chatUtils';

interface ChatMessageProps {
  message: OrderMessage;
  isOwnMessage: boolean;
}

/**
 * Individual chat message bubble
 * Different styling for sent vs received messages
 */
export const ChatMessage = ({ message, isOwnMessage }: ChatMessageProps) => {
  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[85%] md:max-w-[70%] ${
          isOwnMessage ? 'items-end' : 'items-start'
        } flex flex-col`}
      >
        <div className="text-xs text-gray-500 mb-1 px-1">
          {message.sender.name} - {formatTime(message.createdAt)}
        </div>
        <div
          className={`rounded-lg px-3 md:px-4 py-2 ${
            isOwnMessage
              ? 'bg-blue-600 text-white rounded-br-none'
              : 'bg-white text-gray-900 border border-gray-200 rounded-bl-none'
          }`}
        >
          <p className="whitespace-pre-wrap break-words text-sm md:text-base">
            {message.message}
          </p>
        </div>
      </div>
    </div>
  );
};
