import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("../CampaignDetailPage", () => ({
  CampaignDetailPage: () => <div data-testid="campaign-detail" />,
}));

import CampanhaDetailPage from "../page";

const PAYLOAD = "</script><script>window.__xss=1</script>";

describe("/campanhas/[slug] JSON-LD", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: "c-1",
          slug: "slug-1",
          name: PAYLOAD,
          description: PAYLOAD,
          status: "ACTIVE",
          imageUrl: null,
          creator: { id: "u-1", name: PAYLOAD },
          _count: { products: 1, orders: 0 },
        }),
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("escapes user content in JSON-LD", async () => {
    const element = await CampanhaDetailPage({ params: Promise.resolve({ slug: "slug-1" }) });
    const html = renderToStaticMarkup(element);

    expect(html).toContain("\\u003c/script>");
    // só as 2 tags de JSON-LD que o app gera (Product + BreadcrumbList)
    expect(html.match(/<\/script>/g)).toHaveLength(2);
  });
});
