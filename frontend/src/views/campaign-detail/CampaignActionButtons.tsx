import {
  Copy,
  QrCode,
  FileText,
  Lock,
  Unlock,
  Send,
  Package,
  ShoppingBag,
} from "lucide-react";
import IconButton from "@/components/IconButton";
import { Campaign, campaignApi } from "@/api";
import toast from "react-hot-toast";

interface CampaignActionButtonsProps {
  campaign: Campaign;
  canEditCampaign: boolean;
  ordersCount: number;
  onEditPix: () => void;
  onCloseCampaign: () => void;
  onReopenCampaign: () => void;
  onMarkAsSent: () => void;
  onCloneCampaign: () => void;
  onAddProduct?: () => void;
  onAddOrder?: () => void;
}

export function CampaignActionButtons({
  campaign,
  canEditCampaign,
  ordersCount,
  onEditPix,
  onCloseCampaign,
  onReopenCampaign,
  onMarkAsSent,
  onCloneCampaign,
  onAddProduct,
  onAddOrder,
}: CampaignActionButtonsProps) {
  const isActive = campaign.status === "ACTIVE";
  const isClosed = campaign.status === "CLOSED";
  const isSent = campaign.status === "SENT";

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
