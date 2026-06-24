import express from 'express';
import { createOrder, getOrders, getOrderById, cancelOrder } from '../controllers/orderController';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createOrderSchema, cancelOrderSchema } from '../validators/orderValidator';

const router = express.Router();

router.post('/', authMiddleware, validate(createOrderSchema), createOrder);
router.get('/', authMiddleware, getOrders);
router.get('/:id', authMiddleware, getOrderById);
router.post('/:id/cancel', authMiddleware, validate(cancelOrderSchema), cancelOrder);

export default router;