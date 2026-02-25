import { MapPin } from 'lucide-react';
import { CampaignWithProducts } from '@/api';
import { DistanceBadge } from '@/components/ui/DistanceBadge';

interface CampaignCardHeaderProps {
  campaign: CampaignWithProducts;
}

const statusConfig = {
  ACTIVE: {
    label: 'Ativa',
    classes: 'bg-emerald-100 text-emerald-700'
  },
  CLOSED: {
    label: 'Fechada',
    classes: 'bg-amber-100 text-amber-700'
  },
  SENT: {
    label: 'Enviada',
    classes: 'bg-sky-100 text-sky-700'
  },
  ARCHIVED: {
    label: 'Arquivada',
    classes: 'bg-sky-50 text-sky-500'
  }
} as const;

export function CampaignCardHeader({ campaign }: CampaignCardHeaderProps) {
  const status = statusConfig[campaign.status];

  return (
    <div className="flex flex-col justify-start w-full h-full gap-1.5">
      {/* Status badge */}
      <span
        className={`self-start px-2.5 py-0.5 text-xs font-semibold rounded-full ${status.classes}`}
      >
        {status.label}
      </span>

      {/* Nome da campanha */}
      <h3 className="text-sm md:text-base font-display font-bold text-sky-900 line-clamp-2 leading-snug">
        {campaign.name}
      </h3>

      {/* Criador */}
      {campaign.creator && (
        <p className="text-xs text-sky-600">
          por <span className="font-medium text-sky-800">{campaign.creator.name}</span>
        </p>
      )}

      {/* Localização */}
      {(campaign.distance != null || campaign.pickupCity) && (
        <div className="flex items-center gap-1 text-xs text-sky-600">
          {campaign.distance != null ? (
            <>
              <DistanceBadge distanceKm={campaign.distance} />
              {campaign.pickupCity && (
                <span className="truncate">
                  • {campaign.pickupCity}{campaign.pickupState ? ` - ${campaign.pickupState}` : ''}
                </span>
              )}
            </>
          ) : (
            <>
              <MapPin className="w-3 h-3 text-sky-400 flex-shrink-0" />
              <span className="truncate">
                {campaign.pickupCity}{campaign.pickupState ? ` - ${campaign.pickupState}` : ''}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
