'use client';
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  AlertCircle,
  Calendar,
  Clock,
  Image as ImageIcon,
  CheckCircle2,
  Lock,
  Send,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import IconButton from "@/components/IconButton";
import { Input, Textarea } from "@/components/ui";
import { Campaign } from "@/api";
import { getImageUrl } from "@/lib/imageUrl";
import toast from "react-hot-toast";
import { CampaignActionButtons } from "./CampaignActionButtons";

interface CampaignHeaderProps {
  campaign: Campaign;
  canEditCampaign: boolean;
  canGenerateOrdersSummary: boolean;
  ordersCount: number;
  onEditDeadline: () => void;
  onEditPix: () => void;
  onCloseCampaign: () => void;
  onReopenCampaign: () => void;
  onMarkAsSent: () => void;
  onUpdateCampaign: (data: { name?: string; description?: string }) => void;
  onCloneCampaign: () => void;
  onImageUpload: () => void;
  onAddProduct?: () => void;
  onAddOrder?: () => void;
  onEditAddress?: () => void;
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    ACTIVE: {
      icon: CheckCircle2,
      label: "Campanha Aberta",
      classes: "bg-emerald-50 text-emerald-800 border-emerald-200 ring-emerald-100",
      dot: "bg-emerald-500 animate-pulse",
    },
    CLOSED: {
      icon: Lock,
      label: "Campanha Fechada",
      classes: "bg-amber-50 text-amber-800 border-amber-200 ring-amber-100",
      dot: "bg-amber-500",
    },
    SENT: {
      icon: Send,
      label: "Pedido Enviado",
      classes: "bg-sky-50 text-sky-800 border-sky-200 ring-sky-100",
      dot: "bg-sky-500",
    },
    ARCHIVED: {
      icon: Lock,
      label: "Arquivada",
      classes: "bg-gray-50 text-gray-700 border-gray-200 ring-gray-100",
      dot: "bg-gray-400",
    },
  }[status] || {
    icon: AlertCircle,
    label: status,
    classes: "bg-gray-50 text-gray-700 border-gray-200 ring-gray-100",
    dot: "bg-gray-400",
  };

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm md:text-base font-semibold border ring-2 ${config.classes}`}
    >
      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${config.dot}`} />
      <Icon className="w-4 h-4 md:w-5 md:h-5" />
      {config.label}
    </span>
  );
}

