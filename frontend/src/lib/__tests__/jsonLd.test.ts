import { describe, it, expect } from "vitest";
import { serializeJsonLd } from "../jsonLd";

describe("serializeJsonLd", () => {
  // U+2028/U+2029 saem crus do JSON.stringify e quebram parsers antigos de script
  it("escapes <, U+2028 and U+2029 and stays equivalent JSON", () => {
    const data = { name: "</script>\u2028\u2029" };

    const json = serializeJsonLd(data);

    expect(json).toBe('{"name":"\\u003c/script>\\u2028\\u2029"}');
    expect(JSON.parse(json)).toEqual(data);
  });
});
