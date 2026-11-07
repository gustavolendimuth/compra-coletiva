import express from "express";
import request from "supertest";

describe("rate limit store resilience", () => {
  const previousRedisUrl = process.env.REDIS_URL;

  afterAll(() => {
    process.env.REDIS_URL = previousRedisUrl;
  });

  it("redis unavailable: limited route keeps answering above the limit and logs [RateLimit] once per minute", async () => {
    // Nada escuta na porta 1: conexão recusada
    process.env.REDIS_URL = "redis://127.0.0.1:1";
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

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

    try {
      const statuses: number[] = [];
      for (let i = 0; i < 15; i += 1) {
        const res = await request(app).post("/login").set("X-Forwarded-For", "203.0.113.50");
        statuses.push(res.status);
      }
      // aguarda eventos de erro de reconexão do client
      await new Promise((resolve) => setTimeout(resolve, 300));

      expect(statuses).toEqual(Array(15).fill(200));
      const rateLimitLogs = errorSpy.mock.calls.filter((args) =>
        args.some((arg) => typeof arg === "string" && arg.includes("[RateLimit]"))
      );
      expect(rateLimitLogs).toHaveLength(1);
      expect(errorSpy).toHaveBeenCalledTimes(1);
    } finally {
      await closeRateLimitRedisClient();
      errorSpy.mockRestore();
    }
  });
});
