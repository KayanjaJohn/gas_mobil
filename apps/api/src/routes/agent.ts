import { Router } from 'express';
import { requireAgent } from '../middleware/requireRole';
import AppDataSource from '../config/database';
import { Order } from '../entities/Order';
import { User } from '../entities/User';
import { Product } from '../entities/Product';
import { Delivery } from '../entities/Delivery';

const router = Router();
const orderRepository = AppDataSource.getRepository(Order);
const userRepository = AppDataSource.getRepository(User);
const productRepository = AppDataSource.getRepository(Product);
const deliveryRepository = AppDataSource.getRepository(Delivery);

// GET /api/agent/orders — Orders for agent's station
router.get('/orders', requireAgent, async (req, res) => {
  try {
    const { user } = req as any;
    const orders = await orderRepository.find({
      where: { stationId: user.stationId },
      relations: ['items', 'items.product', 'user', 'station', 'deliveries'],
      order: { createdAt: 'DESC' }
    });
    res.json({ success: true, data: orders });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/agent/orders/:id/assign — Agent assigns driver to order
router.post('/orders/:id/assign', requireAgent, async (req, res) => {
  try {
    const { id } = req.params;
    const { driverId } = req.body;
    const { user } = req as any;

    const order = await orderRepository.findOne({
      where: { id },
      relations: ['station']
    });
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Agent can only assign orders from their own station
    if (order.stationId !== user.stationId) {
      return res.status(403).json({ success: false, error: 'Not your station order' });
    }

    const driver = await userRepository.findOne({
      where: { id: driverId, role: 'driver', stationId: user.stationId }
    });
    if (!driver) {
      return res.status(400).json({ success: false, error: 'Driver not found at this station' });
    }

    if (driver.driverStatus !== 'online') {
      return res.status(400).json({ success: false, error: 'Driver is not online' });
    }

    const delivery = new Delivery();
    delivery.orderId = order.id;
    delivery.driverId = driver.id;
    delivery.driverName = driver.name;
    delivery.driverPhone = driver.phone;
    delivery.vehicleNumber = driver.vehicleNumber;
    delivery.status = 'pending';

    await deliveryRepository.save(delivery);

    order.status = 'driver_assigned';
    await orderRepository.save(order);

    const io = (req as any).io || req.app.get('io');
    if (io) {
      io.to(`driver_${driver.id}`).emit('new_order_assigned', { orderId: order.id });
    }

    res.json({ success: true, data: order });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/agent/orders/:id/cancel — Agent cancels order for their station
router.post('/orders/:id/cancel', requireAgent, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const { user } = req as any;

    const order = await orderRepository.findOne({
      where: { id },
      relations: ['items', 'items.product']
    });
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (order.stationId !== user.stationId) {
      return res.status(403).json({ success: false, error: 'Not your station order' });
    }

    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ success: false, error: 'Order cannot be cancelled at this stage' });
    }

    order.status = 'cancelled';
    order.cancellationReason = reason || 'Cancelled by agent';
    await orderRepository.save(order);

    // Restore stock
    for (const item of order.items) {
      const product = await productRepository.findOne({ where: { id: item.productId } });
      if (product) {
        product.stock += item.quantity;
        await productRepository.save(product);
      }
    }

    res.json({ success: true, data: order });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/agent/drivers — Drivers at agent's station
router.get('/customers', requireAgent, async (req, res) => {
  try {
    const { user } = req as any;
    const customers = await userRepository.find({
      where: { role: 'customer', stationId: user.stationId },
      select: ['id', 'name', 'email', 'phone',  'currentLatitude', 'currentLongitude', 'lastLocationUpdate', 'stationId']
    });
    res.json({ success: true, data: customers });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});


// GET /api/agent/drivers — Drivers at agent's station
router.get('/drivers', requireAgent, async (req, res) => {
  try {
    const { user } = req as any;
    const drivers = await userRepository.find({
      where: { role: 'driver', stationId: user.stationId },
      select: ['id', 'name', 'email', 'phone', 'driverStatus', 'currentLatitude', 'currentLongitude', 'lastLocationUpdate', 'vehicleNumber', 'vehicleType', 'stationId']
    });
    res.json({ success: true, data: drivers });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/agent/products — Products at agent's station
router.get('/products', requireAgent, async (req, res) => {
  try {
    const { user } = req as any;
    const products = await productRepository.find({
      where: { stationId: user.stationId }
    });
    res.json({ success: true, data: products });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/agent/dashboard — Dashboard stats for agent's station
router.get('/dashboard', requireAgent, async (req, res) => {
  try {
    const { user } = req as any;
    const totalOrders = await orderRepository.count({ where: { stationId: user.stationId } });
    const pendingOrders = await orderRepository.count({ where: { stationId: user.stationId, status: 'pending' } });
    const totalDrivers = await userRepository.count({ where: { role: 'driver', stationId: user.stationId } });
    const totalProducts = await productRepository.count({ where: { stationId: user.stationId } });

    res.json({
      success: true,
      data: { totalOrders, pendingOrders, totalDrivers, totalProducts }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/agent/drivers — Agent creates driver for their station
router.post('/drivers', requireAgent, async (req, res) => {
  try {
    const { user } = req as any;
    const { name, email, phone, password, vehicleNumber, vehicleType } = req.body;

    const existingUser = await userRepository.findOne({
      where: [{ email }, { phone }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email or phone already exists'
      });
    }

    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(password || 'Driver@123', 12);

    const driver = userRepository.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role: 'driver',
      stationId: user.stationId,
      vehicleNumber,
      vehicleType,
      driverStatus: 'offline',
      isActive: true
    });

    await userRepository.save(driver);

    res.status(201).json({
      success: true,
      data: {
        id: driver.id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        role: driver.role,
        stationId: driver.stationId,
        vehicleNumber: driver.vehicleNumber,
        vehicleType: driver.vehicleType
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
