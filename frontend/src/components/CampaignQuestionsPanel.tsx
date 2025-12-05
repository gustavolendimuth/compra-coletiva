import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { campaignMessageApi, CampaignMessage } from '../lib/api';
import { getSocket } from '../lib/socket';
import { sanitizeText } from '../lib/sanitize';
import toast from 'react-hot-toast';
import {
  MessageSquare,
  Send,
  Trash2,
  AlertTriangle,
  CheckCircle,
  User,
  Clock,
  ShoppingCart,
  TrendingUp
} from 'lucide-react';

interface CampaignQuestionsPanelProps {
  campaignId: string;
}

export default function CampaignQuestionsPanel({ campaignId }: CampaignQuestionsPanelProps) {
  const [activeTab, setActiveTab] = useState<'unanswered' | 'answered'>('unanswered');
  const [answerText, setAnswerText] = useState<{ [key: string]: string }>({});
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const socket = getSocket();

  // Buscar perguntas não respondidas
  const { data: unansweredMessages = [], isLoading: loadingUnanswered } = useQuery({
    queryKey: ['unanswered-campaign-messages', campaignId],
    queryFn: () => campaignMessageApi.getUnanswered(campaignId),
    refetchOnWindowFocus: false
  });

  // Buscar todas as mensagens (para aba de respondidas)
  const { data: allMessages = { messages: [], total: 0 }, isLoading: loadingAll } = useQuery({
    queryKey: ['campaign-messages', campaignId],
    queryFn: () => campaignMessageApi.list(campaignId),
    enabled: activeTab === 'answered',
    refetchOnWindowFocus: false
  });

  // Mutation para responder
  const answerMutation = useMutation({
    mutationFn: ({ id, answer }: { id: string; answer: string }) =>
      campaignMessageApi.answer(id, answer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unanswered-campaign-messages', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['campaign-messages', campaignId] });
      setAnswerText({});
      toast.success('Resposta publicada com sucesso!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erro ao publicar resposta';
      toast.error(message);
    }
  });

  // Mutation para deletar
  const deleteMutation = useMutation({
    mutationFn: campaignMessageApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unanswered-campaign-messages', campaignId] });
      toast.success('Pergunta deletada');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erro ao deletar pergunta';
      toast.error(message);
    }
  });

  // Socket.IO: Listener para novas perguntas
  useEffect(() => {
    const handleQuestionReceived = (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['unanswered-campaign-messages', campaignId] });

      // Desktop notification
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

  // Solicitar permissão de notificação
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleAnswer = (id: string) => {
    const answer = answerText[id]?.trim();
    if (!answer) {
      toast.error('Digite uma resposta');
      return;
    }

    answerMutation.mutate({ id, answer });
  };

  const handleDelete = (id: string, question: string) => {
    if (confirm(`Deletar esta pergunta?\n\n"${question.substring(0, 100)}..."`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleTyping = (messageId: string) => {
    if (typingMessageId !== messageId) {
      setTypingMessageId(messageId);
      // Aqui poderíamos emitir evento de typing para o usuário específico
      // socket.emit('creator-typing', { userId: msg.senderId, isTyping: true });
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'agora';
    if (minutes < 60) return `${minutes}min atrás`;
    if (hours < 24) return `${hours}h atrás`;
    if (days < 7) return `${days}d atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  const getSpamScoreColor = (score: number) => {
    if (score < 30) return 'text-green-600 bg-green-100';
    if (score < 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getAccountAge = (createdAt: string) => {
    const date = new Date(createdAt);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (hours < 24) return `${hours}h`;
    if (days < 30) return `${days}d`;
    return `${Math.floor(days / 30)}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header com Tabs */}
      <div className="bg-white border rounded-lg">
        <div className="border-b">
          <div className="flex">
            <button
              onClick={() => setActiveTab('unanswered')}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'unanswered'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Pendentes
                {unansweredMessages.length > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {unansweredMessages.length}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('answered')}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'answered'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Respondidas ({allMessages.total})
              </div>
            </button>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-6">
          {activeTab === 'unanswered' ? (
            // Aba de Pendentes
            <div className="space-y-4">
              {loadingUnanswered ? (
                <div className="text-center text-gray-500 py-8">Carregando...</div>
              ) : unansweredMessages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p className="font-medium">Nenhuma pergunta pendente</p>
                  <p className="text-sm">Todas as perguntas foram respondidas!</p>
                </div>
              ) : (
                unansweredMessages.map((msg: CampaignMessage) => (
                  <div
                    key={msg.id}
                    className={`border rounded-lg p-4 ${
                      msg.spamScore > 50 ? 'border-red-300 bg-red-50' : 'bg-white'
                    }`}
                  >
                    {/* Header com informações do usuário */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-900">{msg.sender.name}</span>
                          </div>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${getSpamScoreColor(
                              msg.spamScore
                            )}`}
                          >
                            Spam: {msg.spamScore.toFixed(0)}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Conta: {getAccountAge(msg.sender.createdAt || msg.createdAt)}
                          </div>
                          {msg.sender.orders && (
                            <div className="flex items-center gap-1">
                              <ShoppingCart className="w-3 h-3" />
                              {msg.sender.orders.length} pedido(s) nesta campanha
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-gray-500">
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Pergunta */}
                    <div className="mb-4 p-3 bg-gray-50 rounded border">
                      <p
                        className="text-gray-900"
                        dangerouslySetInnerHTML={{ __html: sanitizeText(msg.question) }}
                      />
                      {msg.isEdited && (
                        <span className="text-xs text-gray-500 mt-1 block">(editada)</span>
                      )}
                    </div>

                    {/* Fatores de spam (se houver) */}
                    {msg.metadata?.factors && msg.metadata.factors.length > 0 && (
                      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-600" />
                          <span className="text-sm font-medium text-yellow-900">
                            Fatores de risco detectados:
                          </span>
                        </div>
                        <ul className="text-sm text-yellow-800 space-y-1">
                          {msg.metadata.factors.map((factor, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-yellow-600">•</span>
                              <span>{factor.description}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Formulário de resposta */}
                    <div className="space-y-3">
                      <textarea
                        value={answerText[msg.id] || ''}
                        onChange={(e) => {
                          setAnswerText({ ...answerText, [msg.id]: e.target.value });
                          handleTyping(msg.id);
                        }}
                        placeholder="Digite sua resposta..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        rows={4}
                        maxLength={2000}
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {(answerText[msg.id] || '').length}/2000 caracteres
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDelete(msg.id, msg.question)}
                            disabled={deleteMutation.isPending}
                            className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 flex items-center gap-2 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Deletar Spam
                          </button>
                          <button
                            onClick={() => handleAnswer(msg.id)}
                            disabled={
                              !answerText[msg.id]?.trim() || answerMutation.isPending
                            }
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                          >
                            <Send className="w-4 h-4" />
                            Publicar Resposta
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            // Aba de Respondidas
            <div className="space-y-4">
              {loadingAll ? (
                <div className="text-center text-gray-500 py-8">Carregando...</div>
              ) : allMessages.messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>Nenhuma pergunta respondida ainda</p>
                </div>
              ) : (
                allMessages.messages.map((msg: CampaignMessage) => (
                  <div key={msg.id} className="border rounded-lg p-4 bg-white">
                    {/* Pergunta */}
                    <div className="mb-3">
                      <div className="flex items-start justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">
                          {msg.sender.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>
                      <p
                        className="text-gray-900"
                        dangerouslySetInnerHTML={{ __html: sanitizeText(msg.question) }}
                      />
                    </div>

                    {/* Resposta */}
                    {msg.answer && (
                      <div className="bg-blue-50 border-l-4 border-blue-500 rounded p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-900">
                            Sua resposta
                          </span>
                          <span className="text-xs text-blue-700">
                            {formatTime(msg.answeredAt!)}
                          </span>
                        </div>
                        <p
                          className="text-gray-900"
                          dangerouslySetInnerHTML={{ __html: sanitizeText(msg.answer) }}
                        />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
