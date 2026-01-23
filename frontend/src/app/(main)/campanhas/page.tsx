import type { Metadata } from 'next';
import { CampaignListPage } from './CampaignListPage';

export const metadata: Metadata = {
  title: 'Campanhas',
  description:
    'Explore campanhas de compra coletiva ativas. Encontre produtos com preços especiais e frete compartilhado.',
  openGraph: {
    title: 'Campanhas | Compra Coletiva',
    description:
      'Explore campanhas de compra coletiva ativas. Encontre produtos com preços especiais e frete compartilhado.',
  },
};

export default function CampanhasPage() {
  return <CampaignListPage />;
}
