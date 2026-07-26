import { Request, Response } from 'express';
import AppDataSource from '../config/database';
import { User } from '../entities/User';
import { Order } from '../entities/Order';
import { Delivery } from '../entities/Delivery';

const userRepo = () => AppDataSource.getRepository(User);
const orderRepo = () => AppDataSource.getRepository(Order);
const deliveryRepo = () => AppDataSource.getRepository(Delivery);

const fetchOrdersWithDeliveries = async (where: any): Promise<any[]> => {
  try {
    return await orderRepo().find({
      where, relations: ['deliveries', 'deliveries.driver', 'customer']
    } as any);
  } catch {
    try {
      return await orderRepo().find({ where, relations: ['deliveries'] } as any);
    } catch {
      return await orderRepo().find({ where } as any);
    }
  }
};

export const getAgentCustomers = async (req: Request, res: Response) => {
  try {
    const agentId = (req as any).userId;
    const agent = await userRepo().findOne({ where: { id: agentId } } as any);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    const stationId = (agent as any).station?.id || (req as any).user?.station?.id;
    if (!stationId) return res.status(400).json({ error: 'Agent has no station' });

    const orders = await orderRepo().find({ where: { stationId } } as any);
    const customerIds = [...new Set(orders.map((o: any) => o.customerId))];
    const customers = await userRepo().findByIds(customerIds);
    res.json({ customers });
  } catch (error) {
    console.error('getAgentCustomers error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getAgentOrders = async (req: Request, res: Response) => {
  try {
    const agentId = (req as any).userId;
    const agent = await userRepo().findOne({ where: { id: agentId } } as any);
    const stationId = (agent as any).station?.id || (req as any).user?.station?.id;

    if (!stationId) return res.status(400).json({ error: 'Agent has no station' });

    const orders = await fetchOrdersWithDeliveries({ stationId });
    res.json({ orders });
  } catch (error) {
    console.error('getAgentOrders error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getAgentDrivers = async (req: Request, res: Response) => {
  try {
    const agentId = (req as any).userId;
    const agent = await userRepo().findOne({ where: { id: agentId } } as any);
    const stationId = (agent as any).station?.id || (req as any).user?.station?.id;

    if (!stationId) return res.status(400).json({ error: 'Agent has no station' });

    const drivers = await userRepo().find({ where: { role: 'driver', stationId } } as any);
    res.json({ drivers });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getAgentProducts = async (req: Request, res: Response) => {
  try {
    const agentId = (req as any).userId;
    const agent = await userRepo().findOne({ where: { id: agentId } } as any);
    const stationId = (agent as any).station?.id || (req as any).user?.station?.id;

    if (!stationId) return res.status(400).json({ error: 'Agent has no station' });

    res.json({ products: [] });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getAgentDashboard = async (req: Request, res: Response) => {
  try {
    const agentId = (req as any).userId;
    const agent = await userRepo().findOne({ where: { id: agentId } } as any);
    const stationId = (agent as any).station?.id || (req as any).user?.station?.id;

    if (!stationId) return res.status(400).json({ error: 'Agent has no station' });

    const orders = await orderRepo().find({ where: { stationId } } as any);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = orders.filter((o: any) => new Date(o.createdAt) >= today);
    const totalRevenue = orders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);

    res.json({
      stats: {
        totalOrders: orders.length,
        todayOrders: todayOrders.length,
        totalRevenue,
        pendingOrders: orders.filter((o: any) => o.status === 'pending').length,
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const createAgentDriver = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, password, vehicleNumber } = req.body;
    const repo = userRepo();

    const existing = await repo.findOne({ where: [{ email }, { phone }] } as any);
    if (existing) return res.status(400).json({ error: 'Driver already exists' });

    const bcrypt = require('bcryptjs');
    const hashed = await bcrypt.hash(password, 10);

    const driver = repo.create({
      name, email, phone, password: hashed, role: 'driver', vehicleNumber
    } as any);

    const result: any = await repo.save(driver);
    const saved = Array.isArray(result) ? result[0] : result;

    res.status(201).json({
      driver: {
        id: saved.id, name: saved.name, email: saved.email,
        phone: saved.phone, role: saved.role, vehicleNumber: saved.vehicleNumber
      }
    });
  } catch (error) {
    console.error('createAgentDriver error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const assignDriverToOrder = async (req: Request, res: Response) => {
  try {
    const { orderId, driverId } = req.body;
    const dRepo = deliveryRepo();

    const existing = await dRepo.findOne({ where: { orderId } } as any);
    if (existing) {
      await dRepo.update((existing as any).id, { driverId, status: 'assigned' } as any);
      const updated = await dRepo.findOne({ where: { orderId } } as any);
      return res.json({ delivery: updated });
    }

    const delivery = dRepo.create({ orderId, driverId, status: 'assigned' } as any);
    const result: any = await dRepo.save(delivery);
    const saved = Array.isArray(result) ? result[0] : result;

    res.status(201).json({ delivery: saved });
  } catch (error) {
    console.error('assignDriverToOrder error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const cancelOrder = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    await orderRepo().update(orderId, { status: 'cancelled' } as any);
    res.json({ message: 'Order cancelled' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};