import { MetadataRoute } from 'next';
import { API_URL, SITE_URL } from '@/api/config';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${SITE_URL}/campanhas`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/privacidade`,
      lastModified: new Date('2025-12-07'),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/termos`,
      lastModified: new Date('2025-12-07'),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  // Fetch active campaigns for dynamic pages
  let campaignPages: MetadataRoute.Sitemap = [];

  try {
    const response = await fetch(`${API_URL}/api/campaigns?status=ACTIVE&limit=100`, {
      next: { revalidate: 3600 }, // Revalidate every hour
    });

    if (response.ok) {
      const data = await response.json();
      campaignPages = data.data.map((campaign: any) => ({
        url: `${SITE_URL}/campanhas/${campaign.slug}`,
        lastModified: new Date(campaign.updatedAt),
        changeFrequency: 'daily' as const,
        priority: 0.8,
      }));
    }
  } catch (error) {
    console.error('Error fetching campaigns for sitemap:', error);
  }

  return [...staticPages, ...campaignPages];
}
