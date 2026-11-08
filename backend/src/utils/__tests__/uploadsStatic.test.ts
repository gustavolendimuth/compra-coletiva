import express from "express";
import fs from "fs";
import os from "os";
import path from "path";
import request from "supertest";
import { mountUploadsStatic } from "../uploadsStatic";
import { PaymentProofStorage } from "../../services/paymentProofStorage";
import { PNG_BYTES, makeMulterFile } from "../../__tests__/fileFixtures";

let publicDir: string;
let privateDir: string;

function createApp() {
  const app = express();
  mountUploadsStatic(app, publicDir);
  return app;
}

beforeEach(() => {
  publicDir = fs.mkdtempSync(path.join(os.tmpdir(), "uploads-public-"));
  privateDir = fs.mkdtempSync(path.join(os.tmpdir(), "uploads-private-"));
  process.env.UPLOAD_DIR = publicDir;
  process.env.PRIVATE_UPLOAD_DIR = privateDir;
  ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_S3_BUCKET"].forEach((key) => delete process.env[key]);
});

afterEach(() => {
  fs.rmSync(publicDir, { recursive: true, force: true });
  fs.rmSync(privateDir, { recursive: true, force: true });
});

describe("mountUploadsStatic", () => {
  it("serves files with X-Content-Type-Options: nosniff", async () => {
    fs.mkdirSync(path.join(publicDir, "campaigns"));
    fs.writeFileSync(path.join(publicDir, "campaigns", "a.png"), PNG_BYTES);

    const res = await request(createApp()).get("/uploads/campaigns/a.png");

    expect(res.status).toBe(200);
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
  });

  it("nosniff also on 404 under /uploads", async () => {
    const res = await request(createApp()).get("/uploads/missing.png");

    expect(res.headers["x-content-type-options"]).toBe("nosniff");
  });

  it("payment proof not served: new local proof lives outside the served dir and returns 404", async () => {
    const result = await PaymentProofStorage.upload(makeMulterFile(PNG_BYTES, "proof.png"));
    const filename = path.basename(result.key);

    expect(fs.existsSync(path.join(privateDir, "payment-proofs", filename))).toBe(true);
    expect(fs.existsSync(path.join(publicDir, "payment-proofs", filename))).toBe(false);

    const res = await request(createApp()).get(`/uploads/payment-proofs/${filename}`);
    expect(res.status).toBe(404);
  });

  it("payment proof not served: legacy proof left in the served dir also returns 404", async () => {
    fs.mkdirSync(path.join(publicDir, "payment-proofs"));
    fs.writeFileSync(path.join(publicDir, "payment-proofs", "legacy.png"), PNG_BYTES);

    const res = await request(createApp()).get("/uploads/payment-proofs/legacy.png");
    expect(res.status).toBe(404);
  });
});
