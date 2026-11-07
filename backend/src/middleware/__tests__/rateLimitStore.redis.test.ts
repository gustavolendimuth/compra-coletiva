import express from "express";
import request from "supertest";

// Requer Redis real: RATE_LIMIT_TEST_REDIS_URL=redis://127.0.0.1:56381
const redisUrl = process.env.RATE_LIMIT_TEST_REDIS_URL;
const describeWithRedis = redisUrl ? describe : describe.skip;

type Instance = { app: express.Express; close: () => Promise<void> };

function bootInstance(): Instance {
  let loginRateLimiter!: express.RequestHandler;
  let closeRateLimitRedisClient!: () => Promise<void>;
  jest.isolateModules(() => {
    ({ loginRateLimiter } = require("../rateLimiter"));
    ({ closeRateLimitRedisClient } = require("../rateLimitStore"));
  });
  const app = express();
  app.set("trust proxy", 1);
  app.post("/login", loginRateLimiter, (_req, res) => {
    res.json({ ok: true });
  });
  return { app, close: closeRateLimitRedisClient };
}

describeWithRedis("rate limit store on real Redis", () => {
  const previousRedisUrl = process.env.REDIS_URL;
  afterAll(() => {
    process.env.REDIS_URL = previousRedisUrl;
  });

  it("two instances share the same counter through Redis", async () => {
    process.env.REDIS_URL = redisUrl;
    const instanceA = bootInstance();
    const instanceB = bootInstance();
    // IP único por execução para não herdar contagem de execuções anteriores
    const header = `1.1.1.1, 10.${Date.now() % 250}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;

    try {
      const statuses: number[] = [];
      for (let i = 0; i < 10; i += 1) {
        const target = i % 2 === 0 ? instanceA : instanceB;
        const res = await request(target.app).post("/login").set("X-Forwarded-For", header);
        statuses.push(res.status);
      }
      expect(statuses).toEqual(Array(10).fill(200));

      const blockedOnA = await request(instanceA.app).post("/login").set("X-Forwarded-For", header);
      const blockedOnB = await request(instanceB.app).post("/login").set("X-Forwarded-For", header);
      expect(blockedOnA.status).toBe(429);
      expect(blockedOnB.status).toBe(429);
    } finally {
      await instanceA.close();
      await instanceB.close();
    }
  });
});
