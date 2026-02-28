import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { campaignMessageApi, CampaignMessage } from '@/api';
import { getSocket } from '@/lib/socket';
import { getApiErrorMessage } from '@/lib/apiError';
import toast from 'react-hot-toast';

/**
 * Custom hook for campaign questions panel logic
 * Handles data fetching, mutations, and socket events
 */
export const useCampaignQuestions = (campaignId: string) => {
  const [activeTab, setActiveTab] = useState<'unanswered' | 'answered'>('unanswered');
  const [answerText, setAnswerText] = useState<{ [key: string]: string }>({});
  const queryClient = useQueryClient();
  const socket = getSocket();

  // Fetch unanswered questions
  const { data: unansweredMessages = [], isLoading: loadingUnanswered } = useQuery({
    queryKey: ['unanswered-campaign-messages', campaignId],
    queryFn: () => campaignMessageApi.getUnanswered(campaignId),
    refetchOnWindowFocus: false
  });

  // Fetch all messages (for answered tab)
  const { data: allMessages = { messages: [], total: 0 }, isLoading: loadingAll } = useQuery({
    queryKey: ['campaign-messages', campaignId],
    queryFn: () => campaignMessageApi.list(campaignId),
    enabled: activeTab === 'answered',
    refetchOnWindowFocus: false
  });

  // Answer mutation
  const answerMutation = useMutation({
    mutationFn: ({ id, answer }: { id: string; answer: string }) =>
      campaignMessageApi.answer(id, answer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unanswered-campaign-messages', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['campaign-messages', campaignId] });
      setAnswerText({});
      toast.success('Resposta publicada com sucesso!');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Erro ao publicar resposta'));
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: campaignMessageApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unanswered-campaign-messages', campaignId] });
      toast.success('Pergunta deletada');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Erro ao deletar pergunta'));
    }
  });

  // Socket.IO: Listen for new questions
  useEffect(() => {
    const handleQuestionReceived = (data: CampaignMessage) => {
      queryClient.invalidateQueries({ queryKey: ['unanswered-campaign-messages', campaignId] });

      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Nova pergunta recebida', {
          body: data.question.substring(0, 100) + '...',
          icon: '/logo.png'
        });
      }
    };

    socket.on('campaign-question-received', handleQuestionReceived);
    return () => {
      socket.off('campaign-question-received', handleQuestionReceived);
    };
  }, [campaignId, queryClient, socket]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return {
    activeTab,
    setActiveTab,
    answerText,
    setAnswerText,
    unansweredMessages,
    loadingUnanswered,
    allMessages,
    loadingAll,
    answerMutation,
    deleteMutation
  };
};

