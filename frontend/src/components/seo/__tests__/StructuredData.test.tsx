import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/script", () => ({
  default: (props: Record<string, unknown>) => <script {...props} />,
}));

import { StructuredData } from "../StructuredData";

const PAYLOAD = "</script><script>window.__xss=1</script>";

describe("StructuredData", () => {
  it("escapes < and still round-trips to the same data", () => {
    const html = renderToStaticMarkup(<StructuredData type="custom" data={{ name: PAYLOAD }} />);

    expect(html).toContain("\\u003c/script>");
    expect(html.match(/<\/script>/g)).toHaveLength(1);
    const json = html.replace(/^<script[^>]*>/, "").replace(/<\/script>$/, "");
    expect(JSON.parse(json)).toEqual({ name: PAYLOAD });
  });
});
