import { Router } from 'express';
import { requireAuth, requireAdmin, requireAgent, requireDriver, requireCustomer } from '../middleware/requireRole';
import * as productController from '../controllers/productController';
import * as orderController from '../controllers/orderController';
import * as driverController from '../controllers/driverController';
import * as adminController from '../controllers/adminController';

const router = Router();

// ========== PRODUCTS ==========
router.get('/products', requireAuth, productController.getProducts);
router.post('/products', requireAgent, productController.createProduct);
router.put('/products/:id', requireAgent, productController.updateProduct);
router.patch('/products/:id/availability', requireAgent, productController.toggleAvailability);
router.delete('/products/:id', requireAdmin, productController.deleteProduct);

// ========== ORDERS ==========
router.post('/orders', requireCustomer, orderController.createOrder);
router.get('/orders', requireAuth, orderController.getOrders);
router.get('/orders/:id', requireAuth, orderController.getOrderById);
router.post('/orders/:id/cancel', requireAuth, orderController.cancelOrder);
router.put('/orders/:id/status', requireAgent, orderController.updateOrderStatus);

// ========== DRIVER ==========
router.get('/driver/orders', requireDriver, driverController.getDriverOrders);
router.post('/driver/orders/:id/accept', requireDriver, driverController.acceptOrder);
router.put('/driver/status', requireDriver, driverController.updateDriverStatus);
router.get('/driver/profile', requireDriver, driverController.getDriverProfile);
router.put('/delivery/:id/status', requireDriver, driverController.updateDeliveryStatus);

// ========== ADMIN ==========
router.get('/admin/dashboard', requireAdmin, adminController.getDashboardStats);
router.get('/admin/orders', requireAdmin, adminController.getAllOrders);
router.get('/admin/drivers', requireAdmin, adminController.getAllDrivers);
router.post('/admin/orders/:id/assign', requireAgent, adminController.assignDriverToOrder);
router.post('/admin/stations', requireAdmin, adminController.createStation);
router.put('/admin/users/:id/assign-station', requireAdmin, adminController.assignUserToStation);

export default router;
