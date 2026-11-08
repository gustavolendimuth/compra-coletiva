import type { Express } from "express";
import cors from "cors";
import helmet from "helmet";

const ONE_YEAR_SECONDS = 31536000;

/**
 * Converte CORS_ORIGIN (lista separada por vírgula) em origens com protocolo.
 * Local → http; remoto → https em produção, http fora dela; protocolo explícito é mantido.
 */
export function parseCorsOrigins(
  rawOrigins: string | undefined = process.env.CORS_ORIGIN,
  nodeEnv: string | undefined = process.env.NODE_ENV
): string[] {
  if (!rawOrigins) return ["http://localhost:5173"];

  return rawOrigins.split(",").map((origin) => {
    const trimmed = origin.trim();

    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return trimmed;
    }

    const isLocal =
      trimmed.includes("localhost") ||
      trimmed.includes("127.0.0.1") ||
      trimmed.includes("0.0.0.0");

    if (isLocal) {
      return `http://${trimmed}`;
    }

    const protocol = nodeEnv === "production" ? "https" : "http";
    return `${protocol}://${trimmed}`;
  });
}

/**
 * Headers de segurança (helmet) + CORS com credentials. Única montagem usada por index.ts.
 */
export function configureHttpSecurity(app: Express, corsOrigins: string[]): void {
  app.use(
    helmet({
      frameguard: { action: "deny" },
      strictTransportSecurity: { maxAge: ONE_YEAR_SECONDS, includeSubDomains: true },
      // /uploads/* é exibido pelo frontend em outra origem
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );
  app.use(
    cors({
      origin: corsOrigins,
      credentials: true,
    })
  );
}
