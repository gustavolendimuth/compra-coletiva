"use client";

import { useQuery } from "@tanstack/react-query";
import { campaignApi, type CampaignWithProducts } from "@/api";
import { extractNeighborhoodCount } from "./utils";

export interface MercadoVivoHomeData {
  activeCampaigns: CampaignWithProducts[];
  featuredCampaigns: CampaignWithProducts[];
  activeCampaignsTotal: number;
  completedCampaignsTotal: number;
  allCampaignsTotal: number;
  totalOrdersSample: number;
  totalProductsSample: number;
  neighborhoodsTotal: number;
  latestCompletedCampaign: CampaignWithProducts | null;
}

async function fetchMercadoVivoHomeData(): Promise<MercadoVivoHomeData> {
  const [activeResponse, closedResponse, sentResponse, archivedResponse, catalogResponse] =
    await Promise.all([
      campaignApi.list({ status: "ACTIVE", limit: 12 }),
      campaignApi.list({ status: "CLOSED", limit: 1 }),
      campaignApi.list({ status: "SENT", limit: 1 }),
      campaignApi.list({ status: "ARCHIVED", limit: 1 }),
      campaignApi.list({ limit: 50 }),
    ]);

  const activeCampaigns = activeResponse.data;
  const featuredCampaigns = activeCampaigns.slice(0, 3);

  const completedCampaignsTotal =
    closedResponse.total + sentResponse.total + archivedResponse.total;

  const allCampaignsTotal = activeResponse.total + completedCampaignsTotal;

  const totalOrdersSample = catalogResponse.data.reduce((sum, campaign) => {
    return sum + (campaign._count?.orders ?? 0);
  }, 0);

  const totalProductsSample = catalogResponse.data.reduce((sum, campaign) => {
    return sum + (campaign._count?.products ?? 0);
  }, 0);

  const latestCompletedCampaign = [
    ...closedResponse.data,
    ...sentResponse.data,
    ...archivedResponse.data,
  ].sort((a, b) => {
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  })[0] ?? null;

  return {
    activeCampaigns,
    featuredCampaigns,
    activeCampaignsTotal: activeResponse.total,
    completedCampaignsTotal,
    allCampaignsTotal,
    totalOrdersSample,
    totalProductsSample,
    neighborhoodsTotal: extractNeighborhoodCount(catalogResponse.data),
    latestCompletedCampaign,
  };
}

export function useMercadoVivoHomeData() {
  return useQuery({
    queryKey: ["mercado-vivo-home"],
    queryFn: fetchMercadoVivoHomeData,
    staleTime: 60_000,
  });
}
