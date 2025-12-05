import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { campaignMessageApi, CampaignMessage } from '@/api';
import { getSocket } from '@/lib/socket';
import toast from 'react-hot-toast';

/**
 * Custom hook for campaign chat logic
 * Handles data fetching, mutations, socket events, and typing indicator
 */
export const useCampaignChat = (campaignId: string, userId?: string) => {
  const [question, setQuestion] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const socket = getSocket();
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const location = useLocation();
  const previousMessagesLength = useRef<number | null>(null);
  const hasScrolledToHash = useRef(false);

  // Fetch public messages
  const { data: publicMessages = { messages: [], total: 0, hasMore: false }, isLoading } = useQuery({
    queryKey: ['campaign-messages', campaignId],
    queryFn: () => campaignMessageApi.list(campaignId),
    refetchOnWindowFocus: false
  });

  // Fetch my questions (if authenticated)
  const { data: myMessages = [] } = useQuery({
    queryKey: ['my-campaign-messages', campaignId],
    queryFn: () => campaignMessageApi.getMine(campaignId),
    enabled: !!userId,
    refetchOnWindowFocus: false
  });

  // Create question mutation
  const createMutation = useMutation({
    mutationFn: campaignMessageApi.create,
    onSuccess: () => {
      setQuestion('');
      queryClient.invalidateQueries({ queryKey: ['my-campaign-messages', campaignId] });
      toast.success('Pergunta enviada! Aguarde a resposta do criador.');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao enviar pergunta');
    }
  });

  // Edit question mutation
  const editMutation = useMutation({
    mutationFn: ({ id, question }: { id: string; question: string }) =>
      campaignMessageApi.edit(id, question),
    onSuccess: () => {
      setEditingId(null);
      setEditingText('');
      queryClient.invalidateQueries({ queryKey: ['my-campaign-messages', campaignId] });
      toast.success('Pergunta atualizada');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao editar pergunta');
    }
  });

  // Socket.IO: Join campaign room
  useEffect(() => {
    socket.emit('join-campaign', campaignId);
    return () => {
      socket.emit('leave-campaign', campaignId);
    };
  }, [campaignId, socket]);

  // Socket.IO: Listen for published messages
  useEffect(() => {
    const handleMessagePublished = (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['campaign-messages', campaignId] });
      if (userId && data.sender?.id === userId) {
        queryClient.invalidateQueries({ queryKey: ['my-campaign-messages', campaignId] });
        toast.success('Sua pergunta foi respondida!');
      }
    };

    socket.on('campaign-message-published', handleMessagePublished);
    return () => {
      socket.off('campaign-message-published', handleMessagePublished);
    };
  }, [campaignId, queryClient, socket, userId]);

  // Auto scroll to latest message only when:
  // 1. Coming from notification (hash in URL)
  // 2. New message published (messages length increases, but NOT on initial load)
  useEffect(() => {
    const currentLength = publicMessages.messages.length;

    // Check if coming from notification (hash in URL)
    const shouldScrollFromHash = location.hash === '#chat' && !hasScrolledToHash.current;

    // Check if new message published (but NOT on initial load)
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
  }, [publicMessages.messages, location.hash]);

  // Typing indicator
  const handleTyping = () => {
    if (!isTyping && userId) {
      setIsTyping(true);
      socket.emit('typing', { campaignId, isTyping: true });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('typing', { campaignId, isTyping: false });
    }, 1000);
  };

  const canEdit = (msg: CampaignMessage) => {
    if (!userId || msg.senderId !== userId || msg.answer) return false;
    const createdAt = new Date(msg.createdAt);
    const fifteenMinutes = 15 * 60 * 1000;
    return Date.now() - createdAt.getTime() < fifteenMinutes;
  };

  return {
    question,
    setQuestion,
    editingId,
    setEditingId,
    editingText,
    setEditingText,
    messagesEndRef,
    publicMessages,
    isLoading,
    myMessages,
    createMutation,
    editMutation,
    handleTyping,
    canEdit
  };
};
