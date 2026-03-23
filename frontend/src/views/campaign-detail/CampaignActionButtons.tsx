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
    <div className="space-y-4">
      {/* Ação Principal do Participante */}
      {isActive && onAddOrder && (
        <button
          onClick={onAddOrder}
          className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white rounded-2xl font-bold text-lg shadow-md shadow-sky-200 transition-colors"
          title="Adicionar Pedido (Alt+N)"
        >
          <ShoppingBag className="w-6 h-6" />
          Fazer Pedido
        </button>
      )}

      {/* Ações do Criador — Produtos e Configurações */}
      {canEditCampaign && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 mb-1">
            <div className="flex-1 h-px bg-sky-100" />
            <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
              Ações do Criador
            </span>
            <div className="flex-1 h-px bg-sky-100" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {isActive && onAddProduct && (
              <button
                onClick={onAddProduct}
                className="flex items-center justify-center gap-2 py-3 px-4 border-2 border-sky-200 hover:border-sky-400 hover:bg-sky-50 text-sky-700 rounded-2xl font-semibold text-base transition-colors"
              >
                <Package className="w-5 h-5" />
                Adicionar Produto
              </button>
            )}

            <button
              onClick={onEditPix}
              className="flex items-center justify-center gap-2 py-3 px-4 border-2 border-sky-200 hover:border-sky-400 hover:bg-sky-50 text-sky-700 rounded-2xl font-semibold text-base transition-colors"
            >
              <QrCode className="w-5 h-5" />
              Configurar PIX
            </button>

            {onEditAddress && (
              <button
                onClick={onEditAddress}
                className="flex items-center justify-center gap-2 py-3 px-4 border-2 border-sky-200 hover:border-sky-400 hover:bg-sky-50 text-sky-700 rounded-2xl font-semibold text-base transition-colors"
              >
                <MapPin className="w-5 h-5" />
                Endereço de Retirada
              </button>
            )}

            <button
              onClick={onCloneCampaign}
              className="flex items-center justify-center gap-2 py-3 px-4 border-2 border-sky-200 hover:border-sky-400 hover:bg-sky-50 text-sky-700 rounded-2xl font-semibold text-base transition-colors"
            >
              <Copy className="w-5 h-5" />
              Clonar Campanha
            </button>

            {ordersCount > 0 && (
              <button
                onClick={async () => {
                  try {
                    await campaignApi.downloadSupplierInvoice(campaign.id);
                    toast.success("Fatura gerada com sucesso!");
                  } catch {
                    toast.error("Erro ao gerar fatura");
                  }
                }}
                className="flex items-center justify-center gap-2 py-3 px-4 border-2 border-sky-200 hover:border-sky-400 hover:bg-sky-50 text-sky-700 rounded-2xl font-semibold text-base transition-colors"
              >
                <FileText className="w-5 h-5" />
                Gerar Fatura
              </button>
            )}

            {ordersCount > 0 && canGenerateOrdersSummary && (
              <button
                onClick={async () => {
                  try {
                    setIsGeneratingSummary(true);
                    const summary = await campaignApi.getOrdersSummary(
                      campaign.slug || campaign.id
                    );
                    await copyToClipboard(summary.summaryText);
                    toast.success("Resumo copiado! Pronto para enviar no WhatsApp.");
                  } catch {
                    toast.error("Erro ao gerar resumo dos pedidos");
                  } finally {
                    setIsGeneratingSummary(false);
                  }
                }}
                disabled={isGeneratingSummary}
                className="flex items-center justify-center gap-2 py-3 px-4 border-2 border-sky-200 hover:border-sky-400 hover:bg-sky-50 text-sky-700 rounded-2xl font-semibold text-base transition-colors disabled:opacity-50"
              >
                <ClipboardList className="w-5 h-5" />
                {isGeneratingSummary ? "Gerando..." : "Copiar Resumo"}
              </button>
            )}
          </div>

          {/* Ações de status — destaque próprio */}
          <div className="space-y-3 pt-1">
            {isActive && (
              <button
                onClick={onCloseCampaign}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-amber-50 border-2 border-amber-300 hover:bg-amber-100 text-amber-800 rounded-2xl font-semibold text-base transition-colors"
              >
                <Lock className="w-5 h-5" />
                Fechar Campanha
              </button>
            )}

            {isClosed && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={onReopenCampaign}
                  className="flex items-center justify-center gap-2 py-3 px-4 bg-amber-50 border-2 border-amber-300 hover:bg-amber-100 text-amber-800 rounded-2xl font-semibold text-base transition-colors"
                >
                  <Unlock className="w-5 h-5" />
                  Reabrir
                </button>
                <button
                  onClick={onMarkAsSent}
                  className="flex items-center justify-center gap-2 py-3 px-4 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl font-semibold text-base transition-colors"
                >
                  <Send className="w-5 h-5" />
                  Marcar como Enviado
                </button>
              </div>
            )}

            {isSent && (
              <button
                onClick={onReopenCampaign}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-amber-50 border-2 border-amber-300 hover:bg-amber-100 text-amber-800 rounded-2xl font-semibold text-base transition-colors"
              >
                <Unlock className="w-5 h-5" />
                Reabrir Campanha
              </button>
            )}
          </div>
        </div>
      )}

      {/* Clonar — disponível para não-criadores também */}
      {!canEditCampaign && (
        <button
          onClick={onCloneCampaign}
          className="flex items-center justify-center gap-2 py-3 px-4 border-2 border-sky-200 hover:border-sky-400 hover:bg-sky-50 text-sky-700 rounded-2xl font-semibold text-base transition-colors w-full"
        >
          <Copy className="w-5 h-5" />
          Clonar Campanha
        </button>
      )}
    </div>
  );
}
