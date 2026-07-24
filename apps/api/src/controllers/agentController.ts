import { Request, Response } from "express";
import AppDataSource from "../config/database";
import { Order } from "../entities/Order";
import { User } from "../entities/User";
import { Product } from "../entities/Product";

const orderRepo = () => AppDataSource.getRepository(Order);
const userRepo = () => AppDataSource.getRepository(User);
const productRepo = () => AppDataSource.getRepository(Product);

export const getAgentOrders = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const orders = await orderRepo().find({
      where: { stationId: user.stationId },
      relations: ['items', 'items.product', 'user', 'station', 'deliveries'],
      order: { createdAt: 'DESC' },
    });
    return res.json({ success: true, data: orders });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch orders' });
  }
};

export const getAgentDrivers = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const drivers = await userRepo().find({
      where: { role: 'driver', stationId: user.stationId },
    });
    return res.json({ success: true, data: drivers });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch drivers' });
  }
};

export const getAgentProducts = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const products = await productRepo().find({
      where: { stationId: user.stationId },
      order: { name: 'ASC' },
    });
    return res.json({ success: true, data: products });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch products' });
  }
};

export const getAgentDashboard = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const stationId = user.stationId;

    const [totalOrders, pendingOrders, todayOrders, totalDrivers, totalProducts] = await Promise.all([
      orderRepo().count({ where: { stationId } }),
      orderRepo().count({ where: { stationId, status: 'pending' } }),
      orderRepo().count({
        where: {
          stationId,
          createdAt: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      }),
      userRepo().count({ where: { role: 'driver', stationId } }),
      productRepo().count({ where: { stationId } }),
    ]);

    return res.json({
      success: true,
      data: { totalOrders, pendingOrders, todayOrders, totalDrivers, totalProducts },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch dashboard' });
  }
};

export const createAgentDriver = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { name, email, phone, password, vehicleNumber } = req.body;

    const existing = await userRepo().findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }

    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Use save directly with plain object
    const result = await userRepo().save({
      name,
      email,
      phone,
      password: hashedPassword,
      role: 'driver',
      stationId: user.stationId,
      vehicleNumber,
      status: 'available',
    } as any);

    const driver = Array.isArray(result) ? result[0] : result;
    const { password: _, ...driverWithoutPassword } = driver;

    return res.status(201).json({ success: true, data: driverWithoutPassword });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to create driver' });
  }
};

export const assignDriverToOrder = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { driverId } = req.body;

    const order = await orderRepo().findOne({
      where: { id, stationId: user.stationId },
      relations: ['deliveries'],
    });

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const driver = await userRepo().findOne({
      where: { id: driverId, role: 'driver', stationId: user.stationId },
    });

    if (!driver) {
      return res.status(404).json({ success: false, error: 'Driver not found' });
    }

    order.status = 'driver_assigned';
    await orderRepo().save(order);

    const deliveryRepo = AppDataSource.getRepository('Delivery');
    let delivery = order.deliveries?.[0];
    if (!delivery) {
      const delResult = await deliveryRepo.save({
        orderId: order.id,
        driverId: driver.id,
        driverName: driver.name,
        driverPhone: driver.phone,
        vehicleNumber: driver.vehicleNumber,
        status: 'driver_assigned',
      } as any);
      delivery = Array.isArray(delResult) ? delResult[0] : delResult;
    } else {
      delivery.driverId = driver.id;
      delivery.driverName = driver.name;
      delivery.driverPhone = driver.phone;
      delivery.vehicleNumber = driver.vehicleNumber;
      delivery.status = 'driver_assigned';
      await deliveryRepo.save(delivery);
    }

    return res.json({ success: true, data: order });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to assign driver' });
  }
};

export const cancelOrder = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { reason } = req.body;

    const order = await orderRepo().findOne({
      where: { id, stationId: user.stationId },
      relations: ['items', 'items.product'],
    });

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (order.status === 'cancelled' || order.status === 'delivered') {
      return res.status(400).json({ success: false, error: 'Order cannot be cancelled' });
    }

    const prodRepo = AppDataSource.getRepository(Product);
    for (const item of order.items) {
      if (item.product) {
        item.product.stock += item.quantity;
        await prodRepo.save(item.product);
      }
    }

    order.status = 'cancelled';
    order.cancellationReason = reason || 'Cancelled by agent';
    await orderRepo().save(order);

    return res.json({ success: true, data: order });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to cancel order' });
  }
};

export const getAgentCustomers = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const stationId = user.stationId;

    const orders = await orderRepo().find({
      where: { stationId },
      relations: ['user'],
      select: ['userId'],
    });

    const userIds: string[] = [];
    for (const o of orders) {
      if (o.userId && !userIds.includes(o.userId)) {
        userIds.push(o.userId);
      }
    }

    if (userIds.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const customers = await userRepo().find({
      where: userIds.map((id: string) => ({ id })),
    });

    return res.json({ success: true, data: customers });
  } catch (error) {
    console.error('[Agent] Get customers error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch customers' });
  }
};
