import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Edit, Lock, Unlock, Send, AlertCircle, Calendar, Clock, FileText, Copy } from 'lucide-react';
import IconButton from '@/components/IconButton';
import { Campaign, campaignApi } from '@/api';
import toast from 'react-hot-toast';

interface CampaignHeaderProps {
  campaign: Campaign;
  canEditCampaign: boolean;
  ordersCount: number;
  onEditDeadline: () => void;
  onCloseCampaign: () => void;
  onReopenCampaign: () => void;
  onMarkAsSent: () => void;
  onUpdateCampaign: (data: { name?: string; description?: string }) => void;
  onCloneCampaign: () => void;
}

export function CampaignHeader({
  campaign,
  canEditCampaign,
  ordersCount,
  onEditDeadline,
  onCloseCampaign,
  onReopenCampaign,
  onMarkAsSent,
  onUpdateCampaign,
  onCloneCampaign,
}: CampaignHeaderProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');

  const isActive = campaign.status === 'ACTIVE';
  const isClosed = campaign.status === 'CLOSED';
  const isSent = campaign.status === 'SENT';

  const handleNameClick = () => {
    if (!canEditCampaign) {
      toast.error('Apenas o criador da campanha pode editar o nome');
      return;
    }
    setEditedName(campaign.name);
    setIsEditingName(true);
  };

  const handleNameSave = () => {
    if (editedName.trim() && editedName !== campaign.name) {
      onUpdateCampaign({ name: editedName.trim() });
    }
    setIsEditingName(false);
  };

  const handleDescriptionClick = () => {
    if (!canEditCampaign) {
      toast.error('Apenas o criador da campanha pode editar a descrição');
      return;
    }
    setEditedDescription(campaign.description || '');
    setIsEditingDescription(true);
  };

  const handleDescriptionSave = () => {
    if (editedDescription.trim() !== campaign.description) {
      onUpdateCampaign({ description: editedDescription.trim() || undefined });
    }
    setIsEditingDescription(false);
  };

  return (
    <div className="mb-4 md:mb-6">
      <Link to="/campaigns" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-3 md:mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar
      </Link>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div className="flex-1">
          {/* Nome */}
          {isEditingName ? (
            <div className="mb-2">
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onBlur={handleNameSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleNameSave();
                  } else if (e.key === 'Escape') {
                    setIsEditingName(false);
                  }
                }}
                autoFocus
                className="text-3xl font-bold text-gray-900 w-full px-2 py-1 border-2 border-primary-500 rounded focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">Pressione Enter para salvar, Esc para cancelar</p>
            </div>
          ) : (
            <h1
              className="text-3xl font-bold text-gray-900 mb-2 cursor-pointer hover:text-primary-600 transition-colors inline-block"
              onClick={handleNameClick}
              title="Clique para editar"
            >
              {campaign.name}
            </h1>
          )}

          {/* Descrição */}
          {isEditingDescription ? (
            <div className="mb-2">
              <textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                onBlur={handleDescriptionSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleDescriptionSave();
                  } else if (e.key === 'Escape') {
                    setIsEditingDescription(false);
                  }
                }}
                autoFocus
                rows={3}
                className="text-gray-600 w-full px-2 py-1 border-2 border-primary-500 rounded focus:outline-none resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Pressione Enter para salvar, Shift+Enter para nova linha, Esc para cancelar
              </p>
            </div>
          ) : (
            <>
              {campaign.description ? (
                <p
                  className="text-gray-600 mb-2 cursor-pointer hover:text-primary-600 transition-colors"
                  onClick={handleDescriptionClick}
                  title="Clique para editar"
                >
                  {campaign.description}
                </p>
              ) : (
                <p
                  className="text-gray-400 mb-2 cursor-pointer hover:text-primary-400 transition-colors italic"
                  onClick={handleDescriptionClick}
                  title="Clique para adicionar descrição"
                >
                  Clique para adicionar descrição
                </p>
              )}
            </>
          )}

          {/* Deadline */}
          {campaign.deadline && (
            <div
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg font-medium mt-4 ${
                new Date(campaign.deadline) < new Date()
                  ? 'bg-red-100 text-red-800 border border-red-300'
                  : new Date(campaign.deadline).getTime() - new Date().getTime() < 24 * 60 * 60 * 1000
                  ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                  : 'bg-blue-100 text-blue-800 border border-blue-300'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span className="text-sm">
                Data limite:{' '}
                {new Date(campaign.deadline).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}{' '}
                às{' '}
                {new Date(campaign.deadline).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                })}
              </span>
              {canEditCampaign && (
                <IconButton
                  size="sm"
                  variant="ghost"
                  icon={<Edit className="w-3 h-3" />}
                  onClick={onEditDeadline}
                  title="Editar data limite"
                  className="!p-1"
                />
              )}
            </div>
          )}
          {!campaign.deadline && isActive && canEditCampaign && (
            <IconButton
              size="sm"
              variant="secondary"
              icon={<Calendar className="w-4 h-4" />}
              onClick={onEditDeadline}
              className="mt-4"
            >
              Adicionar data limite
            </IconButton>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {canEditCampaign && (
            <IconButton
              size="sm"
              variant="secondary"
              icon={<Copy className="w-4 h-4" />}
              onClick={onCloneCampaign}
              className="text-xs sm:text-sm whitespace-nowrap"
            >
              Clonar Campanha
            </IconButton>
          )}

          {ordersCount > 0 && canEditCampaign && (
            <IconButton
              size="sm"
              variant="secondary"
              icon={<FileText className="w-4 h-4" />}
              onClick={async () => {
                try {
                  await campaignApi.downloadSupplierInvoice(campaign.id);
                  toast.success('Fatura gerada com sucesso!');
                } catch (error) {
                  toast.error('Erro ao gerar fatura');
                }
              }}
              className="text-xs sm:text-sm whitespace-nowrap"
            >
              Gerar Fatura
            </IconButton>
          )}

          {isActive && canEditCampaign && (
            <IconButton
              size="sm"
              icon={<Lock className="w-4 h-4" />}
              onClick={onCloseCampaign}
              variant="warning"
              className="text-xs sm:text-sm whitespace-nowrap"
            >
              Fechar Campanha
            </IconButton>
          )}

          {isClosed && canEditCampaign && (
            <>
              <IconButton
                size="sm"
                icon={<Unlock className="w-4 h-4" />}
                onClick={onReopenCampaign}
                variant="warning"
                className="text-xs sm:text-sm whitespace-nowrap"
              >
                Reabrir
              </IconButton>
              <IconButton
                size="sm"
                icon={<Send className="w-4 h-4" />}
                onClick={onMarkAsSent}
                className="text-xs sm:text-sm whitespace-nowrap"
              >
                Marcar como Enviado
              </IconButton>
            </>
          )}

          {isSent && canEditCampaign && (
            <IconButton
              size="sm"
              icon={<Unlock className="w-4 h-4" />}
              onClick={onReopenCampaign}
              variant="warning"
              className="text-xs sm:text-sm whitespace-nowrap"
            >
              Reabrir Campanha
            </IconButton>
          )}
        </div>
      </div>

      {/* Alert Banner */}
      {!isActive && (
        <div
          className={`rounded-lg p-4 mb-4 flex items-start gap-3 ${
            isClosed ? 'bg-yellow-50 border border-yellow-200' : 'bg-blue-50 border border-blue-200'
          }`}
        >
          <AlertCircle
            className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isClosed ? 'text-yellow-600' : 'text-blue-600'}`}
          />
          <div>
            <h3 className={`font-semibold mb-1 ${isClosed ? 'text-yellow-900' : 'text-blue-900'}`}>
              {isClosed ? 'Campanha Fechada' : 'Campanha Enviada'}
            </h3>
            <p className={`text-sm ${isClosed ? 'text-yellow-800' : 'text-blue-800'}`}>
              {isClosed
                ? 'Esta campanha está fechada. Não é possível adicionar ou alterar produtos e pedidos.'
                : 'Esta campanha foi marcada como enviada. Não é possível adicionar ou alterar produtos e pedidos.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
