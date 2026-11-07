import type { Express } from "express";

// Railway coloca um proxy na frente do backend: confiamos só nesse hop,
// então `req.ip` é o último valor de X-Forwarded-For (o que o proxy viu).
export const TRUST_PROXY_HOPS = 1;

export function configureTrustProxy(app: Express): void {
  app.set("trust proxy", TRUST_PROXY_HOPS);
}
