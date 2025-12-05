import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { messageApi, OrderMessage } from '@/api';
import { getSocket } from '@/lib/socket';
import toast from 'react-hot-toast';

/**
 * Custom hook for order chat logic
 * Handles data fetching, mutations, and socket events
 */
export const useOrderChat = (orderId: string, userId?: string) => {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const socket = getSocket();
  const location = useLocation();
  const previousMessagesLength = useRef<number | null>(null);
  const hasScrolledToHash = useRef(false);

  // Fetch messages - only executes if user is authenticated
  const {
    data: messages = [],
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['messages', orderId],
    queryFn: () => messageApi.getByOrder(orderId),
    enabled: !!userId,
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    }
  });

  // Send message mutation
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

  // Socket.io: Join order room
  useEffect(() => {
    socket.emit('join-order', orderId);
    return () => {
      socket.emit('leave-order', orderId);
    };
  }, [orderId, socket]);

  // Socket.io: Listen for new messages
  useEffect(() => {
    const handleMessageSent = (newMessage: OrderMessage) => {
      queryClient.setQueryData(['messages', orderId], (oldMessages: OrderMessage[] = []) => {
        if (oldMessages.some((m) => m.id === newMessage.id)) {
          return oldMessages;
        }
        return [...oldMessages, newMessage];
      });

      window.dispatchEvent(new CustomEvent('refreshUnreadCount'));
    };

    socket.on('message-sent', handleMessageSent);
    return () => {
      socket.off('message-sent', handleMessageSent);
    };
  }, [orderId, queryClient, socket]);

  // Auto scroll to latest message only when:
  // 1. Coming from notification (hash in URL)
  // 2. New message arrives (messages length increases, but NOT on initial load)
  useEffect(() => {
    const currentLength = messages.length;

    // Check if coming from notification (hash in URL)
    const shouldScrollFromHash = location.hash === '#chat' && !hasScrolledToHash.current;

    // Check if new message arrived (but NOT on initial load)
    // previousMessagesLength starts as null, so first load won't trigger scroll
    const hasNewMessage =
      previousMessagesLength.current !== null &&
      currentLength > 0 &&
      currentLength > previousMessagesLength.current;

    if (shouldScrollFromHash || hasNewMessage) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

      if (shouldScrollFromHash) {
        hasScrolledToHash.current = true;
      }
    }

    // Update previous length (after first check, will be a number)
    previousMessagesLength.current = currentLength;
  }, [messages, location.hash]);

  return {
    message,
    setMessage,
    messagesEndRef,
    messages,
    isLoading,
    isError,
    error,
    sendMessageMutation
  };
};