function DeadlineBadge({
  deadline,
  canEdit,
  onEdit,
}: {
  deadline: string;
  canEdit: boolean;
  onEdit: () => void;
}) {
  const deadlineDate = new Date(deadline);
  const now = new Date();
  const isExpired = deadlineDate < now;
  const isUrgent =
    !isExpired && deadlineDate.getTime() - now.getTime() < 24 * 60 * 60 * 1000;

  const colorClasses = isExpired
    ? "bg-red-50 border-red-200 text-red-800"
    : isUrgent
      ? "bg-amber-50 border-amber-200 text-amber-800"
      : "bg-cream-100 border-sky-200 text-sky-800";

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${colorClasses}`}
    >
      <Clock className="w-5 h-5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="text-xs font-medium uppercase tracking-wide opacity-70">
          Data limite
        </span>
        <p className="text-base md:text-lg font-semibold">
          {deadlineDate.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}{" "}
          as{" "}
          {deadlineDate.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })}
        </p>
      </div>
      {canEdit && (
        <button
          onClick={onEdit}
          className="p-2 rounded-xl hover:bg-black/5 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          title="Editar data limite"
        >
          <Edit className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export function CampaignHeader({
  campaign,
  canEditCampaign,
  canGenerateOrdersSummary,
  ordersCount,
  onEditDeadline,
  onEditPix,
  onCloseCampaign,
  onReopenCampaign,
  onMarkAsSent,
  onUpdateCampaign,
  onCloneCampaign,
  onImageUpload,
  onAddProduct,
  onAddOrder,
  onEditAddress,
}: CampaignHeaderProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [isImageUnavailable, setIsImageUnavailable] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const isActive = campaign.status === "ACTIVE";
  const isClosed = campaign.status === "CLOSED";

  const imageUrl = getImageUrl(campaign.imageUrl);
  const shouldShowImage = Boolean(imageUrl) && !isImageUnavailable;

  useEffect(() => {
    setIsImageUnavailable(false);
  }, [imageUrl]);

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
      toast.error("Apenas o criador da campanha pode editar a descricao");
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
    <div className="space-y-4 md:space-y-6">
      {/* Back Button */}
      <Link
        href="/campanhas"
        className="inline-flex items-center gap-2 text-sky-700 hover:text-sky-900 font-medium transition-colors min-h-[48px] text-base"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Voltar para campanhas</span>
      </Link>

      {/* Hero Section */}
      <div className="bg-white rounded-3xl border border-sky-100/80 shadow-sm overflow-hidden">
        {/* Campaign Image - Full width banner */}
        {shouldShowImage ? (
          <div className="relative w-full h-48 md:h-64 lg:h-72 bg-sky-50">
            <img
              src={imageUrl || undefined}
              alt={campaign.name}
              className="w-full h-full object-cover"
              onError={() => setIsImageUnavailable(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
            {canEditCampaign && (
              <button
                onClick={onImageUpload}
                className="absolute top-3 right-3 p-2.5 bg-white/90 backdrop-blur-sm rounded-xl shadow-md hover:bg-white transition-colors border border-white/50 min-w-[44px] min-h-[44px] flex items-center justify-center"
                title="Alterar imagem"
              >
                <Edit className="w-4 h-4 text-sky-700" />
              </button>
            )}
            {/* Status badge overlaid on image */}
            <div className="absolute bottom-4 left-4">
              <StatusBadge status={campaign.status} />
            </div>
          </div>
        ) : (
          <div className="relative w-full">
            {canEditCampaign ? (
              <button
                onClick={onImageUpload}
                className="w-full h-36 md:h-48 border-b-2 border-dashed border-sky-200 hover:border-sky-400 hover:bg-sky-50/50 transition-all duration-200 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-cream-50 to-sky-50/30"
                title="Adicionar imagem da campanha"
              >
                <ImageIcon className="w-10 h-10 text-sky-300" />
                <span className="text-sm text-sky-400 font-medium">
                  Toque para adicionar foto da campanha
                </span>
              </button>
            ) : (
              <div className="w-full h-24 md:h-36 bg-gradient-to-br from-cream-50 to-sky-50/30 flex items-center justify-center border-b border-sky-100">
                <ImageIcon className="w-8 h-8 text-sky-200" />
              </div>
            )}
            {/* Status badge when no image */}
            <div className="absolute bottom-4 left-4">
              <StatusBadge status={campaign.status} />
            </div>
          </div>
        )}

        {/* Campaign Info */}
        <div className="p-5 md:p-8 space-y-4">
          {/* Name */}
          {isEditingName ? (
            <div>
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
                className="text-2xl md:text-3xl font-bold text-sky-900 px-3 py-2 border-2 border-sky-400 rounded-xl"
              />
              <p className="text-sm text-sky-500 mt-2">
                Pressione Enter para salvar, Esc para cancelar
              </p>
            </div>
          ) : (
            <h1
              className={`font-display text-2xl md:text-3xl lg:text-4xl font-bold text-sky-900 leading-tight ${canEditCampaign ? "cursor-pointer hover:text-sky-700 transition-colors" : ""}`}
              onClick={canEditCampaign ? handleNameClick : undefined}
              title={canEditCampaign ? "Clique para editar" : undefined}
            >
              {campaign.name}
            </h1>
          )}

          {/* Description */}
          {isEditingDescription ? (
            <div>
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
                className="text-base text-sky-700 px-3 py-2 border-2 border-sky-400 rounded-xl"
              />
              <p className="text-sm text-sky-500 mt-2">
                Pressione Enter para salvar, Shift+Enter para nova linha, Esc para cancelar
              </p>
            </div>
          ) : (
            <>
              {campaign.description ? (
                <p
                  className={`text-base md:text-lg text-sky-700/80 leading-relaxed ${canEditCampaign ? "cursor-pointer hover:text-sky-600 transition-colors" : ""}`}
                  onClick={canEditCampaign ? handleDescriptionClick : undefined}
                  title={canEditCampaign ? "Clique para editar" : undefined}
                >
                  {campaign.description}
                </p>
              ) : canEditCampaign ? (
                <p
                  className="text-base text-sky-400 cursor-pointer hover:text-sky-500 transition-colors italic"
                  onClick={handleDescriptionClick}
                  title="Clique para adicionar descricao"
                >
                  Toque aqui para adicionar uma descricao
                </p>
              ) : null}
            </>
          )}

          {/* Deadline */}
          {campaign.deadline && (
            <DeadlineBadge
              deadline={campaign.deadline}
              canEdit={canEditCampaign}
              onEdit={onEditDeadline}
            />
          )}
          {!campaign.deadline && isActive && canEditCampaign && (
            <IconButton
              size="md"
              variant="secondary"
              icon={<Calendar className="w-5 h-5" />}
              onClick={onEditDeadline}
              className="min-h-[48px]"
            >
              Adicionar data limite
            </IconButton>
          )}

          {/* Pickup Address Summary */}
          {campaign.pickupAddress && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-cream-50 border border-sky-100/50">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 flex-shrink-0 text-sky-500 mt-0.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium uppercase tracking-wide text-sky-500">
                  Retirada
                </span>
                <p className="text-sm md:text-base text-sky-800 font-medium">
                  {campaign.pickupAddress}
                  {campaign.pickupAddressNumber ? `, ${campaign.pickupAddressNumber}` : ""}
                  {campaign.pickupCity ? ` - ${campaign.pickupCity}` : ""}
                  {campaign.pickupState ? `, ${campaign.pickupState}` : ""}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons - Collapsible on mobile for less clutter */}
      {canEditCampaign && (
        <div className="space-y-3">
          <button
            onClick={() => setShowActions(!showActions)}
            className="md:hidden w-full flex items-center justify-between px-4 py-3 bg-white rounded-2xl border border-sky-100 text-sky-700 font-medium text-base min-h-[48px]"
          >
            <span>Acoes da campanha</span>
            {showActions ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>

          <div className={`${showActions ? "block" : "hidden"} md:block`}>
            <CampaignActionButtons
              campaign={campaign}
              canEditCampaign={canEditCampaign}
              canGenerateOrdersSummary={canGenerateOrdersSummary}
              ordersCount={ordersCount}
              onEditPix={onEditPix}
              onCloseCampaign={onCloseCampaign}
              onReopenCampaign={onReopenCampaign}
              onMarkAsSent={onMarkAsSent}
              onCloneCampaign={onCloneCampaign}
              onAddProduct={onAddProduct}
              onAddOrder={onAddOrder}
              onEditAddress={onEditAddress}
            />
          </div>
        </div>
      )}

      {/* Alert Banner for non-active campaigns */}
      {!isActive && (
        <div
          className={`rounded-2xl p-5 flex items-start gap-4 ${
            isClosed
              ? "bg-amber-50 border-2 border-amber-200"
              : "bg-sky-50 border-2 border-sky-200"
          }`}
        >
          <AlertCircle
            className={`w-6 h-6 flex-shrink-0 mt-0.5 ${
              isClosed ? "text-amber-600" : "text-sky-600"
            }`}
          />
          <div>
            <h3
              className={`text-lg font-semibold mb-1 ${
                isClosed ? "text-amber-900" : "text-sky-900"
              }`}
            >
              {isClosed ? "Campanha Fechada" : "Campanha Enviada"}
            </h3>
            <p
              className={`text-base leading-relaxed ${
                isClosed ? "text-amber-800/80" : "text-sky-800/80"
              }`}
            >
              {isClosed
                ? "Esta campanha foi fechada. A fatura sera enviada ao fornecedor. Nao e possivel adicionar ou alterar produtos e pedidos."
                : "Esta campanha foi marcada como enviada. A fatura foi enviada ao fornecedor. Nao e possivel adicionar ou alterar produtos e pedidos."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
