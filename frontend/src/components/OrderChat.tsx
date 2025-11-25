import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messageApi, OrderMessage } from '../lib/api';
import { getSocket } from '../lib/socket';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface OrderChatProps {
  orderId: string;
}

export default function OrderChat({ orderId }: OrderChatProps) {
  const { user, requireAuth } = useAuth();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const socket = getSocket();

  // Buscar mensagens
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['messages', orderId],
    queryFn: () => messageApi.getByOrder(orderId),
    refetchOnWindowFocus: false
  });

  // Mutation para enviar mensagem
  const sendMessageMutation = useMutation({
    mutationFn: messageApi.create,
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['messages', orderId] });
    },
    onError: () => {
      toast.error('Erro ao enviar mensagem');
    }
  });

  // Socket.io: Join na sala do pedido
  useEffect(() => {
    socket.emit('join-order', orderId);

    return () => {
      socket.emit('leave-order', orderId);
    };
  }, [orderId]);

  // Socket.io: Listener para novas mensagens
  useEffect(() => {
    const handleMessageSent = (newMessage: OrderMessage) => {
      queryClient.setQueryData(['messages', orderId], (oldMessages: OrderMessage[] = []) => {
        // Evita duplicatas
        if (oldMessages.some(m => m.id === newMessage.id)) {
          return oldMessages;
        }
        return [...oldMessages, newMessage];
      });

      // Refresh unread count when receiving new message
      window.dispatchEvent(new CustomEvent('refreshUnreadCount'));
    };

    socket.on('message-sent', handleMessageSent);

    return () => {
      socket.off('message-sent', handleMessageSent);
    };
  }, [orderId, queryClient]);

  // Scroll automático para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    requireAuth(() => {
      sendMessageMutation.mutate({
        orderId,
        message: message.trim()
      });

      // Refresh unread count after sending
      window.dispatchEvent(new CustomEvent('refreshUnreadCount'));
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoje';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
  };

  // Agrupar mensagens por data
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.createdAt).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, OrderMessage[]>);

  return (
    <div className="flex flex-col h-[500px] border rounded-lg bg-gray-50">
      {/* Header */}
      <div className="p-4 border-b bg-white rounded-t-lg">
        <h3 className="font-semibold text-gray-900">Chat do Pedido</h3>
        <p className="text-sm text-gray-500">Mensagens sobre este pedido</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Carregando mensagens...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <p>Nenhuma mensagem ainda</p>
              <p className="text-sm">Envie a primeira mensagem abaixo</p>
            </div>
          </div>
        ) : (
          Object.keys(groupedMessages).map((date) => (
            <div key={date}>
              {/* Date divider */}
              <div className="flex items-center justify-center my-4">
                <div className="px-3 py-1 bg-gray-200 rounded-full text-xs text-gray-600">
                  {formatDate(groupedMessages[date][0].createdAt)}
                </div>
              </div>

              {/* Messages for this date */}
              {groupedMessages[date].map((msg) => {
                const isOwnMessage = user && msg.senderId === user.id;

                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-3`}
                  >
                    <div className={`max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
                      <div className="text-xs text-gray-500 mb-1 px-1">
                        {msg.sender.name} - {formatTime(msg.createdAt)}
                      </div>
                      <div
                        className={`rounded-lg px-4 py-2 ${
                          isOwnMessage
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-white text-gray-900 border border-gray-200 rounded-bl-none'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t bg-white rounded-b-lg">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={sendMessageMutation.isPending}
          />
          <button
            type="submit"
            disabled={!message.trim() || sendMessageMutation.isPending}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sendMessageMutation.isPending ? 'Enviando...' : 'Enviar'}
          </button>
        </div>
      </form>
    </div>
  );
}
