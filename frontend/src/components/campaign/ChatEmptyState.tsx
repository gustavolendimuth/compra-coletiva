import { Button } from '@/components/ui/Button';

type ChatEmptyStateType = 'unauthenticated' | 'error' | 'empty' | 'loading';

interface ChatEmptyStateProps {
  type: ChatEmptyStateType;
  errorMessage?: string;
  onRetry?: () => void;
  onLogin?: () => void;
}

/**
 * Empty states for chat component
 * Handles loading, empty, error, and unauthenticated states
 */
export const ChatEmptyState = ({
  type,
  errorMessage,
  onRetry,
  onLogin
}: ChatEmptyStateProps) => {
  if (type === 'loading') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500 text-sm md:text-base">Carregando mensagens...</div>
      </div>
    );
  }

  if (type === 'empty') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <p className="text-sm md:text-base">Nenhuma mensagem ainda</p>
          <p className="text-xs md:text-sm mt-1">Envie a primeira mensagem abaixo</p>
        </div>
      </div>
    );
  }

  if (type === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-sm px-4">
          <div className="mb-4">
            <svg
              className="mx-auto h-10 w-10 md:h-12 md:w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">
            Login Necessário
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Faça login para visualizar e enviar mensagens sobre este pedido
          </p>
          {onLogin && (
            <Button variant="primary" size="sm" onClick={onLogin}>
              Fazer Login
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (type === 'error') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-sm px-4">
          <div className="mb-4">
            <svg
              className="mx-auto h-10 w-10 md:h-12 md:w-12 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">
            Erro ao Carregar Mensagens
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {errorMessage || 'Ocorreu um erro ao carregar as mensagens'}
          </p>
          {onRetry && (
            <Button variant="secondary" size="sm" onClick={onRetry}>
              Tentar Novamente
            </Button>
          )}
        </div>
      </div>
    );
  }

  return null;
};
