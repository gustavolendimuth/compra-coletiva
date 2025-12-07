import { User, Clock, AlertTriangle, Send, Trash2 } from "lucide-react";
import { CampaignMessage } from "@/api";
import { sanitizeText } from "@/lib/sanitize";
import { formatTimeAgo } from "./chatUtils";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Textarea } from "@/components/ui/Textarea";

interface UnansweredQuestionItemProps {
  message: CampaignMessage;
  answerText: string;
  onAnswerChange: (value: string) => void;
  onAnswer: () => void;
  onDelete: () => void;
  isAnswering: boolean;
  isDeleting: boolean;
}

/**
 * Individual unanswered question card with spam indicators and answer form
 * Mobile-first layout with responsive design
 */
export const UnansweredQuestionItem = ({
  message,
  answerText,
  onAnswerChange,
  onAnswer,
  onDelete,
  isAnswering,
  isDeleting,
}: UnansweredQuestionItemProps) => {
  const isHighSpam = message.spamScore > 50;

  return (
    <div
      className={`border rounded-lg p-3 md:p-4 ${
        isHighSpam ? "border-red-300 bg-red-50" : "bg-white"
      }`}
    >
      {/* User Info Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="font-medium text-gray-900 truncate">
                {message.sender.name}
              </span>
            </div>
            <Badge
              variant={
                message.spamScore < 30
                  ? "success"
                  : message.spamScore < 60
                  ? "warning"
                  : "danger"
              }
              size="sm"
            >
              Spam: {message.spamScore.toFixed(0)}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 flex-shrink-0" />
              <span>Enviada: {formatTimeAgo(message.createdAt)}</span>
            </div>
          </div>
        </div>

        <span className="text-xs text-gray-500 sm:text-right whitespace-nowrap">
          {formatTimeAgo(message.createdAt)}
        </span>
      </div>

      {/* Question */}
      <div className="mb-4 p-3 bg-gray-50 rounded border">
        <p
          className="text-gray-900 break-words"
          dangerouslySetInnerHTML={{ __html: sanitizeText(message.question) }}
        />
        {message.isEdited && (
          <span className="text-xs text-gray-500 mt-1 block">(editada)</span>
        )}
      </div>

      {/* Spam Factors */}
      {message.metadata?.factors && message.metadata.factors.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
            <span className="text-sm font-medium text-yellow-900">
              Fatores de risco detectados:
            </span>
          </div>
          <ul className="text-sm text-yellow-800 space-y-1">
            {message.metadata.factors.map((factor: any, idx: number) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-yellow-600 flex-shrink-0">•</span>
                <span className="break-words">{factor.description}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Answer Form */}
      <div className="space-y-3">
        <Textarea
          value={answerText}
          onChange={(e) => onAnswerChange(e.target.value)}
          placeholder="Digite sua resposta..."
          className="px-3 md:px-4 py-2 md:py-3 text-sm md:text-base"
          rows={4}
          maxLength={2000}
        />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <span className="text-xs text-gray-500">
            {answerText.length}/2000 caracteres
          </span>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="danger"
              size="sm"
              onClick={onDelete}
              disabled={isDeleting}
              className="flex-1 sm:flex-none"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Deletar
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onAnswer}
              disabled={!answerText.trim() || isAnswering}
              className="flex-1 sm:flex-none"
            >
              <Send className="w-4 h-4 mr-2" />
              Publicar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
