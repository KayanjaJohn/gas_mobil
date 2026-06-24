import express from 'express';
import {
  initiateMobilePayment,
  checkPaymentStatus,
  momoCallback,
  airtelCallback,
  markCashOnDelivery,
} from '../controllers/paymentController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Customer initiates payment
router.post('/mobile/initiate', authMiddleware, initiateMobilePayment);

// Customer checks payment status (polling)
router.get('/mobile/status', authMiddleware, checkPaymentStatus);

// Cash on delivery
router.post('/cash-on-delivery', authMiddleware, markCashOnDelivery);

// Webhooks (no auth - called by payment providers)
router.post('/webhook/momo', momoCallback);
router.post('/webhook/airtel', airtelCallback);

export default router;