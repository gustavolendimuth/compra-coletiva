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
  Package,
  MapPin,
} from "lucide-react";
import IconButton from "@/components/IconButton";
import { Input, Textarea } from "@/components/ui";
import { Campaign } from "@/api";
import { getImageUrl } from "@/lib/imageUrl";
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

function StatusBadge({ status }: { status: Campaign["status"] }) {
  const config = {
    ACTIVE: {
      icon: <CheckCircle2 className="w-5 h-5" />,
      label: "Campanha Ativa",
      className: "bg-emerald-100 text-emerald-800 border border-emerald-300",
    },
    CLOSED: {
      icon: <Lock className="w-5 h-5" />,
      label: "Campanha Fechada",
      className: "bg-amber-100 text-amber-800 border border-amber-300",
    },
    SENT: {
      icon: <Package className="w-5 h-5" />,
      label: "Pedido Enviado",
      className: "bg-sky-100 text-sky-800 border border-sky-300",
    },
    ARCHIVED: {
      icon: <Lock className="w-5 h-5" />,
      label: "Arquivada",
      className: "bg-gray-100 text-gray-700 border border-gray-300",
    },
  };

  const { icon, label, className } = config[status] ?? config.ARCHIVED;

  return (
    <span
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-base font-semibold ${className}`}
    >
      {icon}
      {label}
    </span>
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

  const isActive = campaign.status === "ACTIVE";

  const imageUrl = getImageUrl(campaign.imageUrl);
  const shouldShowImage = Boolean(imageUrl) && !isImageUnavailable;

  useEffect(() => {
    setIsImageUnavailable(false);
  }, [imageUrl]);

  const handleNameSave = () => {
    if (editedName.trim() && editedName !== campaign.name) {
      onUpdateCampaign({ name: editedName.trim() });
    }
    setIsEditingName(false);
  };

  const handleDescriptionSave = () => {
    if (editedDescription.trim() !== campaign.description) {
      onUpdateCampaign({ description: editedDescription.trim() || undefined });
    }
    setIsEditingDescription(false);
  };

  const deadlineDate = campaign.deadline ? new Date(campaign.deadline) : null;
  const now = new Date();
  const deadlineExpired = deadlineDate && deadlineDate < now;
  const deadlineSoon =
    deadlineDate &&
    !deadlineExpired &&
    deadlineDate.getTime() - now.getTime() < 24 * 60 * 60 * 1000;

  return (
    <div className="space-y-5">
      {/* Voltar */}
      <Link
        href="/campanhas"
        className="inline-flex items-center gap-2 text-sky-700 hover:text-sky-900 font-semibold text-base transition-colors py-1"
      >
        <ArrowLeft className="w-5 h-5" />
        Voltar para campanhas
      </Link>

      {/* Status Badge */}
      <div>
        <StatusBadge status={campaign.status} />
      </div>

      {/* Alert Banner — campanhas não ativas */}
      {campaign.status !== "ACTIVE" && (
        <div
          className={`rounded-2xl p-4 flex items-start gap-3 ${
            campaign.status === "CLOSED"
              ? "bg-amber-50 border border-amber-200"
              : "bg-sky-50 border border-sky-200"
          }`}
        >
          <AlertCircle
            className={`w-6 h-6 flex-shrink-0 mt-0.5 ${
              campaign.status === "CLOSED" ? "text-amber-600" : "text-sky-600"
            }`}
          />
          <p
            className={`text-base ${
              campaign.status === "CLOSED"
                ? "text-amber-900"
                : "text-sky-900"
            }`}
          >
            {campaign.status === "CLOSED"
              ? "Esta campanha foi fechada. Não é possível adicionar ou alterar produtos e pedidos."
              : "Esta campanha foi marcada como enviada. A fatura foi enviada ao fornecedor."}
          </p>
        </div>
      )}

      {/* Hero Image */}
      <div className="rounded-2xl overflow-hidden bg-sky-50 border border-sky-100 shadow-sm">
        {shouldShowImage ? (
          <div className="relative">
            <img
              src={imageUrl || undefined}
              alt={campaign.name}
              className="w-full h-48 md:h-64 object-cover"
              onError={() => setIsImageUnavailable(true)}
            />
            {canEditCampaign && (
              <div className="absolute bottom-3 right-3">
                <button
                  onClick={onImageUpload}
                  className="flex items-center gap-2 px-4 py-2 bg-white/95 rounded-xl shadow-md border border-sky-100 text-sky-700 font-semibold text-sm hover:bg-sky-50 transition-colors"
                >
                  <ImageIcon className="w-4 h-4" />
                  Alterar Foto
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="h-32 md:h-48 flex flex-col items-center justify-center gap-3">
            <ImageIcon className="w-10 h-10 text-sky-300" />
            {canEditCampaign && (
              <button
                onClick={onImageUpload}
                className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-semibold text-base transition-colors"
              >
                <ImageIcon className="w-5 h-5" />
                Adicionar Foto da Campanha
              </button>
            )}
            {!canEditCampaign && (
              <span className="text-sky-400 text-sm">Sem imagem</span>
            )}
          </div>
        )}
      </div>

      {/* Título */}
      <div>
        {isEditingName ? (
          <div className="space-y-2">
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
              className="text-2xl md:text-3xl font-bold text-sky-900 px-3 py-2 border-2 border-sky-400"
            />
            <p className="text-sm text-sky-500">
              Pressione Enter para salvar ou Esc para cancelar
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-sky-900 flex-1 leading-tight">
              {campaign.name}
            </h1>
            {canEditCampaign && (
              <button
                onClick={() => {
                  setEditedName(campaign.name);
                  setIsEditingName(true);
                }}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 border border-sky-200 bg-white hover:bg-sky-50 rounded-xl text-sky-700 font-medium text-sm transition-colors mt-0.5"
                title="Editar nome da campanha"
              >
                <Edit className="w-4 h-4" />
                Editar
              </button>
            )}
          </div>
        )}
      </div>

      {/* Descrição */}
      <div>
        {isEditingDescription ? (
          <div className="space-y-2">
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
              className="text-base text-sky-700 px-3 py-2 border-2 border-sky-400"
            />
            <p className="text-sm text-sky-500">
              Enter para salvar · Shift+Enter para nova linha · Esc para cancelar
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <div className="flex-1">
              {campaign.description ? (
                <p className="text-base text-sky-700 leading-relaxed">
                  {campaign.description}
                </p>
              ) : (
                <p className="text-base text-sky-400 italic">
                  Nenhuma descrição adicionada.
                </p>
              )}
            </div>
            {canEditCampaign && (
              <button
                onClick={() => {
                  setEditedDescription(campaign.description || "");
                  setIsEditingDescription(true);
                }}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 border border-sky-200 bg-white hover:bg-sky-50 rounded-xl text-sky-700 font-medium text-sm transition-colors"
                title="Editar descrição"
              >
                <Edit className="w-4 h-4" />
                {campaign.description ? "Editar" : "Adicionar"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Deadline */}
      {deadlineDate && (
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-medium ${
            deadlineExpired
              ? "bg-red-50 border border-red-200 text-red-800"
              : deadlineSoon
              ? "bg-yellow-50 border border-yellow-200 text-yellow-800"
              : "bg-sky-50 border border-sky-200 text-sky-800"
          }`}
        >
          <Clock className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1">
            <span className="text-sm font-semibold block">Data limite:</span>
            <span className="text-base">
              {deadlineDate.toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}{" "}
              às{" "}
              {deadlineDate.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })}
            </span>
          </div>
          {canEditCampaign && (
            <button
              onClick={onEditDeadline}
              className="flex items-center gap-1.5 px-3 py-2 border border-current/30 rounded-xl text-sm font-medium hover:bg-white/50 transition-colors"
            >
              <Edit className="w-4 h-4" />
              Editar
            </button>
          )}
        </div>
      )}

      {!campaign.deadline && isActive && canEditCampaign && (
        <button
          onClick={onEditDeadline}
          className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-sky-300 hover:border-sky-500 hover:bg-sky-50 rounded-2xl text-sky-600 font-medium text-base transition-colors w-full justify-center"
        >
          <Calendar className="w-5 h-5" />
          Adicionar Data Limite
        </button>
      )}

      {/* Endereço de Retirada */}
      {campaign.pickupAddress && (
        <div className="flex items-start gap-3 px-4 py-3 bg-sky-50 border border-sky-100 rounded-2xl">
          <MapPin className="w-5 h-5 text-sky-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <span className="block text-sm font-semibold text-sky-700 mb-0.5">
              Local de Retirada
            </span>
            <span className="text-base text-sky-800">
              {campaign.pickupAddress}
              {campaign.pickupAddressNumber ? `, ${campaign.pickupAddressNumber}` : ""}
              {campaign.pickupCity ? ` — ${campaign.pickupCity}` : ""}
              {campaign.pickupState ? `, ${campaign.pickupState}` : ""}
            </span>
          </div>
          {canEditCampaign && onEditAddress && (
            <button
              onClick={onEditAddress}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 border border-sky-200 bg-white hover:bg-sky-50 rounded-xl text-sky-700 font-medium text-sm transition-colors"
            >
              <Edit className="w-4 h-4" />
              Editar
            </button>
          )}
        </div>
      )}

      {/* Action Buttons */}
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
  );
}
