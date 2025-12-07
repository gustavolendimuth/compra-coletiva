import { Edit2 } from "lucide-react";
import { CampaignMessage } from "@/api";
import { sanitizeText } from "@/lib/sanitize";
import { formatTimeAgo } from "./chatUtils";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";

interface EditableQuestionProps {
  message: CampaignMessage;
  isEditing: boolean;
  editText: string;
  canEdit: boolean;
  onEditStart: () => void;
  onEditChange: (value: string) => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  isSaving: boolean;
}

/**
 * Question card with edit capability
 * Shows edit form when in edit mode, otherwise displays question
 */
export const EditableQuestion = ({
  message,
  isEditing,
  editText,
  canEdit,
  onEditStart,
  onEditChange,
  onEditSave,
  onEditCancel,
  isSaving,
}: EditableQuestionProps) => {
  if (isEditing) {
    return (
      <div className="bg-white rounded p-3 border border-yellow-300">
        <Textarea
          value={editText}
          onChange={(e) => onEditChange(e.target.value)}
          className="px-3 py-2 text-sm md:text-base"
          rows={3}
          maxLength={1000}
        />
        <div className="flex gap-2 mt-2">
          <Button
            variant="primary"
            size="sm"
            onClick={onEditSave}
            disabled={isSaving}
          >
            Salvar
          </Button>
          <Button variant="secondary" size="sm" onClick={onEditCancel}>
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded p-3 border border-yellow-300">
      <p
        className="text-gray-900 break-words"
        dangerouslySetInnerHTML={{ __html: sanitizeText(message.question) }}
      />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-2">
        <span className="text-xs text-gray-500">
          Enviada {formatTimeAgo(message.createdAt)}
          {message.isEdited && " (editada)"}
        </span>
        {canEdit && (
          <button
            onClick={onEditStart}
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 self-start sm:self-auto"
          >
            <Edit2 className="w-3 h-3" />
            Editar
          </button>
        )}
      </div>
    </div>
  );
};
