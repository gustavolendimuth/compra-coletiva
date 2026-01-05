import { useState } from 'react';
import toast from 'react-hot-toast';
import { CampaignMessage } from '@/api';
import { ConfirmModal } from '@/components/ui';
import { QuestionsPanelTabs } from './QuestionsPanelTabs';
import { UnansweredQuestionItem } from './UnansweredQuestionItem';
import { AnsweredQuestionItem } from './AnsweredQuestionItem';
import { QuestionsPanelEmptyState } from './QuestionsPanelEmptyState';
import { useCampaignQuestions } from './useCampaignQuestions';

interface CampaignQuestionsPanelProps {
  campaignId: string;
}

/**
 * Campaign Questions Panel - Creator view for moderating Q&A
 * Refactored with custom hook for business logic
 */
export default function CampaignQuestionsPanel({ campaignId }: CampaignQuestionsPanelProps) {
  const [messageToDelete, setMessageToDelete] = useState<{ id: string; question: string } | null>(null);

  const {
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
  } = useCampaignQuestions(campaignId);

  const handleAnswer = (id: string) => {
    const answer = answerText[id]?.trim();
    if (!answer) {
      toast.error('Digite uma resposta');
      return;
    }
    answerMutation.mutate({ id, answer });
  };

  const handleDeleteClick = (id: string, question: string) => {
    setMessageToDelete({ id, question });
  };

  const handleConfirmDelete = () => {
    if (messageToDelete) {
      deleteMutation.mutate(messageToDelete.id);
      setMessageToDelete(null);
    }
  };

  const handleAnswerChange = (id: string, value: string) => {
    setAnswerText({ ...answerText, [id]: value });
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="bg-white border rounded-lg overflow-hidden">
        {/* Tabs */}
        <div className="border-b">
          <QuestionsPanelTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            unansweredCount={unansweredMessages.length}
            answeredCount={allMessages.total}
          />
        </div>

        {/* Content */}
        <div className="p-4 md:p-6">
          {activeTab === 'unanswered' ? (
            <div className="space-y-4">
              {loadingUnanswered ? (
                <div className="text-center text-gray-500 py-8">Carregando...</div>
              ) : unansweredMessages.length === 0 ? (
                <QuestionsPanelEmptyState type="unanswered" />
              ) : (
                unansweredMessages.map((msg: CampaignMessage) => (
                  <UnansweredQuestionItem
                    key={msg.id}
                    message={msg}
                    answerText={answerText[msg.id] || ''}
                    onAnswerChange={(value) => handleAnswerChange(msg.id, value)}
                    onAnswer={() => handleAnswer(msg.id)}
                    onDelete={() => handleDeleteClick(msg.id, msg.question)}
                    isAnswering={answerMutation.isPending}
                    isDeleting={deleteMutation.isPending}
                  />
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {loadingAll ? (
                <div className="text-center text-gray-500 py-8">Carregando...</div>
              ) : allMessages.messages.length === 0 ? (
                <QuestionsPanelEmptyState type="answered" />
              ) : (
                allMessages.messages.map((msg: CampaignMessage) => (
                  <AnsweredQuestionItem key={msg.id} message={msg} />
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!messageToDelete}
        onClose={() => setMessageToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Deletar Pergunta"
        message={
          messageToDelete ? (
            <>
              <p>Tem certeza que deseja deletar esta pergunta?</p>
              <p className="mt-2 text-sm font-medium text-gray-700 italic">"{messageToDelete.question.substring(0, 100)}{messageToDelete.question.length > 100 ? '...' : ''}"</p>
              <p className="mt-2 text-sm text-gray-600">Esta ação não pode ser desfeita.</p>
            </>
          ) : (
            ""
          )
        }
        confirmText="Deletar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
}
