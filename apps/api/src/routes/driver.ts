import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import {
  getDriverOrders,
  acceptOrder,
  updateDriverStatus,
  getDriverProfile,
  updateDeliveryStatus,
  getDriverStats,
  getDriverEarnings,
} from '../controllers/driverController';

const router = express.Router();

// All routes require driver role
router.get('/orders', authMiddleware, requireRole('driver'), getDriverOrders);
router.post('/orders/:orderId/accept', authMiddleware, requireRole('driver'), acceptOrder);
router.put('/status', authMiddleware, requireRole('driver'), updateDriverStatus);
router.get('/profile', authMiddleware, requireRole('driver'), getDriverProfile);

// NEW: Driver can update their delivery status
router.put('/delivery/:id/status', authMiddleware, requireRole('driver'), updateDeliveryStatus);

// NEW: Driver stats for HomeScreen
router.get('/stats', authMiddleware, requireRole('driver'), getDriverStats);

// NEW: Driver earnings for EarningsScreen
router.get('/earnings', authMiddleware, requireRole('driver'), getDriverEarnings);

export default router;
