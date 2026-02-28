'use client';
/* eslint-disable @next/next/no-img-element */

import Link from 'next/link';
import { Image as ImageIcon } from 'lucide-react';
import { CampaignWithProducts } from '@/api';
import { getImageUrl } from '@/lib/imageUrl';
import { CampaignCardHeader } from './CampaignCardHeader';
import { CampaignCardBody } from './CampaignCardBody';
import { CampaignCardFooter } from './CampaignCardFooter';
import { ProductPreview, ProductPreviewVariant } from './ProductPreview';

interface CampaignCardProps {
  campaign: CampaignWithProducts;
  productPreviewVariant?: ProductPreviewVariant;
}

export function CampaignCard({
  campaign,
  productPreviewVariant = 'inline'
}: CampaignCardProps) {
  const imageUrl = getImageUrl(campaign.imageUrl);

  return (
    <Link href={`/campanhas/${campaign.slug}`}>
      <article className="h-full bg-white rounded-3xl border border-sky-100/50 overflow-hidden shadow-sm campaign-card-hover cursor-pointer flex flex-col">

        {/* Topo: Imagem quadrada + Header — layout idêntico em mobile e desktop */}
        <div className="flex gap-3 p-3 md:gap-4 md:p-4">
          {/* Imagem quadrada fixa */}
          {imageUrl ? (
            <div className="flex-shrink-0 w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden bg-sky-50">
              <img
                src={imageUrl}
                alt={campaign.name}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = `
                    <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-100 via-amber-50 to-sky-50">
                      <svg class="w-7 h-7 text-sky-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  `;
                }}
              />
            </div>
          ) : (
            <div className="flex-shrink-0 w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-gradient-to-br from-amber-100 via-amber-50 to-sky-50 flex items-center justify-center">
              <ImageIcon className="w-7 h-7 text-sky-300" />
            </div>
          )}

          {/* Header: ocupa o espaço restante */}
          <div className="flex-1 min-w-0">
            <CampaignCardHeader campaign={campaign} />
          </div>
        </div>

        {/* Corpo: descrição, stats, produtos, rodapé */}
        <div className="px-3 pb-3 md:px-4 md:pb-4 flex flex-col flex-grow">
          <CampaignCardBody campaign={campaign} />

          <div className="mt-3 flex-grow">
            <ProductPreview
              products={campaign.products || []}
              totalCount={campaign._count?.products || 0}
              campaignSlug={campaign.slug}
              campaignName={campaign.name}
              variant={productPreviewVariant}
            />
          </div>

          <div className="mt-3">
            <CampaignCardFooter campaign={campaign} />
          </div>
        </div>

      </article>
    </Link>
  );
}
