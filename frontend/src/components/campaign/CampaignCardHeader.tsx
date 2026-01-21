import { CampaignWithProducts } from '@/api';

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
    <div className="flex flex-col justify-center w-full space-y-1 md:space-y-2">
      {/* Status badge */}
      <div className="flex items-start justify-between">
        <span
          className={`px-2.5 py-1 text-xs font-medium rounded-full ${status.classes}`}
        >
          {status.label}
        </span>
      </div>

      {/* Nome da campanha - Smaller text on mobile, line-clamp-2 */}
      <h3 className="text-sm md:text-lg font-semibold text-gray-900 line-clamp-2 leading-tight">
        {campaign.name}
      </h3>

      {/* Criador - Hidden on mobile to save space */}
      {campaign.creator && (
        <p className="hidden md:block text-sm text-gray-500">
          por <span className="font-medium text-gray-700">{campaign.creator.name}</span>
        </p>
      )}
    </div>
  );
}
