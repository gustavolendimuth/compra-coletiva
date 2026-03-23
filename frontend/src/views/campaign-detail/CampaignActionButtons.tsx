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
      {/* Primary Actions */}
      {isActive && (onAddProduct || onAddOrder) && (
        <div className="grid grid-cols-2 gap-3 md:flex md:flex-wrap md:gap-3">
          {canEditCampaign && onAddProduct && (
            <IconButton
              size="md"
              icon={<Package className="w-5 h-5" />}
              onClick={onAddProduct}
              className="w-full md:w-auto min-h-[48px] text-sm sm:text-base font-semibold"
            >
              Adicionar Produto
            </IconButton>
          )}
          {onAddOrder && (
            <IconButton
              size="md"
              icon={<ShoppingBag className="w-5 h-5" />}
              onClick={onAddOrder}
              className="w-full md:w-auto min-h-[48px] text-sm sm:text-base font-semibold"
              title="Adicionar Pedido (Alt+N)"
            >
              Adicionar Pedido
            </IconButton>
          )}
        </div>
      )}

      {/* Secondary Actions */}
      <div className="flex flex-wrap gap-2.5">
        <IconButton
          size="sm"
          variant="secondary"
          icon={<Copy className="w-4 h-4" />}
          onClick={onCloneCampaign}
          className="min-h-[44px] text-sm whitespace-nowrap"
        >
          Clonar
        </IconButton>

        {canEditCampaign && (
          <IconButton
            size="sm"
            variant="secondary"
            icon={<QrCode className="w-4 h-4" />}
            onClick={onEditPix}
            className="min-h-[44px] text-sm whitespace-nowrap"
          >
            PIX
          </IconButton>
        )}

        {canEditCampaign && onEditAddress && (
          <IconButton
            size="sm"
            variant="secondary"
            icon={<MapPin className="w-4 h-4" />}
            onClick={onEditAddress}
            className="min-h-[44px] text-sm whitespace-nowrap"
          >
            Endereco
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
            className="min-h-[44px] text-sm whitespace-nowrap"
          >
            Fatura
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
                const summary = await campaignApi.getOrdersSummary(
                  campaign.slug || campaign.id
                );
                await copyToClipboard(summary.summaryText);
                toast.success(
                  "Resumo copiado! Pronto para enviar no WhatsApp."
                );
              } catch (error) {
                toast.error("Erro ao gerar resumo dos pedidos");
              } finally {
                setIsGeneratingSummary(false);
              }
            }}
            disabled={isGeneratingSummary}
            className="min-h-[44px] text-sm whitespace-nowrap"
          >
            {isGeneratingSummary ? "Gerando..." : "Resumo"}
          </IconButton>
        )}

        {isActive && canEditCampaign && (
          <IconButton
            size="sm"
            icon={<Lock className="w-4 h-4" />}
            onClick={onCloseCampaign}
            variant="warning"
            className="min-h-[44px] text-sm whitespace-nowrap"
          >
            Fechar
          </IconButton>
        )}

        {isClosed && canEditCampaign && (
          <>
            <IconButton
              size="sm"
              icon={<Unlock className="w-4 h-4" />}
              onClick={onReopenCampaign}
              variant="warning"
              className="min-h-[44px] text-sm whitespace-nowrap"
            >
              Reabrir
            </IconButton>
            <IconButton
              size="sm"
              icon={<Send className="w-4 h-4" />}
              onClick={onMarkAsSent}
              className="min-h-[44px] text-sm whitespace-nowrap"
            >
              Marcar Enviado
            </IconButton>
          </>
        )}

        {isSent && canEditCampaign && (
          <IconButton
            size="sm"
            icon={<Unlock className="w-4 h-4" />}
            onClick={onReopenCampaign}
            variant="warning"
            className="min-h-[44px] text-sm whitespace-nowrap"
          >
            Reabrir
          </IconButton>
        )}
      </div>
    </div>
  );
}
