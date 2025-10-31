import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import campaignRoutes from './routes/campaigns';
import productRoutes from './routes/products';
import orderRoutes from './routes/orders';
import analyticsRoutes from './routes/analytics';
import { errorHandler } from './middleware/errorHandler';
import { startCampaignScheduler } from './services/campaignScheduler';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Parse CORS origins - accepts comma-separated list or single origin
// Automatically adds both HTTP and HTTPS versions if protocol is not specified
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').flatMap(origin => {
      const trimmed = origin.trim();
      // If protocol is already specified, use as-is
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return [trimmed];
      }
      // Otherwise, add both HTTP and HTTPS versions
      return [`http://${trimmed}`, `https://${trimmed}`];
    })
  : ['http://localhost:5173'];

// Middleware
app.use(cors({
  origin: corsOrigins,
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/campaigns', campaignRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/analytics', analyticsRoutes);

// Error handling
app.use(errorHandler);

// Prisma lifecycle
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 CORS enabled for: ${corsOrigins.join(', ')}`);

  // Start campaign scheduler to auto-close expired campaigns
  startCampaignScheduler();
});

export { prisma };
