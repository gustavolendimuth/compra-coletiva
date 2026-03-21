'use client';
/* eslint-disable @next/next/no-img-element */

import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { CampaignWithProducts } from '@/api';
import { getImageUrl } from '@/lib/imageUrl';
import {
  formatCompactNumber,
  getCampaignEmoji,
  getDeadlineLabel,
  sanitizeDescription,
  sanitizeInlineText,
} from '@/components/features/home-mercado-vivo/utils';

const campaignBackgrounds = [
  'from-amber-100 via-amber-50 to-sky-50',
  'from-sky-100 via-sky-50 to-emerald-50',
  'from-terracotta-400/20 via-amber-50 to-cream-100',
];

interface CampaignCardBannerProps {
  campaign: CampaignWithProducts;
  index?: number;
}

export function CampaignCardBanner({ campaign, index = 0 }: CampaignCardBannerProps) {
  const imageUrl = getImageUrl(campaign.imageUrl);
  const cardBg = campaignBackgrounds[index % campaignBackgrounds.length] ?? campaignBackgrounds[0];
  const emoji = getCampaignEmoji(index);
  const location = [campaign.pickupNeighborhood, campaign.pickupCity, campaign.pickupState].filter(Boolean).join(', ');

  return (
    <Link href={`/campanhas/${campaign.slug}`} className="bg-white rounded-3xl overflow-hidden border border-sky-100/50 shadow-sm block hover:shadow-md transition-shadow">
      <div className={`h-48 bg-gradient-to-br ${cardBg} flex items-center justify-center relative overflow-hidden`}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={campaign.name}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              const parent = e.currentTarget.parentElement;
              e.currentTarget.style.display = 'none';
              if (parent) {
                parent.innerHTML += `<span class="text-7xl">${emoji}</span>`;
              }
            }}
          />
        ) : (
          <span className="text-7xl">{emoji}</span>
        )}
        <span className="absolute top-4 left-4 px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full shadow-sm">Ativa</span>
        {location && (
          <span className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1 bg-white/90 text-sky-700 text-xs font-semibold rounded-full backdrop-blur-sm">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            {location}
          </span>
        )}
      </div>
      <div className="p-6">
        <h3
          className="font-display font-bold text-sky-900 text-xl mb-1"
          dangerouslySetInnerHTML={{ __html: sanitizeInlineText(campaign.name, 'Campanha local') }}
        />
        <p
          className="text-sm text-sky-700/50 mb-3"
          dangerouslySetInnerHTML={{
            __html: sanitizeDescription(
              campaign.description,
              'Campanha comunitaria com produtos selecionados para o bairro.'
            ),
          }}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-sky-700/40 font-medium">+{formatCompactNumber(campaign._count?.orders ?? 0)} pedidos</span>
          <span className="text-xs text-amber-600 font-semibold bg-amber-50 px-2.5 py-1 rounded-full">{getDeadlineLabel(campaign.deadline)}</span>
        </div>
      </div>
    </Link>
  );
}
