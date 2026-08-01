import { Router } from 'express';
import { requireAdmin, requireAgent } from '../middleware/requireRole';
import * as adminController from '../controllers/adminController';

const router = Router();

router.get('/dashboard', requireAdmin, adminController.getDashboardStats);
router.get('/orders', requireAdmin, adminController.getAllOrders);
router.get('/customers', requireAdmin, adminController.getAllCustomers);
router.get('/drivers', requireAdmin, adminController.getAllDrivers);
router.post('/drivers', requireAdmin, adminController.createDriver);
router.post('/orders/:id/assign', requireAgent, adminController.assignDriverToOrder);
router.post('/orders/:id/cancel', requireAdmin, adminController.cancelOrder);

// Station routes
router.get('/stations', requireAdmin, adminController.getAllStations);
router.post('/stations', requireAdmin, adminController.createStation);
router.put('/stations/:id', requireAdmin, adminController.updateStation);
router.delete('/stations/:id', requireAdmin, adminController.deleteStation);
router.post('/stations/:id/agents', requireAdmin, adminController.addAgentToStation);

// Agent routes
router.put('/agents/:id', requireAdmin, adminController.updateAgent);

router.put('/users/:id/assign-station', requireAdmin, adminController.assignUserToStation);

export default router;