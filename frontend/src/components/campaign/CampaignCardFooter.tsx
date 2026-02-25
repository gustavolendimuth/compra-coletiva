import { Clock, Calendar } from 'lucide-react';
import { CampaignWithProducts } from '@/api';

interface CampaignCardFooterProps {
  campaign: CampaignWithProducts;
}

function getDeadlineInfo(deadline: string) {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffMs = deadlineDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffMs < 0) {
    return {
      text: 'Encerrada',
      colorClass: 'text-red-600',
      bgClass: 'bg-red-50'
    };
  }

  if (diffDays === 0) {
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
    return {
      text: `Encerra em ${diffHours}h`,
      colorClass: 'text-red-600',
      bgClass: 'bg-red-50'
    };
  }

  if (diffDays === 1) {
    return {
      text: 'Encerra amanhã',
      colorClass: 'text-orange-600',
      bgClass: 'bg-orange-50'
    };
  }

  if (diffDays <= 3) {
    return {
      text: `Encerra em ${diffDays} dias`,
      colorClass: 'text-yellow-600',
      bgClass: 'bg-yellow-50'
    };
  }

  if (diffDays <= 7) {
    return {
      text: `Encerra em ${diffDays} dias`,
      colorClass: 'text-blue-600',
      bgClass: 'bg-blue-50'
    };
  }

  return {
    text: deadlineDate.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    }),
    colorClass: 'text-sky-600',
    bgClass: 'bg-sky-50'
  };
}

export function CampaignCardFooter({ campaign }: CampaignCardFooterProps) {
  const createdDate = new Date(campaign.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  return (
    <div className="pt-3 border-t border-sky-100/60">
      <div className="flex items-center justify-between text-xs">
        {/* Data de criação */}
        <div className="flex items-center gap-1 text-sky-500">
          <Calendar className="w-3.5 h-3.5" />
          <span>{createdDate}</span>
        </div>

        {/* Deadline */}
        {campaign.deadline && (() => {
          const deadline = getDeadlineInfo(campaign.deadline);
          return (
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-full font-medium ${deadline.colorClass} ${deadline.bgClass}`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{deadline.text}</span>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
