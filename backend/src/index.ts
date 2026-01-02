import express from "express";
import { createServer } from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "passport";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { configurePassport } from "./config/passport";
import authRoutes from "./routes/auth";
import campaignRoutes from "./routes/campaigns";
import productRoutes from "./routes/products";
import orderRoutes from "./routes/orders";
import analyticsRoutes from "./routes/analytics";
import messageRoutes from "./routes/messages";
import campaignMessageRoutes from "./routes/campaignMessages";
import validationRoutes from "./routes/validation";
import feedbackRoutes from "./routes/feedback";
import notificationRoutes from "./routes/notifications";
import { errorHandler } from "./middleware/errorHandler";
import { startCampaignScheduler } from "./services/campaignScheduler";
import { initializeSocket } from "./services/socketService";
import { ImageUploadService } from "./services/imageUploadService";

const app = express();
const httpServer = createServer(app);
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Configure Passport
configurePassport();

// Parse CORS origins - accepts comma-separated list or single origin
// Automatically adds correct protocol based on environment and domain
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((origin) => {
      const trimmed = origin.trim();

      // If protocol is already specified, use as-is
      if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        return trimmed;
      }

      // Determine if domain is local
      const isLocal =
        trimmed.includes("localhost") ||
        trimmed.includes("127.0.0.1") ||
        trimmed.includes("0.0.0.0");

      // Local domains always use http, remote domains use https in production
      if (isLocal) {
        return `http://${trimmed}`;
      }

      // Remote domains: use https in production, http in development
      const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
      return `${protocol}://${trimmed}`;
    })
  : ["http://localhost:5173"];

// Middleware
app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

// Serve static files (for local image storage fallback)
// Uses UPLOAD_DIR env var if set (Railway volume), otherwise defaults to ./uploads
const uploadBaseDir = ImageUploadService.getUploadBaseDir();
app.use("/uploads", express.static(uploadBaseDir));
console.log(`📁 Serving uploads from: ${uploadBaseDir}`);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/campaign-messages", campaignMessageRoutes);
app.use("/api/validation", validationRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/notifications", notificationRoutes);

// Error handling
app.use(errorHandler);

// Prisma lifecycle
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

// Initialize Socket.IO
initializeSocket(httpServer);

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 CORS enabled for: ${corsOrigins.join(", ")}`);
  console.log(`🔌 WebSocket ready for real-time updates`);

  // Check storage configuration in production
  if (process.env.NODE_ENV === 'production') {
    const hasS3 = !!(
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      process.env.AWS_S3_BUCKET
    );
    const hasVolume = !!process.env.UPLOAD_DIR;

    if (hasS3) {
      console.log('✅ S3 storage configured and ready');
    } else if (hasVolume) {
      console.log(`✅ Persistent volume configured: ${process.env.UPLOAD_DIR}`);
      console.log('💡 Tip: Consider S3 for better scalability and CDN benefits');
    } else {
      console.warn('⚠️  WARNING: No persistent storage configured!');
      console.warn('⚠️  Images will be saved locally and LOST on each deploy.');
      console.warn('⚠️  Options:');
      console.warn('⚠️    1. Configure S3 (recommended) - see RAILWAY_IMAGE_STORAGE_FIX.md');
      console.warn('⚠️    2. Configure Railway Volume - see RAILWAY_VOLUME_SETUP.md');
    }
  }

  // Start campaign scheduler to auto-close expired campaigns
  startCampaignScheduler();
});

export { prisma };
