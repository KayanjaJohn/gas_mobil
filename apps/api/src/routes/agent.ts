import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requireAgent } from '../middleware/requireRole';
import {
  getAgentOrders,
  getAgentDrivers,
  getAgentProducts,
  getAgentDashboard,
  createAgentDriver,
  assignDriverToOrder,
  cancelOrder,
  getAgentCustomers,
  updateAgentDriverStatus,
  updateAgentDriver,
  previewAgentStationData,
  clearAgentStationData,
} from '../controllers/agentController';

const router = Router();

// All routes require authentication + agent role
router.use(authMiddleware, requireAgent);

router.get('/orders', getAgentOrders);
router.get('/drivers', getAgentDrivers);
router.get('/products', getAgentProducts);
router.get('/dashboard', getAgentDashboard);
router.post('/drivers', createAgentDriver);
router.put('/drivers/:id', updateAgentDriver);
router.put('/drivers/:id/status', updateAgentDriverStatus);
router.post('/orders/:id/assign', assignDriverToOrder);
router.post('/orders/:id/cancel', cancelOrder);
router.get('/customers', getAgentCustomers);
router.get('/station/data-cleanup-preview', previewAgentStationData);
router.post('/station/clear-data', clearAgentStationData);

export default router;