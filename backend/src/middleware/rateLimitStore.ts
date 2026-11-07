/**
 * Store de rate limit no Redis (REDIS_*), resiliente a indisponibilidade:
 * se o Redis falhar, as requisições passam sem limite e um erro é logado
 * no máximo uma vez por minuto.
 */
import Redis from "ioredis";
import { RedisStore } from "rate-limit-redis";
import type { Options, Store, IncrementResponse, ClientRateLimitInfo } from "express-rate-limit";

const ERROR_LOG_INTERVAL_MS = 60 * 1000;

let redisClient: Redis | null = null;
let lastErrorLogAt = 0;

function reportRedisError(error: unknown): void {
  const now = Date.now();
  if (now - lastErrorLogAt < ERROR_LOG_INTERVAL_MS) return;
  lastErrorLogAt = now;
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[RateLimit] Redis indisponível; requisições seguem sem limite: ${message}`);
}

function getRateLimitRedisClient(): Redis {
  if (redisClient) return redisClient;

  const options = {
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
  };
  redisClient = process.env.REDIS_URL
    ? new Redis(process.env.REDIS_URL, options)
    : new Redis({
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT || "6379", 10),
        username: process.env.REDIS_USERNAME || process.env.REDIS_USER,
        password: process.env.REDIS_PASSWORD,
        ...options,
      });
  redisClient.on("error", reportRedisError);
  return redisClient;
}

const INITIAL_CONNECT_WAIT_MS = 1000;
const INITIAL_STATUSES = new Set(["wait", "connecting", "connect"]);

/**
 * Na primeira conexão, espera o client ficar pronto (até 1 s) para não deixar
 * passar sem contagem as primeiras requisições após o boot. Em reconexão
 * (Redis caído) não espera: falha rápido e a requisição segue sem limite.
 */
async function waitForInitialConnection(client: Redis): Promise<void> {
  if (!INITIAL_STATUSES.has(client.status)) return;
  await new Promise<void>((resolve) => {
    const done = () => {
      clearTimeout(timer);
      client.off("ready", done);
      client.off("error", done);
      client.off("end", done);
      resolve();
    };
    const timer = setTimeout(done, INITIAL_CONNECT_WAIT_MS);
    client.once("ready", done);
    client.once("error", done);
    client.once("end", done);
  });
}

export async function closeRateLimitRedisClient(): Promise<void> {
  if (!redisClient) return;
  const client = redisClient;
  redisClient = null;
  client.disconnect();
}

/**
 * Envolve o RedisStore: nunca lança. O `init` é adiado até o primeiro uso
 * para não abrir conexão no import nem falhar antes do Redis estar pronto.
 */
class ResilientStore implements Store {
  prefix: string;
  localKeys = false;
  private inner: RedisStore | null = null;
  private options: Options | null = null;
  private initPromise: Promise<void> | null = null;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  init(options: Options): void {
    this.options = options;
  }

  private async ready(): Promise<RedisStore> {
    const client = getRateLimitRedisClient();
    await waitForInitialConnection(client);
    if (!this.inner) {
      this.inner = new RedisStore({
        prefix: this.prefix,
        sendCommand: (command: string, ...args: string[]) =>
          client.call(command, ...args) as Promise<never>,
      });
    }
    if (!this.initPromise && this.options) {
      // Falha no load dos scripts é recuperada pelo próprio RedisStore (NOSCRIPT)
      this.initPromise = this.inner.init(this.options).catch(reportRedisError);
    }
    await this.initPromise;
    return this.inner;
  }

  private fallback(): IncrementResponse {
    const windowMs = this.options?.windowMs ?? 60 * 1000;
    return { totalHits: 1, resetTime: new Date(Date.now() + windowMs) };
  }

  async increment(key: string): Promise<IncrementResponse> {
    try {
      return await (await this.ready()).increment(key);
    } catch (error) {
      reportRedisError(error);
      return this.fallback();
    }
  }

  async get(key: string): Promise<ClientRateLimitInfo | undefined> {
    try {
      return await (await this.ready()).get(key);
    } catch (error) {
      reportRedisError(error);
      return undefined;
    }
  }

  async decrement(key: string): Promise<void> {
    try {
      await (await this.ready()).decrement(key);
    } catch (error) {
      reportRedisError(error);
    }
  }

  async resetKey(key: string): Promise<void> {
    try {
      await (await this.ready()).resetKey(key);
    } catch (error) {
      reportRedisError(error);
    }
  }
}

export function createRateLimitStore(prefix: string): Store {
  return new ResilientStore(prefix);
}
