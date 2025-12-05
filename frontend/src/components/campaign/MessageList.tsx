import { OrderMessage } from '@/api';
import { formatDate } from './chatUtils';
import { ChatMessage } from './ChatMessage';
import { DateDivider } from './DateDivider';

interface MessageListProps {
  messages: OrderMessage[];
  currentUserId?: string;
}

/**
 * List of chat messages grouped by date
 * Handles grouping logic and date dividers
 */
export const MessageList = ({ messages, currentUserId }: MessageListProps) => {
  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.createdAt).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, OrderMessage[]>);

  return (
    <>
      {Object.keys(groupedMessages).map((date) => (
        <div key={date}>
          <DateDivider date={formatDate(groupedMessages[date][0].createdAt)} />
          {groupedMessages[date].map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              isOwnMessage={!!currentUserId && msg.senderId === currentUserId}
            />
          ))}
        </div>
      ))}
    </>
  );
};
