import { describe, it, expect } from "vitest";
import { metadata } from "../page";

describe("/reset-password metadata", () => {
  it("não indexa a página e não manda o token no Referer", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(metadata.referrer).toBe("no-referrer");
  });
});
