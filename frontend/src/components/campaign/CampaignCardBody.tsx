import { Package, Users } from 'lucide-react';
import { CampaignWithProducts } from '@/api';

interface CampaignCardBodyProps {
  campaign: CampaignWithProducts;
}

export function CampaignCardBody({ campaign }: CampaignCardBodyProps) {
  return (
    <div className="border-t border-sky-100/60 pt-3 space-y-2">
      {/* Descrição */}
      {campaign.description && (
        <p className="text-sm text-sky-700 line-clamp-2">
          {campaign.description}
        </p>
      )}

      {/* Estatísticas */}
      <div className="flex items-center gap-4 text-sm text-sky-600">
        <div className="flex items-center gap-1.5">
          <Package className="w-4 h-4" />
          <span>{campaign._count?.products || 0} produtos</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="w-4 h-4" />
          <span>{campaign._count?.orders || 0} pedidos</span>
        </div>
      </div>
    </div>
  );
}
