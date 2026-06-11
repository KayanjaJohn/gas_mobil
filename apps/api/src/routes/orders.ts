import express from 'express';
import { createOrder, getOrders, getOrderById, cancelOrder } from '../controllers/orderController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

router.get('/', authMiddleware, getOrders);
router.get('/:id', authMiddleware, getOrderById);
router.post('/', authMiddleware, createOrder);
router.patch('/:id/cancel', authMiddleware, cancelOrder);

export default router;