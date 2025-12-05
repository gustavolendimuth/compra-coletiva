import { Clock } from 'lucide-react';
import { CampaignMessage } from '@/api';
import { EditableQuestion } from './EditableQuestion';

interface MyQuestionsListProps {
  questions: CampaignMessage[];
  editingId: string | null;
  editingText: string;
  onEditStart: (msg: CampaignMessage) => void;
  onEditChange: (value: string) => void;
  onEditSave: (id: string) => void;
  onEditCancel: () => void;
  canEdit: (msg: CampaignMessage) => boolean;
  isSaving: boolean;
}

/**
 * List of user's unanswered questions
 * Shows in yellow banner at top when user has pending questions
 */
export const MyQuestionsList = ({
  questions,
  editingId,
  editingText,
  onEditStart,
  onEditChange,
  onEditSave,
  onEditCancel,
  canEdit,
  isSaving
}: MyQuestionsListProps) => {
  if (questions.length === 0) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 md:p-4">
      <h3 className="font-semibold text-yellow-900 mb-3 flex items-center gap-2 text-sm md:text-base">
        <Clock className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
        <span>
          Suas perguntas aguardando resposta ({questions.length})
        </span>
      </h3>
      <div className="space-y-3">
        {questions.map((msg) => (
          <EditableQuestion
            key={msg.id}
            message={msg}
            isEditing={editingId === msg.id}
            editText={editingText}
            canEdit={canEdit(msg)}
            onEditStart={() => onEditStart(msg)}
            onEditChange={onEditChange}
            onEditSave={() => onEditSave(msg.id)}
            onEditCancel={onEditCancel}
            isSaving={isSaving}
          />
        ))}
      </div>
    </div>
  );
};
