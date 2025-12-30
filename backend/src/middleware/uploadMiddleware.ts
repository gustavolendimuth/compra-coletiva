import multer from "multer";
import { Request } from "express";
import { AppError } from "./errorHandler";

// File filter - only images
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(400, "Apenas imagens (JPEG, PNG, WebP) são permitidas") as any);
  }
};

// Multer configuration - use memory storage for S3
export const uploadCampaignImage = multer({
  storage: multer.memoryStorage(), // Store in memory for S3 upload
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
}).single("image");






