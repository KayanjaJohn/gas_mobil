import { Router } from 'express';
import { requireAdmin, requireAgent } from '../middleware/requireRole';
import * as adminController from '../controllers/adminController';
import * as stationController from '../controllers/stationController';

const router = Router();

router.get('/dashboard', requireAdmin, adminController.getDashboardStats);
router.get('/orders', requireAdmin, adminController.getAllOrders);
router.get('/drivers', requireAdmin, adminController.getAllDrivers);
router.post('/orders/:id/assign', requireAgent, adminController.assignDriverToOrder);

// Station routes
router.get('/stations', requireAdmin, adminController.getAllStations);
router.post('/stations', requireAdmin, adminController.createStation);
router.put('/stations/:id', requireAdmin, adminController.updateStation);
router.delete('/stations/:id', requireAdmin, adminController.deleteStation);

router.put('/users/:id/assign-station', requireAdmin, adminController.assignUserToStation);

export default router;