import { redirect } from "next/navigation";

type SearchParams = Record<string, string | string[] | undefined>;

function toQueryString(searchParams?: SearchParams) {
  if (!searchParams) return "";

  const params = new URLSearchParams();

  Object.entries(searchParams).forEach(([key, value]) => {
    if (typeof value === "string") {
      params.append(key, value);
    } else if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item) params.append(key, item);
      });
    }
  });

  if (searchParams.tab === "questions") {
    params.delete("tab");
    params.set("openQuestions", "true");
  }

  return params.toString();
}

export default async function CampaignRedirectPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<SearchParams>;
}) {
  const { slug } = await params;
  const query = toQueryString(await searchParams);
  redirect(`/campanhas/${slug}${query ? `?${query}` : ""}`);
}
