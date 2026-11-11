import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import fs from "fs";
import path from "path";
import { ImageStorageType } from "@prisma/client";

// S3 Client configuration
const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION || "us-east-1",
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }
    : undefined,
});

const S3_BUCKET = process.env.AWS_S3_BUCKET || "";
const USE_S3 = !!(
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY &&
  S3_BUCKET
);

// Local storage configuration
// UPLOAD_DIR can be set to a Railway volume path (e.g., /app/data)
// Defaults to ./uploads for development
const UPLOAD_BASE_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");

// Ensure base uploads directory exists
if (!fs.existsSync(UPLOAD_BASE_DIR)) {
  fs.mkdirSync(UPLOAD_BASE_DIR, { recursive: true });
  console.log(`📁 Created base uploads directory: ${UPLOAD_BASE_DIR}`);
}

/**
 * Ensure folder directory exists for local storage
 */
function ensureFolderExists(folder: string): string {
  const folderPath = path.join(UPLOAD_BASE_DIR, folder);
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
   * Upload image to S3 or local storage (fallback)
   */
  static async uploadImage(
    file: Express.Multer.File,
    folder: string = "campaigns"
  ): Promise<UploadResult> {
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname
      .replace(/[^a-z0-9.]/gi, "-")
      .toLowerCase()}`;
    const key = `${folder}/${filename}`;

    if (USE_S3) {
      try {
        // Upload to S3
        const upload = new Upload({
          client: s3Client,
          params: {
            Bucket: S3_BUCKET,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
            ACL: "public-read",
          },
        });

        await upload.done();

        const imageUrl = `https://${S3_BUCKET}.s3.${process.env.AWS_S3_REGION || "us-east-1"}.amazonaws.com/${key}`;

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
    const folderPath = ensureFolderExists(folder);
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
    if (storageType === "S3" && USE_S3) {
      try {
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: S3_BUCKET,
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
        const localPath = path.join(UPLOAD_BASE_DIR, imageKey);
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
    return USE_S3;
  }

  /**
   * Get storage info for debugging
   */
  static getStorageInfo() {
    return {
      useS3: USE_S3,
      bucket: S3_BUCKET,
      region: process.env.AWS_S3_REGION || "us-east-1",
      hasCredentials: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
      uploadBaseDir: UPLOAD_BASE_DIR,
    };
  }

  /**
   * Get the base upload directory path
   */
  static getUploadBaseDir(): string {
    return UPLOAD_BASE_DIR;
  }
}



