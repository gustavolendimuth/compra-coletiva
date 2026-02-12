import {
  ClipboardList,
  Copy,
  QrCode,
  FileText,
  Lock,
  Unlock,
  Send,
  Package,
  ShoppingBag,
  MapPin,
} from "lucide-react";
import { useState } from "react";
import IconButton from "@/components/IconButton";
import { Campaign, campaignApi } from "@/api";
import toast from "react-hot-toast";

interface CampaignActionButtonsProps {
  campaign: Campaign;
  canEditCampaign: boolean;
  canGenerateOrdersSummary: boolean;
  ordersCount: number;
  onEditPix: () => void;
  onCloseCampaign: () => void;
  onReopenCampaign: () => void;
  onMarkAsSent: () => void;
  onCloneCampaign: () => void;
  onAddProduct?: () => void;
  onAddOrder?: () => void;
  onEditAddress?: () => void;
}

export function CampaignActionButtons({
  campaign,
  canEditCampaign,
  canGenerateOrdersSummary,
  ordersCount,
  onEditPix,
  onCloseCampaign,
  onReopenCampaign,
  onMarkAsSent,
  onCloneCampaign,
  onAddProduct,
  onAddOrder,
  onEditAddress,
}: CampaignActionButtonsProps) {
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const isActive = campaign.status === "ACTIVE";
  const isClosed = campaign.status === "CLOSED";
  const isSent = campaign.status === "SENT";

  const copyToClipboard = async (text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  };

  return (
    <div className="space-y-3">
      {/* Primary Actions - Grid for mobile, flex for desktop */}
      {isActive && (onAddProduct || onAddOrder) && (
        <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:gap-2">
          {canEditCampaign && onAddProduct && (
            <IconButton
              size="sm"
              icon={<Package className="w-4 h-4" />}
              onClick={onAddProduct}
              className="w-full md:w-auto text-xs sm:text-sm font-medium"
            >
              <span className="md:inline">Adicionar Produto</span>
              <span className="hidden sm:inline md:hidden">Produto</span>
            </IconButton>
          )}
          {onAddOrder && (
            <IconButton
              size="sm"
              icon={<ShoppingBag className="w-4 h-4" />}
              onClick={onAddOrder}
              className="w-full md:w-auto text-xs sm:text-sm font-medium"
              title="Adicionar Pedido (Alt+N)"
            >
              <span className="md:inline">Adicionar Pedido</span>
              <span className="hidden sm:inline md:hidden">Pedido</span>
            </IconButton>
          )}
        </div>
      )}

      {/* Secondary Actions */}
      <div className="flex flex-wrap gap-2">
        <IconButton
          size="sm"
          variant="secondary"
          icon={<Copy className="w-4 h-4" />}
          onClick={onCloneCampaign}
          className="text-xs sm:text-sm whitespace-nowrap"
        >
          <span className="hidden sm:inline">Clonar Campanha</span>
          <span className="sm:hidden">Clonar</span>
        </IconButton>

        {canEditCampaign && (
          <IconButton
            size="sm"
            variant="secondary"
            icon={<QrCode className="w-4 h-4" />}
            onClick={onEditPix}
            className="text-xs sm:text-sm whitespace-nowrap"
          >
            <span className="hidden sm:inline">Configurar PIX</span>
            <span className="sm:hidden">PIX</span>
          </IconButton>
        )}

        {canEditCampaign && onEditAddress && (
          <IconButton
            size="sm"
            variant="secondary"
            icon={<MapPin className="w-4 h-4" />}
            onClick={onEditAddress}
            className="text-xs sm:text-sm whitespace-nowrap"
          >
            <span className="hidden sm:inline">Endereço de Retirada</span>
            <span className="sm:hidden">Endereço</span>
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
                toast.success("Fatura gerada com sucesso!");
              } catch (error) {
                toast.error("Erro ao gerar fatura");
              }
            }}
            className="text-xs sm:text-sm whitespace-nowrap"
          >
            <span className="hidden sm:inline">Gerar Fatura</span>
            <span className="sm:hidden">Fatura</span>
          </IconButton>
        )}

        {ordersCount > 0 && canGenerateOrdersSummary && (
          <IconButton
            size="sm"
            variant="secondary"
            icon={<ClipboardList className="w-4 h-4" />}
            onClick={async () => {
              try {
                setIsGeneratingSummary(true);
                const summary = await campaignApi.getOrdersSummary(campaign.slug || campaign.id);
                await copyToClipboard(summary.summaryText);
                toast.success("Resumo copiado! Pronto para enviar no WhatsApp.");
              } catch (error) {
                toast.error("Erro ao gerar resumo dos pedidos");
              } finally {
                setIsGeneratingSummary(false);
              }
            }}
            disabled={isGeneratingSummary}
            className="text-xs sm:text-sm whitespace-nowrap"
          >
            <span className="hidden sm:inline">
              {isGeneratingSummary ? "Gerando Resumo..." : "Copiar Resumo Pedidos"}
            </span>
            <span className="sm:hidden">
              {isGeneratingSummary ? "Gerando..." : "Resumo"}
            </span>
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
            <span className="hidden sm:inline">Fechar Campanha</span>
            <span className="sm:hidden">Fechar</span>
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
              <span className="hidden sm:inline">Marcar como Enviado</span>
              <span className="sm:hidden">Enviado</span>
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
            <span className="hidden sm:inline">Reabrir Campanha</span>
            <span className="sm:hidden">Reabrir</span>
          </IconButton>
        )}
      </div>
    </div>
  );
}
