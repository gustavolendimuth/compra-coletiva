import fs from "fs";
import os from "os";
import path from "path";

const uploadParams: Array<Record<string, unknown>> = [];
jest.mock("@aws-sdk/lib-storage", () => ({
  Upload: jest.fn().mockImplementation(({ params }: { params: Record<string, unknown> }) => {
    uploadParams.push(params);
    return { done: jest.fn().mockResolvedValue({}) };
  }),
}));

import { ImageUploadService } from "../imageUploadService";
import { PaymentProofStorage } from "../paymentProofStorage";
import { JPEG_BYTES, PDF_BYTES, PNG_BYTES, WEBP_BYTES, makeMulterFile } from "../../__tests__/fileFixtures";

const S3_ENV = ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_S3_BUCKET"];
let publicDir: string;
let privateDir: string;

beforeEach(() => {
  uploadParams.length = 0;
  publicDir = fs.mkdtempSync(path.join(os.tmpdir(), "uploads-public-"));
  privateDir = fs.mkdtempSync(path.join(os.tmpdir(), "uploads-private-"));
  process.env.UPLOAD_DIR = publicDir;
  process.env.PRIVATE_UPLOAD_DIR = privateDir;
  S3_ENV.forEach((key) => delete process.env[key]);
});

afterEach(() => {
  fs.rmSync(publicDir, { recursive: true, force: true });
  fs.rmSync(privateDir, { recursive: true, force: true });
  S3_ENV.forEach((key) => delete process.env[key]);
});

describe("extension from detected type", () => {
  it.each([
    ["jpg", JPEG_BYTES],
    ["png", PNG_BYTES],
    ["webp", WEBP_BYTES],
  ])("extension from detected type: image saved as .%s regardless of originalname", async (extension, bytes) => {
    const result = await ImageUploadService.uploadImage(makeMulterFile(bytes, "evil.html", "text/html"), "campaigns");

    expect(result.imageKey).toMatch(new RegExp(`^campaigns/[^/]+\\.${extension}$`));
    expect(fs.existsSync(path.join(publicDir, result.imageKey))).toBe(true);
  });

  it("extension from detected type: payment proof PDF saved as .pdf", async () => {
    const result = await PaymentProofStorage.upload(makeMulterFile(PDF_BYTES, "comprovante.html", "image/png"));

    expect(result.key).toMatch(/^payment-proofs\/[^/]+\.pdf$/);
    expect(fs.existsSync(path.join(privateDir, result.key))).toBe(true);
  });

  it("rejects PDF for public images", async () => {
    await expect(
      ImageUploadService.uploadImage(makeMulterFile(PDF_BYTES, "a.pdf", "application/pdf"), "campaigns")
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});

describe("payment proof S3 without ACL", () => {
  it("payment proof S3 without ACL: uploads with private object (no ACL param)", async () => {
    process.env.AWS_ACCESS_KEY_ID = "key";
    process.env.AWS_SECRET_ACCESS_KEY = "secret";
    process.env.AWS_S3_BUCKET = "bucket";

    const result = await PaymentProofStorage.upload(makeMulterFile(PNG_BYTES, "proof.html", "text/html"));

    expect(result.storageType).toBe("S3");
    expect(uploadParams).toHaveLength(1);
    expect(uploadParams[0]).not.toHaveProperty("ACL");
    expect(uploadParams[0]).toMatchObject({ Bucket: "bucket", Key: result.key, ContentType: "image/png" });
    expect(result.key).toMatch(/^payment-proofs\/[^/]+\.png$/);
  });
});
