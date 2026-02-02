'use client';

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  AlertCircle,
  Calendar,
  Clock,
  Image as ImageIcon,
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

export function CampaignHeader({
  campaign,
  canEditCampaign,
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

  const isActive = campaign.status === "ACTIVE";
  const isClosed = campaign.status === "CLOSED";

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
        href="/campanhas"
        className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-3 md:mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar
      </Link>

      {/* Layout: Imagem à esquerda + Título/Descrição à direita */}
      <div className="flex flex-row gap-3 md:gap-4 mb-4">
        {/* Imagem da Campanha - Quadrado à esquerda */}
        {imageUrl ? (
          <div className="relative flex-shrink-0 w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden bg-gray-100 shadow-sm">
            <img
              src={imageUrl}
              alt={campaign.name}
              className="w-full h-full object-cover"
            />
            {canEditCampaign && (
              <button
                onClick={onImageUpload}
                className="absolute top-1 right-1 p-1 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors border border-gray-200"
                title="Alterar imagem"
              >
                <Edit className="w-3 h-3 text-gray-700" />
              </button>
            )}
          </div>
        ) : canEditCampaign ? (
          <button
            onClick={onImageUpload}
            className="flex-shrink-0 w-24 h-24 md:w-32 md:h-32 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all duration-200 flex flex-col items-center justify-center gap-1 bg-gray-50"
            title="Adicionar imagem da campanha"
          >
            <ImageIcon className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
            <span className="text-xs text-gray-500 hidden md:block">Adicionar</span>
          </button>
        ) : null}

        {/* Conteúdo: Apenas Nome no mobile, Nome + Descrição + Deadline no desktop */}
        <div className="flex-1 min-w-0 h-24 md:h-auto flex flex-col justify-center">
          {/* Nome */}
          {isEditingName ? (
            <div className="mb-1 md:mb-2">
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
                className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 px-2 py-1 border-2 border-primary-500"
              />
              <p className="text-xs text-gray-500 mt-1 hidden md:block">
                Pressione Enter para salvar, Esc para cancelar
              </p>
            </div>
          ) : (
            <h1
              className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-0 md:mb-2 cursor-pointer hover:text-primary-600 transition-colors line-clamp-2 leading-tight"
              onClick={handleNameClick}
              title="Clique para editar"
            >
              {campaign.name}
            </h1>
          )}

          {/* Descrição - Hidden on mobile, shown on desktop (only when not editing) */}
          {!isEditingDescription && (
            <>
              {campaign.description ? (
                <p
                  className="hidden md:block text-sm text-gray-600 mb-1 md:mb-2 cursor-pointer hover:text-primary-600 transition-colors"
                  onClick={handleDescriptionClick}
                  title="Clique para editar"
                >
                  {campaign.description}
                </p>
              ) : (
                <p
                  className="hidden md:block text-sm text-gray-400 mb-1 md:mb-2 cursor-pointer hover:text-primary-400 transition-colors italic"
                  onClick={handleDescriptionClick}
                  title="Clique para adicionar descrição"
                >
                  Clique para adicionar descrição
                </p>
              )}
            </>
          )}

          {/* Deadline - Hidden on mobile in this section, shown below */}
          {campaign.deadline && (
            <div
              className={`hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-lg font-medium mt-2 ${
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
              className="mt-2 hidden md:inline-flex"
            >
              Adicionar data limite
            </IconButton>
          )}
        </div>
      </div>

      {/* Descrição - Below image on mobile, inline on desktop */}
      {isEditingDescription ? (
        <div className="mb-4">
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
        <div className="md:hidden mb-4">
          {campaign.description ? (
            <p
              className="text-sm text-gray-600 cursor-pointer hover:text-primary-600 transition-colors"
              onClick={handleDescriptionClick}
              title="Clique para editar"
            >
              {campaign.description}
            </p>
          ) : (
            <p
              className="text-sm text-gray-400 cursor-pointer hover:text-primary-400 transition-colors italic"
              onClick={handleDescriptionClick}
              title="Clique para adicionar descrição"
            >
              Clique para adicionar descrição
            </p>
          )}
        </div>
      )}

      {/* Mobile-only sections below */}
      <div className="md:hidden space-y-4 mb-4">

        {/* Deadline on mobile */}
        {campaign.deadline && (
          <div
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg font-medium ${
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

        {/* Botão adicionar deadline no mobile */}
        {!campaign.deadline && isActive && canEditCampaign && (
          <IconButton
            size="sm"
            variant="secondary"
            icon={<Calendar className="w-4 h-4" />}
            onClick={onEditDeadline}
          >
            Adicionar data limite
          </IconButton>
        )}
      </div>

      {/* Endereço de retirada resumido */}
      {campaign.pickupAddress && (
        <div className="text-sm text-gray-500 flex items-center gap-1 mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4 flex-shrink-0"
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
          <span className="truncate">
            {campaign.pickupAddress}
            {campaign.pickupAddressNumber ? `, ${campaign.pickupAddressNumber}` : ''}
            {campaign.pickupCity ? ` - ${campaign.pickupCity}` : ''}
            {campaign.pickupState ? `, ${campaign.pickupState}` : ''}
          </span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mb-4">
        <CampaignActionButtons
          campaign={campaign}
          canEditCampaign={canEditCampaign}
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
