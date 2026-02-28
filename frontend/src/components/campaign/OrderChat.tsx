import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { ChatEmptyState } from './ChatEmptyState';
import { useOrderChat } from './useOrderChat';
import { getApiErrorMessage, getApiErrorStatus } from '@/lib/apiError';

interface OrderChatProps {
  orderId: string;
}

/**
 * Order Chat - Private chat between customer and campaign creator
 * Refactored with custom hook for business logic
 */
export default function OrderChat({ orderId }: OrderChatProps) {
  const { user, requireAuth } = useAuth();
  const queryClient = useQueryClient();
  const {
    message,
    setMessage,
    messagesEndRef,
    messages,
    isLoading,
    isError,
    error,
    sendMessageMutation
  } = useOrderChat(orderId, user?.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    requireAuth(() => {
      sendMessageMutation.mutate({
        orderId,
        message: message.trim()
      });
      window.dispatchEvent(new CustomEvent('refreshUnreadCount'));
    });
  };

  const handleLogin = () => {
    requireAuth(() => {
      queryClient.invalidateQueries({ queryKey: ['messages', orderId] });
    });
  };

  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ['messages', orderId] });
  };

  // Determine chat state
  const errorStatus = getApiErrorStatus(error);
  const isAuthError = errorStatus === 401 || errorStatus === 403;

  return (
    <div
      className="flex flex-col border rounded-lg bg-gray-50"
      style={{ height: 'min(500px, 50vh)' }}
    >
      {/* Header */}
      <div className="p-3 md:p-4 border-b bg-white rounded-t-lg">
        <h3 className="font-semibold text-gray-900 text-sm md:text-base">Chat do Pedido</h3>
        <p className="text-xs md:text-sm text-gray-500">Mensagens sobre este pedido</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-4">
        {!user ? (
          <ChatEmptyState type="unauthenticated" onLogin={handleLogin} />
        ) : isError ? (
          <ChatEmptyState
            type={isAuthError ? 'unauthenticated' : 'error'}
            errorMessage={getApiErrorMessage(error, 'Erro ao carregar mensagens')}
            onRetry={handleRetry}
            onLogin={isAuthError ? handleLogin : undefined}
          />
        ) : isLoading ? (
          <ChatEmptyState type="loading" />
        ) : messages.length === 0 ? (
          <ChatEmptyState type="empty" />
        ) : (
          <MessageList messages={messages} currentUserId={user?.id} />
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <MessageInput
        message={message}
        onMessageChange={setMessage}
        onSubmit={handleSubmit}
        isAuthenticated={!!user}
        isSubmitting={sendMessageMutation.isPending}
      />
    </div>
  );
}

