import { Link } from 'react-router-dom';
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
  return (
    <Link to={`/campaigns/${campaign.slug}`}>
      <article className="h-full bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:border-primary-300 transition-all duration-200 cursor-pointer flex flex-col">
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
            campaignId={campaign.id}
            campaignName={campaign.name}
            variant={productPreviewVariant}
          />
        </div>

        {/* Footer: Data + Deadline */}
        <div className="mt-4">
          <CampaignCardFooter campaign={campaign} />
        </div>
      </article>
    </Link>
  );
}
