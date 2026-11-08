import { describe, it, expect } from "vitest";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { buildImageRemotePatterns } = require("../../imageRemotePatterns.js");
const { hasRemoteMatch } = require("next/dist/shared/lib/match-remote-pattern");

const productionEnv = {
  NODE_ENV: "production",
  AWS_S3_BUCKET: "compra-coletiva-images",
  AWS_S3_REGION: "sa-east-1",
  NEXT_PUBLIC_API_URL: "https://api.compracoletiva.app",
};

const allows = (env: Record<string, string>, url: string) =>
  hasRemoteMatch([], buildImageRemotePatterns(env), new URL(url));

describe("/_next/image remotePatterns", () => {
  it("accepts images from the configured S3 bucket", () => {
    expect(
      allows(productionEnv, "https://compra-coletiva-images.s3.sa-east-1.amazonaws.com/campaigns/x.png")
    ).toBe(true);
  });

  it("accepts images from the API /uploads", () => {
    expect(allows(productionEnv, "https://api.compracoletiva.app/uploads/campaigns/x.png")).toBe(true);
  });

  it("rejects an external host", () => {
    expect(allows(productionEnv, "https://exemplo-externo.com/x.png")).toBe(false);
  });

  it("rejects another S3 bucket", () => {
    expect(allows(productionEnv, "https://other-bucket.s3.sa-east-1.amazonaws.com/x.png")).toBe(false);
  });

  it("rejects non-uploads paths on the API host", () => {
    expect(allows(productionEnv, "https://api.compracoletiva.app/api/auth/me")).toBe(false);
  });

  it("no S3 pattern when the bucket is not configured", () => {
    const { AWS_S3_BUCKET: _bucket, ...env } = productionEnv;
    expect(allows(env, "https://compra-coletiva-images.s3.sa-east-1.amazonaws.com/x.png")).toBe(false);
  });

  it("API host without protocol follows the production https rule", () => {
    const env = { ...productionEnv, NEXT_PUBLIC_API_URL: "api.compracoletiva.app" };
    expect(allows(env, "https://api.compracoletiva.app/uploads/x.png")).toBe(true);
  });
});
