import express from "express";
import request from "supertest";

jest.mock("../../index", () => ({ prisma: {} }));

import { configureTrustProxy } from "../trustProxy";
import { AuditService } from "../../services/auditService";
import { LegalAcceptanceService } from "../../services/legalAcceptanceService";

describe("trust proxy", () => {
  it("uses the rightmost client ip from X-Forwarded-For for req.ip, AuditLog and LegalAcceptanceLog", async () => {
    const app = express();
    configureTrustProxy(app);
    app.get("/ip", (req, res) => {
      res.json({
        reqIp: req.ip,
        auditIp: (AuditService as unknown as { getClientIp: (r: express.Request) => string }).getClientIp(req),
        legalIp: LegalAcceptanceService.getClientIp(req),
      });
    });

    const res = await request(app).get("/ip").set("X-Forwarded-For", "1.1.1.1, 203.0.113.7");

    expect(res.body).toEqual({
      reqIp: "203.0.113.7",
      auditIp: "203.0.113.7",
      legalIp: "203.0.113.7",
    });
  });
});
