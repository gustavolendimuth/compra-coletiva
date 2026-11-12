import { DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "fs";
import path from "path";
import { ImageStorageType } from "@prisma/client";
import { getS3Client, getS3Config } from "./s3Storage";
import { assertAllowedFileType, buildStoredFilename, PAYMENT_PROOF_EXTENSIONS } from "../utils/fileSignature";

export const PAYMENT_PROOF_FOLDER = "payment-proofs";
export const PAYMENT_PROOF_SIGNED_URL_TTL_SECONDS = 300;

interface PaymentProofUploadResult {
  key: string;
  storageType: ImageStorageType;
  contentType: string;
}

/**
 * Diretório privado (nunca servido em /uploads).
 * PRIVATE_UPLOAD_DIR deve apontar para um volume persistente em produção.
 */
export function getPrivateUploadBaseDir(): string {
  return process.env.PRIVATE_UPLOAD_DIR || path.join(process.cwd(), "private-uploads");
}

/**
 * Diretório público legado (antes da migração os comprovantes ficavam aqui)
 */
export function getPublicUploadBaseDir(): string {
  return process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
}

/**
 * URL opaca do comprovante: o acesso sempre passa pela checagem de permissão
 */
export function buildPaymentProofUrl(orderId: string): string {
  return `/api/orders/${orderId}/payment-proof`;
}

function resolveInside(baseDir: string, key: string): string | null {
  const resolvedBase = path.resolve(baseDir);
  const resolved = path.resolve(resolvedBase, key);
  if (!resolved.startsWith(resolvedBase + path.sep)) {
    return null;
  }
  return resolved;
}

export class PaymentProofStorage {
  /**
   * Grava o comprovante privado (S3 sem ACL pública, ou diretório local privado).
   * Tipo detectado pelos bytes: JPEG, PNG, WebP ou PDF; qualquer outro → 400.
   */
  static async upload(file: Express.Multer.File): Promise<PaymentProofUploadResult> {
    const detected = assertAllowedFileType(file.buffer, PAYMENT_PROOF_EXTENSIONS);
    const key = `${PAYMENT_PROOF_FOLDER}/${buildStoredFilename(detected)}`;
    const s3Config = getS3Config();

    if (s3Config.enabled) {
      try {
        const upload = new Upload({
          client: getS3Client(),
          params: {
            Bucket: s3Config.bucket,
            Key: key,
            Body: file.buffer,
            ContentType: detected.mime,
          },
        });
        await upload.done();
        console.log(`✅ Payment proof uploaded to S3 (private): ${key}`);
        return { key, storageType: "S3" as ImageStorageType, contentType: detected.mime };
      } catch (error) {
        console.error("❌ S3 upload failed, falling back to private local storage:", error);
      }
    }

    const localPath = resolveInside(getPrivateUploadBaseDir(), key)!;
    fs.mkdirSync(path.dirname(localPath), { recursive: true });
    fs.writeFileSync(localPath, file.buffer);
    console.log(`✅ Payment proof saved locally (private): ${key}`);
    return { key, storageType: "LOCAL" as ImageStorageType, contentType: detected.mime };
  }

  /**
   * URL assinada de leitura (300 s) para um comprovante no S3
   */
  static async getSignedUrl(key: string): Promise<string> {
    const { bucket } = getS3Config();
    return getSignedUrl(getS3Client(), new GetObjectCommand({ Bucket: bucket, Key: key }), {
      expiresIn: PAYMENT_PROOF_SIGNED_URL_TTL_SECONDS,
    });
  }

  /**
   * Caminho local do comprovante: diretório privado, ou o público legado ainda não migrado
   */
  static resolveLocalPath(key: string): string | null {
    for (const baseDir of [getPrivateUploadBaseDir(), getPublicUploadBaseDir()]) {
      const candidate = resolveInside(baseDir, key);
      if (candidate && fs.existsSync(candidate)) {
        return candidate;
      }
    }
    return null;
  }

  static async delete(key: string, storageType: ImageStorageType): Promise<void> {
    const s3Config = getS3Config();
    if (storageType === "S3" && s3Config.enabled) {
      try {
        await getS3Client().send(new DeleteObjectCommand({ Bucket: s3Config.bucket, Key: key }));
      } catch (error) {
        console.error("❌ Failed to delete payment proof from S3:", error);
      }
      return;
    }

    try {
      const localPath = this.resolveLocalPath(key);
      if (localPath) {
        fs.unlinkSync(localPath);
      }
    } catch (error) {
      console.error("❌ Failed to delete local payment proof:", error);
    }
  }
}
