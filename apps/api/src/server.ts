//import { env } from './config/env';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { createServer } from 'http';
import path from 'path';  // ← FIX: Added missing import
import AppDataSource from './config/database';
import { initializeSocket } from './config/socket';
import authRoutes from './routes/auth';
import orderRoutes from './routes/orders';
import productRoutes from './routes/products';
import stationRoutes from './routes/stations';
import driverRoutes from './routes/drivers';
import adminRoutes from './routes/admin';
import agentRoutes from './routes/agent';
import deliveryRoutes from './routes/delivery';
import paymentRoutes from './routes/payments';
import walletRoutes from './routes/wallet';
import catalogRoutes from "./routes/catalog";
import uploadRoutes from "./routes/upload";
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// ── Socket.IO setup (unified via config/socket.ts) ──────────
initializeSocket(httpServer);

const PORT = process.env.PORT || 5000;

// ── Security ─────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://gasmobil.ug', 'https://app.gasmobil.ug']
    : true,
  credentials: true,
}));

// ── Rate Limiting ──────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, error: 'Too many attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { success: false, error: 'Too many requests. Please slow down.' },
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api', apiLimiter);

// ── Body Parsing ───────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Health Check ───────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ── API Routes ─────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/orders',  authMiddleware, orderRoutes);
app.use('/api/products', authMiddleware,  productRoutes);
app.use('/api/stations', authMiddleware,  stationRoutes);
app.use('/api/driver',  authMiddleware, driverRoutes);
app.use('/api/admin', authMiddleware,  adminRoutes);
app.use('/api/agent',  authMiddleware, agentRoutes);
app.use('/api/delivery', authMiddleware, deliveryRoutes);
app.use('/api/payments', authMiddleware, paymentRoutes);
app.use('/api/wallet', authMiddleware, walletRoutes);
app.use("/api/catalog", authMiddleware, catalogRoutes);
app.use("/api/upload", authMiddleware, uploadRoutes);

// ── Error Handling ─────────────────────────────────────────
app.use(errorHandler);

// ── 404 Handler ────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// ── Start Server ───────────────────────────────────────────
const startServer = async () => {
  try {
    const required = ['JWT_SECRET', 'REFRESH_SECRET'];
    const missing = required.filter((key) => !process.env[key]);
    if (missing.length > 0) {
      console.error(`❌ Missing required env vars: ${missing.join(', ')}`);
      console.error('Generate secrets with: node scripts/generate-secrets.js');
      process.exit(1);
    }

    await AppDataSource.initialize();
    console.log('✅ Database connected');

    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📚 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();