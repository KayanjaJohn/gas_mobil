import { Router } from 'express';
import { requireAgent } from '../middleware/requireRole';
import AppDataSource from '../config/database';
import { Order } from '../entities/Order';
import { User } from '../entities/User';
import { Product } from '../entities/Product';

const router = Router();
const orderRepository = AppDataSource.getRepository(Order);
const userRepository = AppDataSource.getRepository(User);
const productRepository = AppDataSource.getRepository(Product);

router.get('/orders', requireAgent, async (req, res) => {
  try {
    const { user } = req as any;
    const orders = await orderRepository.find({
      where: { stationId: user.stationId },
      relations: ['items', 'items.product', 'user', 'station', 'deliveries'],  // REMOVED 'deliveries.driver'
      order: { createdAt: 'DESC' }
    });
    res.json({ success: true, data: orders });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

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

// POST /api/agent/drivers - Agent creates driver for their station
router.post('/drivers', requireAgent, async (req, res) => {
  try {
    const { user } = req as any;
    const { name, email, phone, password, vehicleNumber, vehicleType } = req.body;

    // Check for existing user
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