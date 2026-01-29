import { MapPin } from 'lucide-react';
import { CampaignWithProducts } from '@/api';
import { DistanceBadge } from '@/components/ui/DistanceBadge';

interface CampaignCardHeaderProps {
  campaign: CampaignWithProducts;
}

const statusConfig = {
  ACTIVE: {
    label: 'Ativa',
    classes: 'bg-green-100 text-green-700'
  },
  CLOSED: {
    label: 'Fechada',
    classes: 'bg-yellow-100 text-yellow-700'
  },
  SENT: {
    label: 'Enviada',
    classes: 'bg-blue-100 text-blue-700'
  },
  ARCHIVED: {
    label: 'Arquivada',
    classes: 'bg-gray-100 text-gray-700'
  }
} as const;

export function CampaignCardHeader({ campaign }: CampaignCardHeaderProps) {
  const status = statusConfig[campaign.status];

  return (
    <div className="flex flex-col justify-center w-full h-full space-y-1 md:space-y-2">
      {/* Status badge */}
      <div className="flex items-start justify-between">
        <span
          className={`px-2.5 py-0.5 md:py-1 text-xs font-medium rounded-full ${status.classes}`}
        >
          {status.label}
        </span>
      </div>

      {/* Nome da campanha - Smaller text on mobile, line-clamp-2 */}
      <h3 className="text-sm md:text-lg font-semibold text-gray-900 line-clamp-2 leading-snug md:leading-tight">
        {campaign.name}
      </h3>

      {/* Criador - Hidden on mobile to save space */}
      {campaign.creator && (
        <p className="hidden md:block text-sm text-gray-500">
          por <span className="font-medium text-gray-700">{campaign.creator.name}</span>
        </p>
      )}

      {/* Localização - distância e/ou cidade */}
      {(campaign.distance != null || campaign.pickupCity) && (
        <div className="hidden md:flex items-center gap-1.5 text-xs text-gray-500">
          {campaign.distance != null ? (
            <>
              <DistanceBadge distanceKm={campaign.distance} />
              {campaign.pickupCity && (
                <span>
                  • {campaign.pickupCity}{campaign.pickupState ? ` - ${campaign.pickupState}` : ''}
                </span>
              )}
            </>
          ) : (
            <>
              <MapPin className="w-3 h-3 text-gray-400" />
              <span>
                {campaign.pickupCity}{campaign.pickupState ? ` - ${campaign.pickupState}` : ''}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
