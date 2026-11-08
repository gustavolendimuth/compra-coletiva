import express from "express";
import request from "supertest";
import { createServer, Server as HttpServer } from "http";
import { AddressInfo } from "net";
import { io as connectClient, Socket as ClientSocket } from "socket.io-client";

jest.mock("../../index", () => ({ prisma: { user: { findUnique: jest.fn() } } }));

import { configureHttpSecurity, parseCorsOrigins } from "../httpSecurity";
import { initializeSocket, getIO } from "../../services/socketService";

const FRONTEND_ORIGIN = "https://app.example.com";

function createApp() {
  const app = express();
  configureHttpSecurity(app, [FRONTEND_ORIGIN]);
  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });
  return app;
}

describe("configureHttpSecurity", () => {
  it("security headers: nosniff, HSTS 1 year with subdomains, X-Frame-Options DENY", async () => {
    const res = await request(createApp()).get("/health");

    expect(res.status).toBe(200);
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["strict-transport-security"]).toBe("max-age=31536000; includeSubDomains");
    expect(res.headers["x-frame-options"]).toBe("DENY");
  });

  it("security headers also on 404 responses", async () => {
    const res = await request(createApp()).get("/missing");
    expect(res.headers["x-frame-options"]).toBe("DENY");
  });

  it("cors with credentials still works for the frontend origin", async () => {
    const res = await request(createApp())
      .options("/health")
      .set("Origin", FRONTEND_ORIGIN)
      .set("Access-Control-Request-Method", "POST");

    expect(res.status).toBeLessThan(300);
    expect(res.headers["access-control-allow-origin"]).toBe(FRONTEND_ORIGIN);
    expect(res.headers["access-control-allow-credentials"]).toBe("true");
  });

  it("cors with credentials: uploads stay embeddable cross-origin (CORP cross-origin)", async () => {
    const res = await request(createApp()).get("/health").set("Origin", FRONTEND_ORIGIN);
    expect(res.headers["cross-origin-resource-policy"]).toBe("cross-origin");
  });

  it("parseCorsOrigins keeps the current protocol rules", () => {
    expect(parseCorsOrigins("localhost:5173,app.example.com", "production")).toEqual([
      "http://localhost:5173",
      "https://app.example.com",
    ]);
    expect(parseCorsOrigins("app.example.com", "development")).toEqual(["http://app.example.com"]);
    expect(parseCorsOrigins("https://a.com", "production")).toEqual(["https://a.com"]);
    expect(parseCorsOrigins(undefined, "production")).toEqual(["http://localhost:5173"]);
  });

  describe("socket.io connects", () => {
    let httpServer: HttpServer;
    let client: ClientSocket | undefined;
    const originalCors = process.env.CORS_ORIGIN;

    beforeAll(async () => {
      process.env.CORS_ORIGIN = FRONTEND_ORIGIN;
      httpServer = createServer(createApp());
      initializeSocket(httpServer);
      await new Promise<void>((resolve) => httpServer.listen(0, resolve));
    });

    afterAll(async () => {
      client?.disconnect();
      getIO().close();
      await new Promise<void>((resolve) => httpServer.close(() => resolve()));
      process.env.CORS_ORIGIN = originalCors;
    });

    it("socket.io connects via polling from the frontend origin with security applied", async () => {
      const { port } = httpServer.address() as AddressInfo;
      client = connectClient(`http://127.0.0.1:${port}`, {
        transports: ["polling"],
        extraHeaders: { Origin: FRONTEND_ORIGIN },
        reconnection: false,
      });

      await new Promise<void>((resolve, reject) => {
        client!.on("connect", () => resolve());
        client!.on("connect_error", reject);
      });

      expect(client.connected).toBe(true);
    });
  });
});
