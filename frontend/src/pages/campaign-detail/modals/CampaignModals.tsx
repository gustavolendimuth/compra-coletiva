import { Modal, Button } from '@/components/ui';
import DateTimeInput from '@/components/DateTimeInput';
import ConfirmDialog from '@/components/ConfirmDialog';
import { Campaign } from '@/api';

interface CloneModalProps {
  isOpen: boolean;
  campaign: Campaign | null;
  cloneName: string;
  cloneDescription: string;
  isPending: boolean;
  onClose: () => void;
  onChangeName: (name: string) => void;
  onChangeDescription: (description: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

interface ShippingModalProps {
  isOpen: boolean;
  shippingCost: number | '';
  isPending: boolean;
  onClose: () => void;
  onChange: (cost: number | '') => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function ShippingModal({
  isOpen,
  shippingCost,
  isPending,
  onClose,
  onChange,
  onSubmit,
}: ShippingModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Frete Total">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="shipping-cost" className="block text-sm font-medium text-gray-700 mb-1">
            Valor do Frete Total (R$)
          </label>
          <input
            id="shipping-cost"
            type="number"
            step="0.01"
            min="0"
            autoFocus
            value={shippingCost}
            onChange={(e) =>
              onChange(e.target.value === '' ? '' : parseFloat(e.target.value))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <p className="text-sm text-gray-500 mt-2">
            O frete será distribuído proporcionalmente ao peso de cada pedido.
          </p>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={isPending} className="flex-1 whitespace-nowrap">
            {isPending ? 'Atualizando...' : 'Atualizar Frete'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="whitespace-nowrap"
          >
            Cancelar
          </Button>
        </div>
      </form>
    </Modal>
  );
}

interface DeadlineModalProps {
  isOpen: boolean;
  campaign: Campaign | null;
  deadlineForm: string;
  isPending: boolean;
  onClose: () => void;
  onChange: (deadline: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onRemove: () => void;
}

export function DeadlineModal({
  isOpen,
  campaign,
  deadlineForm,
  isPending,
  onClose,
  onChange,
  onSubmit,
  onRemove,
}: DeadlineModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configurar Data Limite">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Data e Hora Limite
          </label>
          <DateTimeInput
            value={deadlineForm}
            onChange={onChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            autoFocus
          />
          <p className="text-sm text-gray-500 mt-2">
            A campanha será fechada automaticamente quando atingir esta data. Formato: dd/mm/aaaa
            HH:mm (24h)
            {campaign?.deadline && ' Deixe em branco para remover a data limite.'}
          </p>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={isPending} className="flex-1 whitespace-nowrap">
            {isPending ? 'Salvando...' : 'Salvar'}
          </Button>
          {campaign?.deadline && (
            <Button
              type="button"
              variant="secondary"
              onClick={onRemove}
              disabled={isPending}
              className="whitespace-nowrap"
            >
              Remover
            </Button>
          )}
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="whitespace-nowrap"
          >
            Cancelar
          </Button>
        </div>
      </form>
    </Modal>
  );
}

interface CloseConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function CloseConfirmDialog({ isOpen, onClose, onConfirm }: CloseConfirmDialogProps) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Fechar Campanha"
      message="Tem certeza que deseja fechar esta campanha? Ninguém poderá adicionar ou alterar pedidos/produtos enquanto a campanha estiver fechada."
      confirmText="Fechar Campanha"
      cancelText="Cancelar"
      variant="warning"
    />
  );
}

interface ReopenConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ReopenConfirmDialog({ isOpen, onClose, onConfirm }: ReopenConfirmDialogProps) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Reabrir Campanha"
      message="Deseja reabrir esta campanha? Será possível adicionar e alterar pedidos e produtos novamente. A data limite será resetada."
      confirmText="Reabrir"
      cancelText="Cancelar"
      variant="info"
    />
  );
}

interface SentConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function SentConfirmDialog({ isOpen, onClose, onConfirm }: SentConfirmDialogProps) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Marcar como Enviado"
      message="Deseja marcar esta campanha como enviada? Esta ação indica que os produtos foram despachados."
      confirmText="Marcar como Enviado"
      cancelText="Cancelar"
      variant="info"
    />
  );
}

export function CloneModal({
  isOpen,
  campaign,
  cloneName,
  cloneDescription,
  isPending,
  onClose,
  onChangeName,
  onChangeDescription,
  onSubmit,
}: CloneModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Clonar Campanha">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="clone-name" className="block text-sm font-medium text-gray-700 mb-1">
            Nome da Nova Campanha *
          </label>
          <input
            id="clone-name"
            type="text"
            required
            autoFocus
            value={cloneName}
            onChange={(e) => onChangeName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Digite o nome da nova campanha"
          />
        </div>

        <div>
          <label htmlFor="clone-description" className="block text-sm font-medium text-gray-700 mb-1">
            Descrição (opcional)
          </label>
          <textarea
            id="clone-description"
            rows={3}
            value={cloneDescription}
            onChange={(e) => onChangeDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            placeholder="Adicione uma descrição"
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            <strong>O que será clonado:</strong> Todos os produtos ({campaign?._count?.products || 0}) com seus nomes, preços e pesos.
          </p>
          <p className="text-sm text-blue-800 mt-2">
            <strong>O que NÃO será clonado:</strong> Data limite, pedidos, frete e mensagens.
          </p>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={isPending || !cloneName.trim()} className="flex-1 whitespace-nowrap">
            {isPending ? 'Clonando...' : 'Clonar Campanha'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="whitespace-nowrap"
          >
            Cancelar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
