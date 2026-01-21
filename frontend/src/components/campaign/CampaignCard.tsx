import { Link } from 'react-router-dom';
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
    <Link to={`/campaigns/${campaign.slug}`}>
      <article className="h-full bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md hover:border-primary-300 transition-all duration-200 cursor-pointer flex flex-col">
        {/* Mobile: Image + Title side by side | Desktop: Image full width */}
        <div className="flex flex-row md:flex-col">
          {/* Imagem da Campanha */}
          {imageUrl ? (
            <div className="w-24 h-24 md:w-full md:aspect-[2/1] flex-shrink-0 overflow-hidden bg-gray-100">
              <img
                src={imageUrl}
                alt={campaign.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback se a imagem falhar ao carregar
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = `
                    <div class="w-full h-full flex items-center justify-center bg-gray-100">
                      <svg class="w-8 h-8 md:w-12 md:h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  `;
                }}
              />
            </div>
          ) : (
            <div className="w-24 h-24 md:w-full md:aspect-[2/1] flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <ImageIcon className="w-8 h-8 md:w-12 md:h-16 text-gray-400" />
            </div>
          )}

          {/* Header: Status + Nome + Criador - Side by side on mobile, below image on desktop */}
          <div className="flex-1 min-w-0 h-24 md:h-auto p-3 md:p-5 flex items-center md:items-start md:block">
            <CampaignCardHeader campaign={campaign} />
          </div>
        </div>

        {/* Rest of content - always full width below */}
        <div className="px-4 pb-4 md:px-5 md:pb-5 flex flex-col flex-grow">
          {/* Body: Descrição + Estatísticas */}
          <div className="mt-3">
            <CampaignCardBody campaign={campaign} />
          </div>

          {/* Preview de Produtos */}
          <div className="mt-4 flex-grow">
            <ProductPreview
              products={campaign.products || []}
              totalCount={campaign._count?.products || 0}
              campaignSlug={campaign.slug}
              campaignName={campaign.name}
              variant={productPreviewVariant}
            />
          </div>

          {/* Footer: Data + Deadline */}
          <div className="mt-4">
            <CampaignCardFooter campaign={campaign} />
          </div>
        </div>
      </article>
    </Link>
  );
}
