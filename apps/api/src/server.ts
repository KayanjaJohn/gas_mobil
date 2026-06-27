import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import AppDataSource from './config/database';
import authRoutes from './routes/auth';
import orderRoutes from './routes/orders';
import productRoutes from './routes/products';
import stationRoutes from './routes/stations';
import driverRoutes from './routes/drivers';
import adminRoutes from './routes/admin';
import agentRoutes from './routes/agent';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ── Security ─────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://gasmobil.ug', 'https://app.gasmobil.ug','http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001']
    : true,
  credentials: true,
}));

// ── Rate Limiting ──────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { success: false, error: 'Too many attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
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

// ── API Routes ─────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/orders',  authMiddleware, orderRoutes);
app.use('/api/products', authMiddleware,  productRoutes);
app.use('/api/stations', authMiddleware,  stationRoutes);
app.use('/api/driver',  authMiddleware, driverRoutes);
app.use('/api/admin', authMiddleware,  adminRoutes);
app.use('/api/agent',  authMiddleware, agentRoutes);

// ── Error Handling ─────────────────────────────────────────
app.use(errorHandler);

// ── 404 Handler ────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// ── Start Server ───────────────────────────────────────────
const startServer = async () => {
  try {
    // NEW: Validate required env vars before starting
    const required = ['JWT_SECRET', 'REFRESH_SECRET'];
    const missing = required.filter((key) => !process.env[key]);
    if (missing.length > 0) {
      console.error(`❌ Missing required env vars: ${missing.join(', ')}`);
      console.error('Generate secrets with: node scripts/generate-secrets.js');
      process.exit(1);
    }

    await AppDataSource.initialize();
    console.log('✅ Database connected');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📚 API docs: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();