import express from 'express';
import {
  getDeliveryTracking,
  updateDeliveryLocation,
  updateDeliveryStatus,
} from '../controllers/deliveryController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

router.get('/:orderId', authMiddleware, getDeliveryTracking);
router.put('/:id/location', authMiddleware, updateDeliveryLocation);
router.put('/:id/status', authMiddleware, updateDeliveryStatus);

export default router;