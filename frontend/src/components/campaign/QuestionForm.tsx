import { Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface QuestionFormProps {
  question: string;
  onQuestionChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isAuthenticated: boolean;
  isSubmitting: boolean;
}

/**
 * Question submission form
 * Mobile-first with character counter and auth check
 */
export const QuestionForm = ({
  question,
  onQuestionChange,
  onSubmit,
  isAuthenticated,
  isSubmitting
}: QuestionFormProps) => {
  return (
    <form onSubmit={onSubmit} className="p-3 md:p-4 border-t bg-gray-50">
      <div className="space-y-2">
        <textarea
          value={question}
          onChange={(e) => onQuestionChange(e.target.value)}
          placeholder={
            isAuthenticated
              ? 'Digite sua pergunta...'
              : 'Faça login para fazer uma pergunta'
          }
          disabled={!isAuthenticated || isSubmitting}
          className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed resize-none text-sm md:text-base"
          rows={3}
          maxLength={1000}
        />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <span className="text-xs text-gray-500">
            {question.length}/1000 caracteres
          </span>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!isAuthenticated || !question.trim() || isSubmitting}
            className="w-full sm:w-auto"
          >
            <Send className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Enviando...' : 'Enviar Pergunta'}
          </Button>
        </div>
      </div>
    </form>
  );
};
