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

    const nowSpy = jest.spyOn(Date, "now");
    const send = () => request(app).post("/login").set("X-Forwarded-For", "203.0.113.50");
    const rateLimitLogs = [expect.stringContaining("[RateLimit]")];
    try {
      const start = Date.now();
      const statuses: number[] = [];
      for (let i = 0; i < 15; i += 1) {
        statuses.push((await send()).status);
      }
      // aguarda eventos de erro de reconexão do client
      await new Promise((resolve) => setTimeout(resolve, 300));

      expect(statuses).toEqual(Array(15).fill(200));
      expect(errorSpy.mock.calls).toEqual([rateLimitLogs]);

      nowSpy.mockReturnValue(start + 30 * 1000);
      await send();
      expect(errorSpy.mock.calls).toEqual([rateLimitLogs]);

      nowSpy.mockReturnValue(start + 62 * 1000);
      await send();
      expect(errorSpy.mock.calls).toEqual([rateLimitLogs, rateLimitLogs]);
    } finally {
      await closeRateLimitRedisClient();
      nowSpy.mockRestore();
      errorSpy.mockRestore();
    }
  });
});
