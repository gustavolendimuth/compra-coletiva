import express from "express";
import fs from "fs";
import os from "os";
import path from "path";
import request from "supertest";
import { mountUploadsStatic } from "../uploadsStatic";
import { PNG_BYTES } from "../../__tests__/fileFixtures";

let publicDir: string;

function createApp() {
  const app = express();
  mountUploadsStatic(app, publicDir);
  return app;
}

beforeEach(() => {
  publicDir = fs.mkdtempSync(path.join(os.tmpdir(), "uploads-public-"));
});

afterEach(() => {
  fs.rmSync(publicDir, { recursive: true, force: true });
});

describe("mountUploadsStatic", () => {
  it("serves files with X-Content-Type-Options: nosniff", async () => {
    fs.mkdirSync(path.join(publicDir, "campaigns"));
    fs.writeFileSync(path.join(publicDir, "campaigns", "a.png"), PNG_BYTES);

    const res = await request(createApp()).get("/uploads/campaigns/a.png");

    expect(res.status).toBe(200);
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
  });

  it("payment proof not served: legacy proof left in the served dir also returns 404", async () => {
    fs.mkdirSync(path.join(publicDir, "payment-proofs"));
    fs.writeFileSync(path.join(publicDir, "payment-proofs", "legacy.png"), PNG_BYTES);

    const res = await request(createApp()).get("/uploads/payment-proofs/legacy.png");
    expect(res.status).toBe(404);
  });

  // No Railway o serviço tem um volume só: o diretório privado pode ficar dentro do público
  it("private dir nested in the served dir is never served", async () => {
    const privateDir = path.join(publicDir, "private");
    fs.mkdirSync(path.join(privateDir, "payment-proofs"), { recursive: true });
    fs.writeFileSync(path.join(privateDir, "payment-proofs", "new.png"), PNG_BYTES);
    const app = express();
    mountUploadsStatic(app, publicDir, privateDir);

    const res = await request(app).get("/uploads/private/payment-proofs/new.png");
    expect(res.status).toBe(404);
  });
});
