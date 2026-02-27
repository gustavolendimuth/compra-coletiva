import { Edit } from "lucide-react";
import { Card } from "@/components/ui";
import IconButton from "@/components/IconButton";
import { formatCurrency } from "@/lib/utils";
import { Campaign } from "@/api";

interface ShippingTabProps {
  campaign: Campaign | null;
  isActive: boolean;
  canEditCampaign: boolean;
  onEditShipping: () => void;
}

export function ShippingTab({
  campaign,
  isActive,
  canEditCampaign,
  onEditShipping,
}: ShippingTabProps) {
  if (!campaign) {
    return null;
  }

  return (
    <div className="pb-20 md:pb-0">
      <div className="mb-4">
        <h2 className="font-display text-2xl font-bold text-sky-900 flex items-center gap-2">
          <span className="w-7 h-7 rounded-xl bg-sky-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
          </span>
          Frete
        </h2>
      </div>
      <div className="max-w-2xl mx-auto">
        <Card>
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-sky-100 to-sky-200 flex items-center justify-center">
              <svg className="w-8 h-8 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
            </div>
            <h2 className="font-display text-2xl font-bold text-sky-900 mb-2">
              Frete Total da Campanha
            </h2>
            <p className="text-sky-600">
              O frete será distribuído proporcionalmente ao peso de cada pedido
            </p>
          </div>

          <div className="bg-sky-50/60 rounded-2xl p-6 mb-6 text-center">
            <div className="text-sm text-sky-600 mb-2">
              Valor Total do Frete
            </div>
            <div className="text-4xl font-bold text-sky-900 mb-4">
              {formatCurrency(campaign.shippingCost)}
            </div>
            {isActive && canEditCampaign && (
              <IconButton
                icon={<Edit className="w-4 h-4" />}
                onClick={onEditShipping}
              >
                Editar Frete
              </IconButton>
            )}
          </div>

          <div className="space-y-4">
            <div className="border-t border-sky-100 pt-4">
              <h3 className="font-semibold text-sky-900 mb-3">
                Como funciona a distribuição?
              </h3>
              <ul className="space-y-2 text-sm text-sky-700">
                <li className="flex items-start">
                  <span className="inline-block w-1.5 h-1.5 bg-sky-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                  <span>
                    O frete é calculado com base no peso total de cada pedido
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-1.5 h-1.5 bg-sky-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                  <span>
                    Pedidos mais pesados pagam proporcionalmente mais frete
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-1.5 h-1.5 bg-sky-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                  <span>
                    A distribuição é recalculada automaticamente quando há
                    mudanças nos pedidos
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
