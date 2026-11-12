import { S3Client } from "@aws-sdk/client-s3";

export interface S3Config {
  bucket: string;
  region: string;
  enabled: boolean;
}

/**
 * Lê a configuração do S3 do ambiente a cada chamada (permite trocar em testes)
 */
export function getS3Config(): S3Config {
  const bucket = process.env.AWS_S3_BUCKET || "";
  return {
    bucket,
    region: process.env.AWS_S3_REGION || "us-east-1",
    enabled: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && bucket),
  };
}

let cachedClient: S3Client | null = null;
let cachedClientSignature = "";

export function getS3Client(): S3Client {
  const { region } = getS3Config();
  const signature = `${region}|${process.env.AWS_ACCESS_KEY_ID || ""}`;
  if (!cachedClient || cachedClientSignature !== signature) {
    cachedClient = new S3Client({
      region,
      credentials:
        process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
          ? {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID,
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            }
          : undefined,
    });
    cachedClientSignature = signature;
  }
  return cachedClient;
}
