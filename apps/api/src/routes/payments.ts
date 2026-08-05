import express from 'express';
import {
  initiateMobilePayment,
  checkPaymentStatus,
  payWithWallet,
  initiateCardPayment,
  stripeWebhook,
  momoCallback,
  airtelCallback,
  markCashOnDelivery,
} from '../controllers/paymentController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Mobile Money
router.post('/mobile/initiate', authMiddleware, initiateMobilePayment);
router.get('/mobile/status', authMiddleware, checkPaymentStatus);

// Wallet
router.post('/wallet/pay', authMiddleware, payWithWallet);

// Card (Stripe)
router.post('/card/initiate', authMiddleware, initiateCardPayment);

// Cash on Delivery
router.post('/cash-on-delivery', authMiddleware, markCashOnDelivery);

// Webhooks (no auth - called by payment providers)
router.post('/webhook/momo', momoCallback);
router.post('/webhook/airtel', airtelCallback);
router.post('/webhook/stripe', express.raw({ type: 'application/json' }), stripeWebhook);

export default router;