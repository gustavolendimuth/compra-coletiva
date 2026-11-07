import express from "express";
import request from "supertest";

jest.mock("../../middleware/rateLimitStore", () => {
  const { MemoryStore } = jest.requireActual("express-rate-limit");
  return { createRateLimitStore: () => new MemoryStore() };
});

const mockCampaignFindUnique = jest.fn();
jest.mock("../../index", () => ({
  prisma: { campaign: { findUnique: mockCampaignFindUnique } },
}));
const mockGeocodeCEP = jest.fn();
jest.mock("../../services/geocodingService", () => ({
  geocodingService: { geocodeCEP: (...args: unknown[]) => mockGeocodeCEP(...args) },
}));
const mockGetRoute = jest.fn();
jest.mock("../../services/routingService", () => ({
  routingService: { getRoute: (...args: unknown[]) => mockGetRoute(...args) },
}));
jest.mock("../../middleware/authMiddleware", () => ({
  requireAuth: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
  optionalAuth: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
  requireCampaignOwnership: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
}));
jest.mock("../../middleware/uploadMiddleware", () => ({
  uploadCampaignImage: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
}));
jest.mock("../../services/imageUploadService", () => ({ ImageUploadService: {} }));
jest.mock("../../services/invoiceGenerator", () => ({ InvoiceGenerator: {} }));
jest.mock("../../services/orderSummaryGenerator", () => ({ OrderSummaryGenerator: {} }));
jest.mock("../../services/shippingCalculator", () => ({ ShippingCalculator: {} }));
jest.mock("../../services/paymentReleaseService", () => ({ PaymentReleaseService: {} }));

import geocodingRouter from "../geocoding";
import campaignRouter from "../campaigns";
import { errorHandler } from "../../middleware/errorHandler";
import { configureTrustProxy } from "../../config/trustProxy";

function createApp() {
  const app = express();
  configureTrustProxy(app);
  app.use(express.json());
  app.use("/api/geocoding", geocodingRouter);
  app.use("/api/campaigns", campaignRouter);
  app.use(errorHandler);
  return app;
}

const geo = { zipCode: "01001-000", city: "São Paulo", state: "SP", latitude: -23.55, longitude: -46.63 };

describe("geo rate limit", () => {
  it("geocoding and distance share one 30/min counter; 31st call gets 429 and calls no external service", async () => {
    mockGeocodeCEP.mockResolvedValue(geo);
    mockGetRoute.mockResolvedValue({ distanceKm: 3, coordinates: [], durationMin: 5 });
    mockCampaignFindUnique.mockResolvedValue({
      id: "c1",
      pickupLatitude: -23.5,
      pickupLongitude: -46.6,
    });
    const app = createApp();
    const client = "1.1.1.1, 203.0.113.40";

    for (let i = 1; i <= 30; i += 1) {
      const path =
        i % 3 === 0
          ? "/api/campaigns/c1/distance?fromZipCode=01001-000"
          : i % 3 === 1
            ? "/api/geocoding/cep/01001-000"
            : "/api/geocoding/cep/01001-000/coordinates?number=10";
      const res = await request(app).get(path).set("X-Forwarded-For", client);
      expect(res.status).toBe(200);
    }

    const geocodeCalls = mockGeocodeCEP.mock.calls.length;
    const routeCalls = mockGetRoute.mock.calls.length;

    const blockedGeo = await request(app)
      .get("/api/geocoding/cep/01001-000")
      .set("X-Forwarded-For", client);
    const blockedDistance = await request(app)
      .get("/api/campaigns/c1/distance?fromZipCode=01001-000")
      .set("X-Forwarded-For", client);

    expect(blockedGeo.status).toBe(429);
    expect(blockedDistance.status).toBe(429);
    expect(blockedGeo.body).toEqual({ status: "error", message: expect.any(String) });
    expect(mockGeocodeCEP).toHaveBeenCalledTimes(geocodeCalls);
    expect(mockGetRoute).toHaveBeenCalledTimes(routeCalls);
  });
});
