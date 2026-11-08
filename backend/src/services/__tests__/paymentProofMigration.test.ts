import fs from "fs";
import os from "os";
import path from "path";
import { PutObjectAclCommand } from "@aws-sdk/client-s3";
import { migratePaymentProofs, PaymentProofMigrationOrder } from "../paymentProofMigration";
import { PNG_BYTES } from "../../__tests__/fileFixtures";

let publicDir: string;
let privateDir: string;
let orders: PaymentProofMigrationOrder[];

const sendS3 = jest.fn();
const prisma = {
  order: {
    findMany: jest.fn(() => Promise.resolve(orders.map((order) => ({ ...order })))),
    update: jest.fn(({ where, data }: { where: { id: string }; data: { paymentProofUrl: string } }) => {
      const order = orders.find((o) => o.id === where.id)!;
      order.paymentProofUrl = data.paymentProofUrl;
      return Promise.resolve(order);
    }),
  },
};

function run() {
  return migratePaymentProofs({ prisma, sendS3, bucket: "bucket", publicDir, privateDir });
}

beforeEach(() => {
  sendS3.mockReset();
  sendS3.mockResolvedValue({});
  prisma.order.findMany.mockClear();
  prisma.order.update.mockClear();
  publicDir = fs.mkdtempSync(path.join(os.tmpdir(), "uploads-public-"));
  privateDir = fs.mkdtempSync(path.join(os.tmpdir(), "uploads-private-"));
  fs.mkdirSync(path.join(publicDir, "payment-proofs"));
  fs.writeFileSync(path.join(publicDir, "payment-proofs", "local.png"), PNG_BYTES);
  orders = [
    {
      id: "o-s3",
      paymentProofUrl: "https://bucket.s3.us-east-1.amazonaws.com/payment-proofs/s3.png",
      paymentProofKey: "payment-proofs/s3.png",
      paymentProofStorageType: "S3",
    },
    {
      id: "o-local",
      paymentProofUrl: "/uploads/payment-proofs/local.png",
      paymentProofKey: "payment-proofs/local.png",
      paymentProofStorageType: "LOCAL",
    },
  ];
});

afterEach(() => {
  fs.rmSync(publicDir, { recursive: true, force: true });
  fs.rmSync(privateDir, { recursive: true, force: true });
});

function expectMigratedState() {
  const s3Commands = sendS3.mock.calls.map(([command]) => command);
  expect(s3Commands.length).toBeGreaterThan(0);
  for (const command of s3Commands) {
    expect(command).toBeInstanceOf(PutObjectAclCommand);
    expect(command.input).toEqual({ Bucket: "bucket", Key: "payment-proofs/s3.png", ACL: "private" });
  }
  expect(fs.existsSync(path.join(publicDir, "payment-proofs", "local.png"))).toBe(false);
  expect(fs.readFileSync(path.join(privateDir, "payment-proofs", "local.png"))).toEqual(PNG_BYTES);
  expect(orders.find((o) => o.id === "o-s3")!.paymentProofUrl).toBe("/api/orders/o-s3/payment-proof");
  expect(orders.find((o) => o.id === "o-local")!.paymentProofUrl).toBe("/api/orders/o-local/payment-proof");
}

describe("migratePaymentProofs", () => {
  it("migrates S3 proofs to private ACL and LOCAL proofs out of the served dir", async () => {
    const summary = await run();

    expectMigratedState();
    expect(summary).toMatchObject({ s3: 1, local: 1, missing: 0, failed: 0 });
  });

  it("is idempotent: a second run keeps the same state without errors", async () => {
    await run();
    const second = await run();

    expectMigratedState();
    expect(second).toMatchObject({ failed: 0, missing: 0 });
  });

  it("is idempotent when the local proof was already moved by a previous partial run", async () => {
    fs.mkdirSync(path.join(privateDir, "payment-proofs"));
    fs.renameSync(path.join(publicDir, "payment-proofs", "local.png"), path.join(privateDir, "payment-proofs", "local.png"));

    const summary = await run();

    expectMigratedState();
    expect(summary).toMatchObject({ failed: 0, missing: 0 });
  });

  it("counts a missing local file without aborting the rest", async () => {
    fs.rmSync(path.join(publicDir, "payment-proofs", "local.png"));

    const summary = await run();

    expect(summary).toMatchObject({ s3: 1, missing: 1 });
    expect(orders.find((o) => o.id === "o-s3")!.paymentProofUrl).toBe("/api/orders/o-s3/payment-proof");
  });
});
