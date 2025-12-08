import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Lock,
  Unlock,
  Send,
  AlertCircle,
  Calendar,
  Clock,
  FileText,
  Copy,
  Image as ImageIcon,
} from "lucide-react";
import IconButton from "@/components/IconButton";
import { Input, Textarea } from "@/components/ui";
import { Campaign, campaignApi } from "@/api";
import toast from "react-hot-toast";

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
  onImageUpload: () => void;
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
  onImageUpload,
}: CampaignHeaderProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedDescription, setEditedDescription] = useState("");

  const isActive = campaign.status === "ACTIVE";
  const isClosed = campaign.status === "CLOSED";
  const isSent = campaign.status === "SENT";

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  
  // Build full image URL (handle local storage paths)
  const getImageUrl = (imageUrl?: string) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) return imageUrl; // S3 URL
    return `${apiUrl.replace(/\/api$/, '')}${imageUrl}`; // Local storage
  };

  const imageUrl = getImageUrl(campaign.imageUrl);

  const handleNameClick = () => {
    if (!canEditCampaign) {
      toast.error("Apenas o criador da campanha pode editar o nome");
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
      toast.error("Apenas o criador da campanha pode editar a descrição");
      return;
    }
    setEditedDescription(campaign.description || "");
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
      <Link
        to="/campaigns"
        className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-3 md:mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar
      </Link>

      {/* Imagem da Campanha */}
      {imageUrl && (
        <div className="mb-4 md:mb-6 relative">
          <div className="w-full aspect-video md:aspect-[3/1] rounded-xl overflow-hidden bg-gray-100">
            <img
              src={imageUrl}
              alt={campaign.name}
              className="w-full h-full object-cover"
            />
          </div>
          {canEditCampaign && (
            <button
              onClick={onImageUpload}
              className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg hover:bg-white transition-colors"
              title="Alterar imagem"
            >
              <Edit className="w-4 h-4 text-gray-700" />
            </button>
          )}
        </div>
      )}

      {!imageUrl && canEditCampaign && (
        <button
          onClick={onImageUpload}
          className="w-full mb-4 md:mb-6 aspect-video md:aspect-[3/1] border-2 border-dashed border-gray-300 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-all duration-200 flex flex-col items-center justify-center gap-3 bg-gray-50"
        >
          <div className="p-3 bg-white rounded-full border-2 border-gray-300">
            <ImageIcon className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
          </div>
          <div className="text-center px-4">
            <p className="text-sm md:text-base font-medium text-gray-700 mb-1">
              Adicionar imagem da campanha
            </p>
            <p className="text-xs md:text-sm text-gray-500">
              Clique para fazer upload
            </p>
          </div>
        </button>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div className="flex-1">
          {/* Nome */}
          {isEditingName ? (
            <div className="mb-2">
              <Input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onBlur={handleNameSave}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleNameSave();
                  } else if (e.key === "Escape") {
                    setIsEditingName(false);
                  }
                }}
                autoFocus
                className="text-3xl font-bold text-gray-900 px-2 py-1 border-2 border-primary-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Pressione Enter para salvar, Esc para cancelar
              </p>
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
              <Textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                onBlur={handleDescriptionSave}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleDescriptionSave();
                  } else if (e.key === "Escape") {
                    setIsEditingDescription(false);
                  }
                }}
                autoFocus
                rows={3}
                className="text-gray-600 px-2 py-1 border-2 border-primary-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Pressione Enter para salvar, Shift+Enter para nova linha, Esc
                para cancelar
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
                  ? "bg-red-100 text-red-800 border border-red-300"
                  : new Date(campaign.deadline).getTime() -
                      new Date().getTime() <
                    24 * 60 * 60 * 1000
                  ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                  : "bg-blue-100 text-blue-800 border border-blue-300"
              }`}
            >
              <Clock className="w-4 h-4" />
              <span className="text-sm">
                Data limite:{" "}
                {new Date(campaign.deadline).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}{" "}
                às{" "}
                {new Date(campaign.deadline).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
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
          <IconButton
            size="sm"
            variant="secondary"
            icon={<Copy className="w-4 h-4" />}
            onClick={onCloneCampaign}
            className="text-xs sm:text-sm whitespace-nowrap"
          >
            Clonar Campanha
          </IconButton>

          {ordersCount > 0 && canEditCampaign && (
            <IconButton
              size="sm"
              variant="secondary"
              icon={<FileText className="w-4 h-4" />}
              onClick={async () => {
                try {
                  await campaignApi.downloadSupplierInvoice(campaign.id);
                  toast.success("Fatura gerada com sucesso!");
                } catch (error) {
                  toast.error("Erro ao gerar fatura");
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
            isClosed
              ? "bg-yellow-50 border border-yellow-200"
              : "bg-blue-50 border border-blue-200"
          }`}
        >
          <AlertCircle
            className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
              isClosed ? "text-yellow-600" : "text-blue-600"
            }`}
          />
          <div>
            <h3
              className={`font-semibold mb-1 ${
                isClosed ? "text-yellow-900" : "text-blue-900"
              }`}
            >
              {isClosed ? "Campanha Fechada" : "Campanha Enviada"}
            </h3>
            <p
              className={`text-sm ${
                isClosed ? "text-yellow-800" : "text-blue-800"
              }`}
            >
              {isClosed
                ? "Esta campanha está fechada. Não é possível adicionar ou alterar produtos e pedidos."
                : "Esta campanha foi marcada como enviada. Não é possível adicionar ou alterar produtos e pedidos."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
