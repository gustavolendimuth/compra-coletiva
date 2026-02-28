import { MetadataRoute } from 'next';
import { API_URL, SITE_URL } from '@/api/config';
import type { CampaignWithProducts } from '@/api/types';

// Force dynamic generation to avoid build-time API calls
export const dynamic = 'force-dynamic';
export const revalidate = 900; // Revalidate every 15 minutes (better for SEO)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
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
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/termos`,
      lastModified: new Date('2025-12-07'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  // Fetch active campaigns for dynamic pages
  let campaignPages: MetadataRoute.Sitemap = [];

  try {
    // Fetch more campaigns and include recent ones for better indexing
    const response = await fetch(`${API_URL}/api/campaigns?status=ACTIVE,CLOSED&limit=500&sortBy=updatedAt&sortOrder=desc`, {
      cache: 'no-store', // Always fetch fresh data
      // Add timeout to fail fast if backend is unavailable
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      const data = (await response.json()) as { data: CampaignWithProducts[] };
      campaignPages = data.data.map((campaign) => {
        // Calculate priority based on campaign status and recency
        const isActive = campaign.status === 'ACTIVE';
        const updatedAt = new Date(campaign.updatedAt);
        const daysSinceUpdate = Math.floor((Date.now() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));

        // Active campaigns get higher priority, recently updated ones get boost
        let priority = isActive ? 0.8 : 0.6;
        if (daysSinceUpdate < 7) priority = Math.min(0.9, priority + 0.1);

        return {
          url: `${SITE_URL}/campanhas/${campaign.slug}`,
          lastModified: updatedAt,
          changeFrequency: isActive ? ('daily' as const) : ('weekly' as const),
          priority,
        };
      });
    }
  } catch (error) {
    // Silently fail during build - sitemap will only include static pages
    // This is expected when backend is not running during build
    if (process.env.NODE_ENV === 'development') {
      console.warn('Could not fetch campaigns for sitemap - backend may not be running');
    }
  }

  return [...staticPages, ...campaignPages];
}

