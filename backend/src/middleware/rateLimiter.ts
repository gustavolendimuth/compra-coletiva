/**
 * Rate limiters (contadores no Redis, somados entre instâncias).
 * Resposta 429: { status: "error", message } + Retry-After.
 */
import rateLimit, { ipKeyGenerator, MINUTE, HOUR } from "express-rate-limit";
import type { Request } from "express";
import { createRateLimitStore } from "./rateLimitStore";

const buildLimiter = (name: string, windowMs: number, limit: number, message: string, keyGenerator?: (req: Request) => string) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    store: createRateLimitStore(`rl:${name}:`),
    message: { status: "error", message },
    ...(keyGenerator && { keyGenerator }),
  });

const clientIpKey = (req: Request) => ipKeyGenerator(req.ip || req.socket.remoteAddress || "unknown");

// Login: 10 tentativas por IP a cada 15 min
export const loginRateLimiter = buildLimiter(
  "login",
  15 * MINUTE,
  10,
  "Muitas tentativas de login. Tente novamente em alguns minutos."
);

// Cadastro: 5 por IP por hora
export const registerRateLimiter = buildLimiter(
  "register",
  HOUR,
  5,
  "Muitas tentativas de cadastro. Tente novamente mais tarde."
);

// Reset de senha: 3 por e-mail por hora (sem e-mail válido, conta por IP)
export const passwordResetRateLimiter = buildLimiter(
  "password-reset",
  HOUR,
  3,
  "Muitas solicitações de redefinição de senha. Tente novamente mais tarde.",
  (req) => {
    const email = req.body?.email;
    if (typeof email === "string" && email.trim()) {
      return `email:${email.trim().toLowerCase()}`;
    }
    return `ip:${clientIpKey(req)}`;
  }
);

// Geocoding + distância (APIs de terceiros): 30 por IP por minuto, contador único
export const geoRateLimiter = buildLimiter(
  "geo",
  MINUTE,
  30,
  "Muitas consultas de endereço. Aguarde um minuto e tente novamente."
);
