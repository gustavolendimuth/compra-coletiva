import type { Metadata } from 'next';
import { SITE_URL, API_URL } from '@/api/config';
import { CampaignDetailPage } from './CampaignDetailPage';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Fetch campaign data for metadata
async function getCampaign(slug: string) {
  try {
    const response = await fetch(`${API_URL}/api/campaigns/${slug}`, {
      next: { revalidate: 60 }, // Revalidate every 60 seconds
    });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

// Generate dynamic metadata based on campaign
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const campaign = await getCampaign(slug);

  if (!campaign) {
    return {
      title: 'Campanha não encontrada',
      description: 'Esta campanha não existe ou foi removida.',
    };
  }

  const title = campaign.name;
  const description =
    campaign.description ||
    `Participe da campanha ${campaign.name}. ${campaign._count?.products || 0} produtos disponíveis.`;
  const imageUrl = campaign.imageUrl
    ? `${API_URL}${campaign.imageUrl}`
    : `${SITE_URL}/og-image.png`;

  return {
    title,
    description,
    openGraph: {
      title: `${title} | Compra Coletiva`,
      description,
      url: `${SITE_URL}/campanhas/${slug}`,
      siteName: 'Compra Coletiva',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: 'pt_BR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Compra Coletiva`,
      description,
      images: [imageUrl],
    },
    alternates: {
      canonical: `${SITE_URL}/campanhas/${slug}`,
    },
  };
}

// Generate JSON-LD structured data
function generateStructuredData(campaign: any) {
  if (!campaign) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: campaign.name,
    description: campaign.description || `Campanha de compra coletiva: ${campaign.name}`,
    image: campaign.imageUrl ? `${API_URL}${campaign.imageUrl}` : undefined,
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'BRL',
      offerCount: campaign._count?.products || 0,
      availability: campaign.status === 'ACTIVE'
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
    seller: {
      '@type': 'Person',
      name: campaign.creator?.name || 'Organizador',
    },
  };
}

export default async function CampanhaDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const campaign = await getCampaign(slug);

  const structuredData = generateStructuredData(campaign);

  return (
    <>
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}
      <CampaignDetailPage slug={slug} />
    </>
  );
}
