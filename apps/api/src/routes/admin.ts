import { Router } from 'express';
import { requireAdmin, requireAgent } from '../middleware/requireRole';
import * as adminController from '../controllers/adminController';
import * as stationController from '../controllers/stationController';

const router = Router();

router.get('/dashboard', requireAdmin, adminController.getDashboardStats);
router.get('/orders', requireAdmin, adminController.getAllOrders);
router.get('/drivers', requireAdmin, adminController.getAllDrivers);
router.post('/drivers', requireAdmin, adminController.createDriver);  // ADD THIS
router.post('/orders/:id/assign', requireAgent, adminController.assignDriverToOrder);
router.post('/stations', requireAdmin, adminController.createStation);
router.put('/stations/:id', requireAdmin, stationController.updateStation);
router.put('/users/:id/assign-station', requireAdmin, adminController.assignUserToStation);

export default router;