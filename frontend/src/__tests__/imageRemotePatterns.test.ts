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

const { AWS_S3_BUCKET: _bucket, ...withoutBucket } = productionEnv;
const s3Image = "https://compra-coletiva-images.s3.sa-east-1.amazonaws.com/campaigns/x.png";

describe("/_next/image remotePatterns", () => {
  it.each([
    ["accepts images from the configured S3 bucket", productionEnv, s3Image, true],
    ["accepts images from the API /uploads", productionEnv, "https://api.compracoletiva.app/uploads/campaigns/x.png", true],
    ["rejects an external host", productionEnv, "https://exemplo-externo.com/x.png", false],
    ["rejects another S3 bucket", productionEnv, "https://other-bucket.s3.sa-east-1.amazonaws.com/x.png", false],
    ["rejects non-uploads paths on the API host", productionEnv, "https://api.compracoletiva.app/api/auth/me", false],
    // Sem o guard, o padrão viraria "undefined.s3...": um bucket com esse nome passaria
    ["no S3 pattern when the bucket is not configured", withoutBucket, "https://undefined.s3.sa-east-1.amazonaws.com/x.png", false],
    [
      "API host without protocol follows the production https rule",
      { ...productionEnv, NEXT_PUBLIC_API_URL: "api.compracoletiva.app" },
      "https://api.compracoletiva.app/uploads/x.png",
      true,
    ],
    ["rejects http://localhost in production", productionEnv, "http://localhost:5000/x.png", false],
    ["accepts http://localhost in development", { NODE_ENV: "development" }, "http://localhost:5000/x.png", true],
  ])("%s", (_label, env: Record<string, string>, url, expected) => {
    expect(hasRemoteMatch([], buildImageRemotePatterns(env), new URL(url))).toBe(expected);
  });
});
