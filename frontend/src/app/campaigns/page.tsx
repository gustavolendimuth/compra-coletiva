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

export default function CampaignsRedirectPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const query = toQueryString(searchParams);
  redirect(`/campanhas${query ? `?${query}` : ""}`);
}
