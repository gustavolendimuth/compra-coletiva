import fs from "fs";
import path from "path";
import { PutObjectAclCommand } from "@aws-sdk/client-s3";
import { buildPaymentProofUrl } from "./paymentProofStorage";

/**
 * Migração dos comprovantes enviados antes do armazenamento privado.
 * - S3: PutObjectAcl ACL=private no mesmo key
 * - LOCAL: move de <publicDir>/<key> para <privateDir>/<key>
 * - ambos: Order.paymentProofUrl passa a ser /api/orders/<id>/payment-proof
 * Idempotente: rodar de novo não quebra comprovantes já migrados.
 */

export interface PaymentProofMigrationOrder {
  id: string;
  paymentProofUrl: string | null;
  paymentProofKey: string | null;
  paymentProofStorageType: "S3" | "LOCAL" | null;
}

interface MigrationPrisma {
  order: {
    findMany(args: unknown): Promise<PaymentProofMigrationOrder[]>;
    update(args: { where: { id: string }; data: { paymentProofUrl: string } }): Promise<unknown>;
  };
}

export interface PaymentProofMigrationOptions {
  prisma: MigrationPrisma;
  sendS3: (command: PutObjectAclCommand) => Promise<unknown>;
  bucket: string;
  publicDir: string;
  privateDir: string;
  logger?: Pick<Console, "log" | "warn" | "error">;
}

export interface PaymentProofMigrationSummary {
  total: number;
  s3: number;
  local: number;
  missing: number;
  failed: number;
  urlsUpdated: number;
}

function resolveInside(baseDir: string, key: string): string | null {
  const resolvedBase = path.resolve(baseDir);
  const resolved = path.resolve(resolvedBase, key);
  return resolved.startsWith(resolvedBase + path.sep) ? resolved : null;
}

function moveFile(source: string, destination: string): void {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  try {
    fs.renameSync(source, destination);
  } catch (error) {
    // volumes diferentes: copia e remove
    if ((error as NodeJS.ErrnoException).code !== "EXDEV") throw error;
    fs.copyFileSync(source, destination);
    fs.unlinkSync(source);
  }
}

/**
 * Retorna true se o arquivo está (ou já estava) no diretório privado
 */
function migrateLocalFile(key: string, publicDir: string, privateDir: string): boolean {
  const source = resolveInside(publicDir, key);
  const destination = resolveInside(privateDir, key);
  if (!source || !destination) {
    throw new Error(`Invalid payment proof key: ${key}`);
  }

  const sourceExists = fs.existsSync(source);
  const destinationExists = fs.existsSync(destination);

  if (sourceExists && !destinationExists) {
    moveFile(source, destination);
    return true;
  }
  if (sourceExists && destinationExists) {
    // execução anterior copiou mas não removeu: a cópia privada vale
    fs.unlinkSync(source);
    return true;
  }
  return destinationExists;
}

export async function migratePaymentProofs(
  options: PaymentProofMigrationOptions
): Promise<PaymentProofMigrationSummary> {
  const { prisma, sendS3, bucket, publicDir, privateDir, logger = console } = options;
  const summary: PaymentProofMigrationSummary = { total: 0, s3: 0, local: 0, missing: 0, failed: 0, urlsUpdated: 0 };

  const orders = await prisma.order.findMany({
    where: { paymentProofKey: { not: null } },
    select: { id: true, paymentProofUrl: true, paymentProofKey: true, paymentProofStorageType: true },
  });

  for (const order of orders) {
    if (!order.paymentProofKey) continue;
    summary.total += 1;

    try {
      if (order.paymentProofStorageType === "S3") {
        await sendS3(new PutObjectAclCommand({ Bucket: bucket, Key: order.paymentProofKey, ACL: "private" }));
        summary.s3 += 1;
      } else if (migrateLocalFile(order.paymentProofKey, publicDir, privateDir)) {
        summary.local += 1;
      } else {
        summary.missing += 1;
        logger.warn(`[PaymentProofMigration] Local file missing for order ${order.id}: ${order.paymentProofKey}`);
      }

      const opaqueUrl = buildPaymentProofUrl(order.id);
      if (order.paymentProofUrl !== opaqueUrl) {
        await prisma.order.update({ where: { id: order.id }, data: { paymentProofUrl: opaqueUrl } });
        summary.urlsUpdated += 1;
      }
    } catch (error) {
      summary.failed += 1;
      logger.error(`[PaymentProofMigration] Failed for order ${order.id}:`, error);
    }
  }

  logger.log("[PaymentProofMigration] Summary:", summary);
  return summary;
}
