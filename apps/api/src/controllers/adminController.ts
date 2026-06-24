import { Request, Response } from 'express';
import AppDataSource from '../config/database';
import { Order } from '../entities/Order';
import { User } from '../entities/User';
import { Product } from '../entities/Product';
import { Delivery } from '../entities/Delivery';
import { Station } from '../entities/Station';
import bcryptjs from 'bcryptjs';

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
      relations: ['items', 'items.product', 'user', 'station', 'deliveries'],
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
    delivery.status = 'pending';

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

// POST /api/admin/stations - Create new station + auto-create agent
export const createStation = async (req: Request, res: Response) => {
  try {
    const { user } = req as any;

    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access only' });
    }

    const { name, address, latitude, longitude, phone, email, agentName, agentEmail, agentPhone, agentPassword } = req.body;

    // Create station
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

    // Auto-create agent for this station
    const existingAgent = await userRepository.findOne({ where: { email: agentEmail } });
    if (existingAgent) {
      return res.status(400).json({
        success: false,
        error: 'Agent with this email already exists'
      });
    }

    const hashedPassword = await bcryptjs.hash(agentPassword || 'Agent@123', 12);

    const agent = userRepository.create({
      name: agentName || `${name} Agent`,
      email: agentEmail,
      phone: agentPhone || phone,
      password: hashedPassword,
      role: 'agent',
      stationId: station.id,
      isActive: true
    });

    await userRepository.save(agent);

    res.status(201).json({
      success: true,
      data: {
        station,
        agent: {
          id: agent.id,
          name: agent.name,
          email: agent.email,
          phone: agent.phone,
          role: agent.role
        }
      },
      message: 'Station and agent created successfully'
    });
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

// GET /api/admin/stations - Get all stations with their agents
export const getAllStations = async (req: Request, res: Response) => {
  try {
    const { user } = req as any;

    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access only' });
    }

    const stations = await stationRepository.find({
      relations: ['agents'],
      order: { createdAt: 'DESC' }
    });

    res.json({ success: true, data: stations });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// PUT /api/admin/stations/:id - Update station
export const updateStation = async (req: Request, res: Response) => {
  try {
    const { user } = req as any;

    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access only' });
    }

    const { id } = req.params;
    const { name, address, latitude, longitude, phone, email, isActive } = req.body;

    const station = await stationRepository.findOne({ where: { id } });
    if (!station) {
      return res.status(404).json({ success: false, error: 'Station not found' });
    }

    station.name = name || station.name;
    station.address = address || station.address;
    station.latitude = latitude !== undefined ? latitude : station.latitude;
    station.longitude = longitude !== undefined ? longitude : station.longitude;
    station.phone = phone !== undefined ? phone : station.phone;
    station.email = email !== undefined ? email : station.email;
    station.isActive = isActive !== undefined ? isActive : station.isActive;

    await stationRepository.save(station);

    res.json({ success: true, data: station });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// DELETE /api/admin/stations/:id - Soft delete (deactivate) station
export const deleteStation = async (req: Request, res: Response) => {
  try {
    const { user } = req as any;

    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access only' });
    }

    const { id } = req.params;

    const station = await stationRepository.findOne({ where: { id } });
    if (!station) {
      return res.status(404).json({ success: false, error: 'Station not found' });
    }

    station.isActive = false;
    await stationRepository.save(station);

    // Also deactivate all agents at this station
    await userRepository.update(
      { stationId: id, role: 'agent' },
      { isActive: false }
    );

    res.json({ success: true, message: 'Station and its agents deactivated' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};