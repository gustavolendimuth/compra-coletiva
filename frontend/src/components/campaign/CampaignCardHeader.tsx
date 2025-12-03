import { CampaignWithProducts } from '@/lib/api';

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
    <div className="space-y-2">
      {/* Status badge */}
      <div className="flex items-start justify-between">
        <span
          className={`px-2.5 py-1 text-xs font-medium rounded-full ${status.classes}`}
        >
          {status.label}
        </span>
      </div>

      {/* Nome da campanha */}
      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 leading-tight">
        {campaign.name}
      </h3>

      {/* Criador */}
      {campaign.creator && (
        <p className="text-sm text-gray-500">
          por <span className="font-medium text-gray-700">{campaign.creator.name}</span>
        </p>
      )}
    </div>
  );
}
