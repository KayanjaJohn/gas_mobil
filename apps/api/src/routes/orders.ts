import { Router } from 'express';
import { requireAuth, requireAgent, requireCustomer } from '../middleware/requireRole';
import * as orderController from '../controllers/orderController';

const router = Router();

router.post('/', requireCustomer, orderController.createOrder);
router.get('/', requireAuth, orderController.getOrders);
router.get('/:id', requireAuth, orderController.getOrderById);
router.post('/:id/cancel', requireAuth, orderController.cancelOrder);
router.put('/:id/status', requireAgent, orderController.updateOrderStatus);

export default router;
