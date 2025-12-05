import { useState } from 'react';
import { X, Send, Bug, Lightbulb, Wrench, MessageSquare } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { feedbackApi } from '../lib/api';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FeedbackType = 'BUG' | 'SUGGESTION' | 'IMPROVEMENT' | 'OTHER';

const feedbackTypes = [
  { value: 'BUG' as FeedbackType, label: 'Bug', icon: Bug, color: 'text-red-600' },
  { value: 'SUGGESTION' as FeedbackType, label: 'Sugestão', icon: Lightbulb, color: 'text-yellow-600' },
  { value: 'IMPROVEMENT' as FeedbackType, label: 'Melhoria', icon: Wrench, color: 'text-blue-600' },
  { value: 'OTHER' as FeedbackType, label: 'Outro', icon: MessageSquare, color: 'text-gray-600' },
];

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [type, setType] = useState<FeedbackType>('SUGGESTION');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');

  const createFeedbackMutation = useMutation({
    mutationFn: feedbackApi.create,
    onSuccess: () => {
      toast.success('Feedback enviado com sucesso! Obrigado pela contribuição.');
      resetForm();
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao enviar feedback');
    },
  });

  const resetForm = () => {
    setType('SUGGESTION');
    setTitle('');
    setDescription('');
    setEmail('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || title.length < 5) {
      toast.error('Título deve ter no mínimo 5 caracteres');
      return;
    }

    if (!description.trim() || description.length < 10) {
      toast.error('Descrição deve ter no mínimo 10 caracteres');
      return;
    }

    createFeedbackMutation.mutate({
      type,
      title: title.trim(),
      description: description.trim(),
      email: email.trim() || undefined,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Enviar Feedback</h2>
              <p className="text-sm text-gray-500 mt-1">
                Ajude a melhorar este projeto compartilhando suas ideias
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Tipo de Feedback */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tipo de Feedback
              </label>
              <div className="grid grid-cols-2 gap-3">
                {feedbackTypes.map(({ value, label, icon: Icon, color }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setType(value)}
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                      type === value
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${color}`} />
                    <span className="font-medium text-gray-900">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Título */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Título <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Resumo do seu feedback..."
                maxLength={200}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">{title.length}/200 caracteres</p>
            </div>

            {/* Descrição */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Descrição <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva detalhadamente seu feedback..."
                rows={6}
                maxLength={5000}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                required
              />
              <p className="text-xs text-gray-500 mt-1">{description.length}/5000 caracteres</p>
            </div>

            {/* Email (opcional) */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email (opcional)
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Se quiser receber atualizações sobre seu feedback
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={createFeedbackMutation.isPending}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {createFeedbackMutation.isPending ? (
                  <>Enviando...</>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Enviar Feedback
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
