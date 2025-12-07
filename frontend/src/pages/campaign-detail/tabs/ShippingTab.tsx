import { Truck, Edit } from "lucide-react";
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
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Truck className="w-6 h-6 text-primary-600" />
          Frete
        </h2>
      </div>
      <div className="max-w-2xl mx-auto">
        <Card>
          <div className="text-center mb-6">
            <Truck className="w-16 h-16 mx-auto text-primary-600 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Frete Total da Campanha
            </h2>
            <p className="text-gray-600">
              O frete será distribuído proporcionalmente ao peso de cada pedido
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-6 text-center">
            <div className="text-sm text-gray-500 mb-2">
              Valor Total do Frete
            </div>
            <div className="text-4xl font-bold text-gray-900 mb-4">
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
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-900 mb-3">
                Como funciona a distribuição?
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="inline-block w-1.5 h-1.5 bg-primary-600 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                  <span>
                    O frete é calculado com base no peso total de cada pedido
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-1.5 h-1.5 bg-primary-600 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                  <span>
                    Pedidos mais pesados pagam proporcionalmente mais frete
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-1.5 h-1.5 bg-primary-600 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
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
