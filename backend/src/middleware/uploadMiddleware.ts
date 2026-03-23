import multer from "multer";
import { Request, Response, NextFunction } from "express";
import { AppError } from "./errorHandler";

// File filter - only images
const imageFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(400, "Apenas imagens (JPEG, PNG, WebP) são permitidas"));
  }
};

// File filter - images and PDF
const imageOrPdfFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(400, "Apenas imagens (JPEG, PNG, WebP) ou PDF são permitidos"));
  }
};

// Base multer configuration
export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});

// Payment proof multer configuration (accepts images and PDF)
const uploadPaymentProofMiddleware = multer({
  storage: multer.memoryStorage(),
  fileFilter: imageOrPdfFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});

// Multer configuration - use memory storage for S3
export const uploadCampaignImage = uploadMiddleware.single("image");
export const uploadProductImage = uploadMiddleware.single("image");

// Avatar upload configuration
export const uploadAvatar = uploadMiddleware.single("avatar");

// Payment proof upload configuration (allows images and PDF)
export const uploadPaymentProof = uploadPaymentProofMiddleware.single("paymentProof");

// Error handler for multer errors
export const handleUploadError = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({
        error: "FILE_TOO_LARGE",
        message: "Arquivo muito grande. Tamanho máximo: 5MB",
      });
      return;
    }
    res.status(400).json({
      error: "UPLOAD_ERROR",
      message: err.message,
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: "UPLOAD_ERROR",
      message: err.message,
    });
    return;
  }

  next(err);
};




