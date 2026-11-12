/**
 * Torna privados os comprovantes PIX enviados antes do armazenamento privado.
 *
 * Uso (no diretório backend/, com as mesmas variáveis de ambiente da API):
 *   npx tsx scripts/migrate-payment-proofs-private.ts
 *
 * - S3: aplica ACL private em cada objeto (requer AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET)
 * - LOCAL: move de UPLOAD_DIR/payment-proofs para PRIVATE_UPLOAD_DIR/payment-proofs
 * - Order.paymentProofUrl passa a ser /api/orders/<id>/payment-proof
 * Idempotente: pode ser rodado de novo.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { migratePaymentProofs } from "../src/services/paymentProofMigration";
import { getPrivateUploadBaseDir, getPublicUploadBaseDir } from "../src/services/paymentProofStorage";
import { getS3Client, getS3Config } from "../src/services/s3Storage";

async function main() {
  const prisma = new PrismaClient();
  const s3Config = getS3Config();

  try {
    const summary = await migratePaymentProofs({
      prisma,
      bucket: s3Config.bucket,
      publicDir: getPublicUploadBaseDir(),
      privateDir: getPrivateUploadBaseDir(),
      sendS3: async (command) => {
        if (!s3Config.enabled) {
          throw new Error("S3 not configured: cannot make S3 payment proof private");
        }
        return getS3Client().send(command);
      },
    });

    if (summary.failed > 0) {
      process.exitCode = 1;
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
