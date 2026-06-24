import { Request, Response } from 'express';
import bcryptjs from 'bcryptjs';
import AppDataSource from '../config/database';  //
import { Order } from '../entities/Order';
import { User } from '../entities/User';
import { Product } from '../entities/Product';
import { Delivery } from '../entities/Delivery';
import { Station } from '../entities/Station';

const orderRepository = AppDataSource.getRepository(Order);
const userRepository = AppDataSource.getRepository(User);
const productRepository = AppDataSource.getRepository(Product);
const stationRepository = AppDataSource.getRepository(Station);

// GET /api/admin/dashboard - System-wide stats
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const { user } = req as any;

    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access only' });
    }

    const totalOrders = await orderRepository.count();
    const pendingOrders = await orderRepository.count({ where: { status: 'pending' } });
    const totalDrivers = await userRepository.count({ where: { role: 'driver' } });
    const totalProducts = await productRepository.count();
    const totalStations = await stationRepository.count();

    // Today's revenue
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = await orderRepository.createQueryBuilder('order')
      .where('order.createdAt >= :today', { today })
      .andWhere('order.paymentStatus = :status', { status: 'paid' })
      .getMany();
    const todayRevenue = todayOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);

    res.json({
      success: true,
      data: {
        totalOrders,
        pendingOrders,
        totalDrivers,
        totalProducts,
        totalStations,
        todayRevenue
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/admin/orders - All orders (admin only)
export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const { user } = req as any;

    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access only' });
    }

    const orders = await orderRepository.find({
      relations: ['items', 'items.product', 'user', 'station', 'deliveries', 'deliveries.driver'],
      order: { createdAt: 'DESC' }
    });

    res.json({ success: true, data: orders });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/admin/drivers - All drivers (admin only)
export const getAllDrivers = async (req: Request, res: Response) => {
  try {
    const { user } = req as any;

    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access only' });
    }

    const drivers = await userRepository.find({
      where: { role: 'driver' },
      relations: ['station'],
      select: ['id', 'name', 'email', 'phone', 'driverStatus', 'currentLatitude', 'currentLongitude', 'lastLocationUpdate', 'vehicleNumber', 'vehicleType', 'stationId']
    });

    res.json({ success: true, data: drivers });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /api/admin/drivers - Admin creates a driver
export const createDriver = async (req: Request, res: Response) => {
  try {
    const { user } = req as any;

    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access only' });
    }

    const { name, email, phone, password, stationId, vehicleNumber, vehicleType } = req.body;

    const existingUser = await userRepository.findOne({
      where: [{ email }, { phone }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email or phone already exists'
      });
    }

    const hashedPassword = await bcryptjs.hash(password || 'Driver@123', 12);

    const driver = userRepository.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role: 'driver',
      stationId,
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
};


// POST /api/admin/orders/:id/assign - Admin assigns driver to order
export const assignDriverToOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { driverId } = req.body;
    const { user } = req as any;

    if (user.role !== 'admin' && user.role !== 'agent') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const order = await orderRepository.findOne({
      where: { id },
      relations: ['station']
    });

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Agent can only assign drivers from their station
    if (user.role === 'agent' && order.stationId !== user.stationId) {
      return res.status(403).json({ success: false, error: 'Not your station order' });
    }

    const driver = await userRepository.findOne({ where: { id: driverId, role: 'driver' } });
    if (!driver) {
      return res.status(400).json({ success: false, error: 'Driver not found' });
    }

    if (driver.stationId !== order.stationId) {
      return res.status(400).json({ success: false, error: 'Driver is not from this station' });
    }

    if (driver.driverStatus !== 'online') {
      return res.status(400).json({ success: false, error: 'Driver is not online' });
    }

    // Create delivery record
    const delivery = new Delivery();
    delivery.orderId = order.id;
    delivery.driverId = driver.id;
    delivery.driverName = driver.name;
    delivery.driverPhone = driver.phone;
    delivery.vehicleNumber = driver.vehicleNumber;
    delivery.status = 'driver_assigned';

    await AppDataSource.getRepository(Delivery).save(delivery);

    order.status = 'driver_assigned';
    await orderRepository.save(order);

    // Notify driver via Socket.IO
    const io = (req as any).io;
    if (io) {
      io.to(`driver_${driver.id}`).emit('new_order_assigned', { orderId: order.id });
    }

    res.json({ success: true, data: order });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /api/admin/stations - Create new station
export const createStation = async (req: Request, res: Response) => {
  try {
    const { user } = req as any;

    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access only' });
    }

    const { name, address, latitude, longitude, phone, email } = req.body;

    const station = stationRepository.create({
      name,
      address,
      latitude,
      longitude,
      phone,
      email,
      isActive: true
    });

    await stationRepository.save(station);
    res.status(201).json({ success: true, data: station });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// PUT /api/admin/users/:id/assign-station - Assign user to station
export const assignUserToStation = async (req: Request, res: Response) => {
  try {
    const { user } = req as any;

    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access only' });
    }

    const { id } = req.params;
    const { stationId } = req.body;

    const targetUser = await userRepository.findOne({ where: { id } });
    if (!targetUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    targetUser.stationId = stationId;
    await userRepository.save(targetUser);

    res.json({ success: true, data: targetUser });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};