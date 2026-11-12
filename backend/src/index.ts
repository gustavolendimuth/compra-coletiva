import express from "express";
import { createServer } from "http";
import cookieParser from "cookie-parser";
import passport from "passport";
import { PrismaClient } from "@prisma/client";
import { configurePassport } from "./config/passport";
import { configureTrustProxy } from "./config/trustProxy";
import { configureHttpSecurity, parseCorsOrigins } from "./config/httpSecurity";
import authRoutes from "./routes/auth";
import profileRoutes from "./routes/profile";
import adminRoutes from "./routes/admin";
import campaignRoutes from "./routes/campaigns";
import productRoutes from "./routes/products";
import orderRoutes from "./routes/orders";
import analyticsRoutes from "./routes/analytics";
import messageRoutes from "./routes/messages";
import campaignMessageRoutes from "./routes/campaignMessages";
import validationRoutes from "./routes/validation";
import feedbackRoutes from "./routes/feedback";
import notificationRoutes from "./routes/notifications";
import emailPreferenceRoutes from "./routes/emailPreferences";
import geocodingRoutes from "./routes/geocoding";
import { errorHandler } from "./middleware/errorHandler";
import { startCampaignScheduler } from "./services/campaignScheduler";
import { startLegalDataRetentionScheduler } from "./services/legalDataRetentionService";
import { initializeSocket } from "./services/socketService";
import { ImageUploadService } from "./services/imageUploadService";
import { mountUploadsStatic } from "./utils/uploadsStatic";
import { startEmailWorker, stopEmailWorker } from "./services/email/emailWorker";
import { closeEmailQueue } from "./services/email/emailQueue";
import { closeRateLimitRedisClient } from "./middleware/rateLimitStore";
import { assertProductionSecrets } from "./config/secrets";

// Antes de tudo: em produção, segredo ausente/fraco/padrão encerra com exit 1
assertProductionSecrets();

const app = express();
const httpServer = createServer(app);
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Configure Passport
configurePassport();

// Confia só no proxy do Railway: req.ip = IP real do cliente
configureTrustProxy(app);

// CORS_ORIGIN aceita lista separada por vírgula; protocolo adicionado conforme ambiente
const corsOrigins = parseCorsOrigins();

// Middleware: headers de segurança (helmet) + CORS com credentials
configureHttpSecurity(app, corsOrigins);
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

// Serve static files (for local image storage fallback)
// Uses UPLOAD_DIR env var if set (Railway volume), otherwise defaults to ./uploads
const uploadBaseDir = ImageUploadService.getUploadBaseDir();
mountUploadsStatic(app, uploadBaseDir);
console.log(`📁 Serving uploads from: ${uploadBaseDir}`);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/campaign-messages", campaignMessageRoutes);
app.use("/api/validation", validationRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/email-preferences", emailPreferenceRoutes);
app.use("/api/geocoding", geocodingRoutes);

// Error handling
app.use(errorHandler);

// Graceful shutdown
process.on("beforeExit", async () => {
  console.log('Shutting down gracefully...');
  await stopEmailWorker();
  await closeEmailQueue();
  await closeRateLimitRedisClient();
  await prisma.$disconnect();
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await stopEmailWorker();
  await closeEmailQueue();
  await closeRateLimitRedisClient();
  await prisma.$disconnect();
  process.exit(0);
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

    if (!hasS3 && !process.env.PRIVATE_UPLOAD_DIR) {
      console.warn('⚠️  WARNING: PRIVATE_UPLOAD_DIR not set: payment proofs are stored in ./private-uploads');
      console.warn('⚠️  Point PRIVATE_UPLOAD_DIR to a persistent volume outside UPLOAD_DIR.');
    }

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

  // Start legal/security retention scheduler for minimization and cleanup
  startLegalDataRetentionScheduler();

  // Start email worker (modular - pode ser separado depois)
  const enableWorker = process.env.ENABLE_EMAIL_WORKER !== 'false';
  if (enableWorker) {
    try {
      startEmailWorker();
      console.log('📧 Email worker started successfully');
    } catch (error) {
      console.error('❌ Failed to start email worker:', error);
      console.error('   Emails will not be sent. Check email configuration.');
    }
  } else {
    console.log('📧 Email worker disabled (ENABLE_EMAIL_WORKER=false)');
  }
});

export { prisma };
