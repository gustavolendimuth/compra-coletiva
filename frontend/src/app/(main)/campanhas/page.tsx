import type { Metadata } from 'next';
import { API_URL } from '@/api/config';
import type { CampaignListResponse } from '@/api';
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

async function getInitialCampaigns(): Promise<CampaignListResponse | null> {
  try {
    const params = new URLSearchParams({ limit: '12' });
    const response = await fetch(`${API_URL}/api/campaigns?${params.toString()}`, {
      next: { revalidate: 30 },
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch {
    return null;
  }
}

export default async function CampanhasPage() {
  const initialData = await getInitialCampaigns();
  return <CampaignListPage initialData={initialData} />;
}
