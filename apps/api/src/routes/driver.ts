import express from 'express';
import {
  getDriverOrders,
  acceptOrder,
  updateDriverStatus,
  getDriverProfile,
} from '../controllers/driverController';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = express.Router();

router.get('/orders', authMiddleware, requireRole('driver'), getDriverOrders);
router.post('/orders/:orderId/accept', authMiddleware, requireRole('driver'), acceptOrder);
router.put('/status', authMiddleware, requireRole('driver'), updateDriverStatus);
router.get('/profile', authMiddleware, requireRole('driver'), getDriverProfile);

export default router;