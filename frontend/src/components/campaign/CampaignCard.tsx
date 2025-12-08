import { Link } from 'react-router-dom';
import { Image as ImageIcon } from 'lucide-react';
import { CampaignWithProducts } from '@/api';
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
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  
  // Build full image URL (handle local storage paths)
  const getImageUrl = (imageUrl?: string) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) return imageUrl; // S3 URL
    return `${apiUrl.replace(/\/api$/, '')}${imageUrl}`; // Local storage
  };

  const imageUrl = getImageUrl(campaign.imageUrl);

  return (
    <Link to={`/campaigns/${campaign.slug}`}>
      <article className="h-full bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md hover:border-primary-300 transition-all duration-200 cursor-pointer flex flex-col">
        {/* Imagem da Campanha */}
        {imageUrl ? (
          <div className="w-full aspect-video md:aspect-[2/1] overflow-hidden bg-gray-100">
            <img
              src={imageUrl}
              alt={campaign.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback se a imagem falhar ao carregar
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML = `
                  <div class="w-full h-full flex items-center justify-center bg-gray-100">
                    <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                `;
              }}
            />
          </div>
        ) : (
          <div className="w-full aspect-video md:aspect-[2/1] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <ImageIcon className="w-12 h-12 md:w-16 md:h-16 text-gray-400" />
          </div>
        )}

        <div className="p-5 flex flex-col flex-grow">
          {/* Header: Status + Nome + Criador */}
          <CampaignCardHeader campaign={campaign} />

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
