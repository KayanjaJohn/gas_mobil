import { Router } from 'express';
import { requireDriver } from '../middleware/requireRole';
import {
  getDriverOrders,
  acceptOrder,
  updateDriverStatus,
  getDriverProfile,
  updateDeliveryStatus,
  getDriverStats,
  getDriverEarnings,
} from '../controllers/driverController';

const router = Router();

router.get('/orders', requireDriver, getDriverOrders);
router.post('/orders/:orderId/accept', requireDriver, acceptOrder);
router.put('/status', requireDriver, updateDriverStatus);
router.get('/profile', requireDriver, getDriverProfile);

// NEW: Driver can update their delivery status
router.put('/delivery/:id/status', requireDriver, updateDeliveryStatus);

// NEW: Driver stats for HomeScreen
router.get('/stats', requireDriver, getDriverStats);

// NEW: Driver earnings for EarningsScreen
router.get('/earnings', requireDriver, getDriverEarnings);

export default router;
