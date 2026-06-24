import { Router } from 'express';
import { requireDriver } from '../middleware/requireRole';
import * as driverController from '../controllers/driverController';

const router = Router();

router.get('/orders', requireDriver, driverController.getDriverOrders);
router.post('/orders/:id/accept', requireDriver, driverController.acceptOrder);
router.put('/status', requireDriver, driverController.updateDriverStatus);
router.get('/profile', requireDriver, driverController.getDriverProfile);

export default router;
