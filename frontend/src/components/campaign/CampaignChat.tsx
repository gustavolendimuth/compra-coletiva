import { CampaignMessage } from '@/api';
import { useAuth } from '@/contexts/AuthContext';
import { MyQuestionsList } from './MyQuestionsList';
import { PublicQAList } from './PublicQAList';
import { QuestionForm } from './QuestionForm';
import { useCampaignChat } from './useCampaignChat';

interface CampaignChatProps {
  campaignId: string;
  isCreator?: boolean;
}

/**
 * Campaign Chat - Public Q&A for users
 * Refactored with custom hook for business logic
 */
export default function CampaignChat({ campaignId }: CampaignChatProps) {
  const { user, requireAuth } = useAuth();
  const {
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
  } = useCampaignChat(campaignId, user?.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    requireAuth(() => {
      createMutation.mutate({
        campaignId,
        question: question.trim()
      });
    });
  };

  const handleEditStart = (msg: CampaignMessage) => {
    setEditingId(msg.id);
    setEditingText(msg.question);
  };

  const handleEditSave = (id: string) => {
    if (!editingText.trim()) return;
    editMutation.mutate({ id, question: editingText.trim() });
  };

  const unansweredMyMessages = myMessages.filter((m) => !m.answer);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* My Unanswered Questions */}
      {user && (
        <MyQuestionsList
          questions={unansweredMyMessages}
          editingId={editingId}
          editingText={editingText}
          onEditStart={handleEditStart}
          onEditChange={setEditingText}
          onEditSave={handleEditSave}
          onEditCancel={() => setEditingId(null)}
          canEdit={canEdit}
          isSaving={editMutation.isPending}
        />
      )}

      {/* Public Q&As */}
      <PublicQAList
        messages={publicMessages.messages}
        total={publicMessages.total}
        isLoading={isLoading}
      />

      {/* Question Form */}
      <div className="bg-white border rounded-lg">
        <QuestionForm
          question={question}
          onQuestionChange={(value) => {
            setQuestion(value);
            handleTyping();
          }}
          onSubmit={handleSubmit}
          isAuthenticated={!!user}
          isSubmitting={createMutation.isPending}
        />
      </div>

      <div ref={messagesEndRef} />
    </div>
  );
}
