import express from 'express';
import {
  getDashboardStats,
  getPendingAssignments,
  assignDriver,
  getDrivers,
  getAllOrders,
} from '../controllers/adminController';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = express.Router();

router.get('/dashboard', authMiddleware, requireRole('admin', 'agent'), getDashboardStats);
router.get('/orders/pending', authMiddleware, requireRole('admin', 'agent'), getPendingAssignments);
router.get('/orders', authMiddleware, requireRole('admin', 'agent'), getAllOrders);
router.post('/orders/:orderId/assign', authMiddleware, requireRole('admin', 'agent'), assignDriver);
router.get('/drivers', authMiddleware, requireRole('admin', 'agent'), getDrivers);

export default router;