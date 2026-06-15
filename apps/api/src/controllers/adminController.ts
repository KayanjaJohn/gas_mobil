import { Request, Response } from 'express';
import AppDataSource from '../config/database';
import { User } from '../entities/User';
import { Order } from '../entities/Order';
import { Product } from '../entities/Product';
import { Station } from '../entities/Station';
import { Delivery } from '../entities/Delivery';

const userRepository = AppDataSource.getRepository(User);
const orderRepository = AppDataSource.getRepository(Order);
const productRepository = AppDataSource.getRepository(Product);
const stationRepository = AppDataSource.getRepository(Station);
const deliveryRepository = AppDataSource.getRepository(Delivery);

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).userRole;
    const stationId = (req as any).userStationId;

    if (!['admin', 'agent'].includes(userRole)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const where: any = {};
    if (userRole === 'agent' && stationId) {
      where.stationId = stationId;
    }

    const [
      totalOrders,
      pendingOrders,
      completedOrders,
      totalProducts,
      totalDrivers,
      totalCustomers,
    ] = await Promise.all([
      orderRepository.count({ where }),
      orderRepository.count({ where: { ...where, status: 'pending' } }),
      orderRepository.count({ where: { ...where, status: 'completed' } }),
      productRepository.count({ where: userRole === 'agent' ? { stationId } : {} }),
      userRepository.count({ where: { role: 'driver', ...(stationId ? { stationId } : {}) } }),
      userRepository.count({ where: { role: 'customer' } }),
    ]);

    // Revenue calculation
    const revenueResult = await orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.totalAmount)', 'total')
      .where('order.paymentStatus = :status', { status: 'completed' })
      .andWhere(userRole === 'agent' ? 'order.stationId = :stationId' : '1=1', { stationId })
      .getRawOne();

    res.json({
      success: true,
      data: {
        totalOrders,
        pendingOrders,
        completedOrders,
        totalProducts,
        totalDrivers,
        totalCustomers,
        totalRevenue: revenueResult?.total || 0,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getPendingAssignments = async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).userRole;
    const stationId = (req as any).userStationId;

    if (!['admin', 'agent'].includes(userRole)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const where: any = { status: 'pending_assignment' };
    if (stationId) where.stationId = stationId;

    const orders = await orderRepository.find({
      where,
      relations: ['items', 'items.product', 'user'],
      order: { createdAt: 'ASC' },
    });

    res.json({ success: true, data: orders });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const assignDriver = async (req: Request, res: Response) => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const { orderId } = req.params;
    const { driverId } = req.body;
    const userRole = (req as any).userRole;
    const stationId = (req as any).userStationId;

    if (!['admin', 'agent'].includes(userRole)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const order = await queryRunner.manager.findOne(Order, {
      where: { id: orderId },
      relations: ['items', 'items.product'],
    });

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (stationId && order.stationId !== stationId) {
      return res.status(403).json({ success: false, error: 'Order not in your station' });
    }

    const driver = await queryRunner.manager.findOne(User, {
      where: { id: driverId, role: 'driver', isActive: true },
    });

    if (!driver) {
      return res.status(404).json({ success: false, error: 'Driver not found' });
    }

    if (stationId && driver.stationId !== stationId) {
      return res.status(400).json({ success: false, error: 'Driver not in your station' });
    }

    if (driver.driverStatus !== 'online') {
      return res.status(400).json({ success: false, error: 'Driver is not available' });
    }

    order.status = 'driver_assigned';
    order.driverId = driver.id;
    await queryRunner.manager.save(order);

    driver.driverStatus = 'busy';
    driver.lastAssignedAt = new Date();
    await queryRunner.manager.save(driver);

    const deliveryData: any = {
      orderId: order.id,
      driverId: driver.id,
      driverName: driver.name,
      driverPhone: driver.phone,
      vehicleNumber: driver.vehicleNumber,
      estimatedArrival: new Date(Date.now() + 30 * 60 * 1000),
      status: 'assigned',
      route: [],
    };

    if (driver.currentLatitude && driver.currentLongitude) {
      deliveryData.currentLocation = {
        latitude: Number(driver.currentLatitude),
        longitude: Number(driver.currentLongitude),
      };
    }

    const delivery = queryRunner.manager.create(Delivery, deliveryData);
    await queryRunner.manager.save(delivery);

    await queryRunner.commitTransaction();

    res.json({
      success: true,
      data: { order, delivery },
      message: `Driver ${driver.name} assigned successfully`,
    });
  } catch (error: any) {
    await queryRunner.rollbackTransaction();
    res.status(500).json({ success: false, error: error.message });
  } finally {
    await queryRunner.release();
  }
};

export const getDrivers = async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).userRole;
    const stationId = (req as any).userStationId;

    if (!['admin', 'agent'].includes(userRole)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const where: any = { role: 'driver', isActive: true };
    if (stationId) where.stationId = stationId;

    const drivers = await userRepository.find({
      where,
      select: ['id', 'name', 'email', 'phone', 'driverStatus', 'currentLatitude', 'currentLongitude', 'lastLocationUpdate', 'vehicleNumber', 'vehicleType'],
    });

    res.json({ success: true, data: drivers });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).userRole;
    const stationId = (req as any).userStationId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    if (!['admin', 'agent'].includes(userRole)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const where: any = {};
    if (stationId) where.stationId = stationId;

    const [orders, total] = await orderRepository.findAndCount({
      where,
      relations: ['items', 'items.product', 'user', 'driver', 'station', 'deliveries'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    res.json({
      success: true,
      data: orders,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};