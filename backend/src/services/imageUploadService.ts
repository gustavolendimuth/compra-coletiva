import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import fs from "fs";
import path from "path";
import { ImageStorageType } from "@prisma/client";
import { getS3Client, getS3Config } from "./s3Storage";
import { assertAllowedFileType, buildStoredFilename, IMAGE_EXTENSIONS } from "../utils/fileSignature";

/**
 * Diretório público (servido em /uploads)
 * UPLOAD_DIR can be set to a Railway volume path (e.g., /app/data)
 * Defaults to ./uploads for development
 */
function getUploadBaseDir(): string {
  return process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
}

/**
 * Ensure folder directory exists for local storage
 */
function ensureFolderExists(baseDir: string, folder: string): string {
  const folderPath = path.join(baseDir, folder);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
    console.log(`📁 Created uploads folder: ${folderPath}`);
  }
  return folderPath;
}

interface UploadResult {
  imageUrl: string;
  imageKey: string;
  storageType: ImageStorageType;
}

export class ImageUploadService {
  /**
   * Upload de imagem pública para S3 ou storage local (fallback).
   * O tipo é detectado pelos bytes (JPEG, PNG, WebP); qualquer outro conteúdo → 400.
   */
  static async uploadImage(
    file: Express.Multer.File,
    folder: string = "campaigns"
  ): Promise<UploadResult> {
    const detected = assertAllowedFileType(file.buffer, IMAGE_EXTENSIONS);
    const filename = buildStoredFilename(detected);
    const key = `${folder}/${filename}`;
    const s3Config = getS3Config();

    if (s3Config.enabled) {
      try {
        // Upload to S3
        const upload = new Upload({
          client: getS3Client(),
          params: {
            Bucket: s3Config.bucket,
            Key: key,
            Body: file.buffer,
            ContentType: detected.mime,
            ACL: "public-read",
          },
        });

        await upload.done();

        const imageUrl = `https://${s3Config.bucket}.s3.${s3Config.region}.amazonaws.com/${key}`;

        console.log(`✅ Image uploaded to S3: ${imageUrl}`);

        return {
          imageUrl,
          imageKey: key,
          storageType: "S3" as ImageStorageType,
        };
      } catch (error) {
        console.error("❌ S3 upload failed, falling back to local storage:", error);
        return this.uploadToLocal(file, filename, folder);
      }
    } else {
      console.log("⚠️ S3 not configured, using local storage");
      return this.uploadToLocal(file, filename, folder);
    }
  }

  /**
   * Upload to local file system
   */
  private static uploadToLocal(
    file: Express.Multer.File,
    filename: string,
    folder: string = "campaigns"
  ): UploadResult {
    const folderPath = ensureFolderExists(getUploadBaseDir(), folder);
    const localPath = path.join(folderPath, filename);
    fs.writeFileSync(localPath, file.buffer);

    const imageUrl = `/uploads/${folder}/${filename}`;

    console.log(`✅ Image saved locally: ${imageUrl}`);

    return {
      imageUrl,
      imageKey: `${folder}/${filename}`,
      storageType: "LOCAL" as ImageStorageType,
    };
  }

  /**
   * Delete image from S3 or local storage
   */
  static async deleteImage(imageKey: string, storageType: ImageStorageType): Promise<void> {
    const s3Config = getS3Config();
    if (storageType === "S3" && s3Config.enabled) {
      try {
        await getS3Client().send(
          new DeleteObjectCommand({
            Bucket: s3Config.bucket,
            Key: imageKey,
          })
        );
        console.log(`✅ Image deleted from S3: ${imageKey}`);
      } catch (error) {
        console.error("❌ Failed to delete image from S3:", error);
      }
    } else {
      // Delete local file
      try {
        // imageKey now includes folder path (e.g., "avatars/filename.jpg")
        const localPath = path.join(getUploadBaseDir(), imageKey);
        if (fs.existsSync(localPath)) {
          fs.unlinkSync(localPath);
          console.log(`✅ Image deleted locally: ${localPath}`);
        }
      } catch (error) {
        console.error("❌ Failed to delete local image:", error);
      }
    }
  }

  /**
   * Check if S3 is configured and available
   */
  static isS3Available(): boolean {
    return getS3Config().enabled;
  }

  /**
   * Get storage info for debugging
   */
  static getStorageInfo() {
    const s3Config = getS3Config();
    return {
      useS3: s3Config.enabled,
      bucket: s3Config.bucket,
      region: s3Config.region,
      hasCredentials: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
      uploadBaseDir: getUploadBaseDir(),
    };
  }

  /**
   * Get the base upload directory path (creates it when missing)
   */
  static getUploadBaseDir(): string {
    const baseDir = getUploadBaseDir();
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
      console.log(`📁 Created base uploads directory: ${baseDir}`);
    }
    return baseDir;
  }
}
