import { Button } from '@/components/ui/Button';

interface MessageInputProps {
  message: string;
  onMessageChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isAuthenticated: boolean;
  isSubmitting: boolean;
}

/**
 * Message input form for chat
 * Mobile-first with responsive layout
 */
export const MessageInput = ({
  message,
  onMessageChange,
  onSubmit,
  isAuthenticated,
  isSubmitting
}: MessageInputProps) => {
  return (
    <form onSubmit={onSubmit} className="p-3 md:p-4 border-t bg-white rounded-b-lg">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          placeholder={
            isAuthenticated
              ? 'Digite sua mensagem...'
              : 'Faça login para enviar mensagens'
          }
          className="flex-1 px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm md:text-base"
          disabled={!isAuthenticated || isSubmitting}
        />
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={!isAuthenticated || !message.trim() || isSubmitting}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? 'Enviando...' : 'Enviar'}
        </Button>
      </div>
    </form>
  );
};
