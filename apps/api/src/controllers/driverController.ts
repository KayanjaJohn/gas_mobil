import { Request, Response } from 'express';
import AppDataSource from '../config/database';
import { Order } from '../entities/Order';
import { User } from '../entities/User';
import { Delivery } from '../entities/Delivery';
import { broadcastToAdmins } from '../config/socket';
import { updateDeliveryStatusUnified } from '../services/deliveryService';

const orderRepository = AppDataSource.getRepository(Order);
const userRepository = AppDataSource.getRepository(User);
const deliveryRepository = AppDataSource.getRepository(Delivery);

export const getDriverOrders = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'driver') {
      return res.status(403).json({ success: false, error: 'Driver access only' });
    }

    const orders = await orderRepository.createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.station', 'station')
      .leftJoinAndSelect('order.deliveries', 'deliveries')
      .where('deliveries.driverId = :driverId', { driverId: user.id })
      .andWhere('order.status IN (:...statuses)', {
        statuses: ['driver_assigned', 'picked_up', 'in_transit', 'nearby']
      })
      .orderBy('order.createdAt', 'DESC')
      .getMany();

    res.json({ success: true, data: orders });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const acceptOrder = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const user = (req as any).user;

    const order = await orderRepository.findOne({
      where: { id: orderId },
      relations: ['deliveries']
    });

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const delivery = order.deliveries?.find((d: Delivery) => d.driverId === user.id);
    if (!delivery) {
      return res.status(403).json({ success: false, error: 'Order not assigned to you' });
    }

    order.status = 'picked_up';
    delivery.status = 'picked_up';
    await orderRepository.save(order);
    await deliveryRepository.save(delivery);

    res.json({ success: true, data: order });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateDriverStatus = async (req: Request, res: Response) => {
  try {
    const { status, latitude, longitude } = req.body;
    const user = (req as any).user;

    if (user.role !== 'driver') {
      return res.status(403).json({ success: false, error: 'Driver access only' });
    }

    const driver = await userRepository.findOne({ where: { id: user.id } });
    if (!driver) {
      return res.status(404).json({ success: false, error: 'Driver not found' });
    }

    driver.driverStatus = status;
    if (latitude !== undefined) driver.currentLatitude = latitude;
    if (longitude !== undefined) driver.currentLongitude = longitude;
    driver.lastLocationUpdate = new Date();

    await userRepository.save(driver);

    broadcastToAdmins('driver_status_changed', {
      driverId: driver.id,
      driverName: driver.name,
      status,
      location: { latitude, longitude },
      timestamp: new Date().toISOString(),
    });

    res.json({ success: true, data: driver });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getDriverProfile = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const driver = await userRepository.findOne({
      where: { id: user.id },
      relations: ['station']
    });

    if (!driver) {
      return res.status(404).json({ success: false, error: 'Driver not found' });
    }

    res.json({
      success: true,
      data: {
        id: driver.id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        driverStatus: driver.driverStatus,
        vehicleNumber: driver.vehicleNumber,
        vehicleType: driver.vehicleType,
        currentLatitude: driver.currentLatitude,
        currentLongitude: driver.currentLongitude,
        station: driver.station
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ── USE SHARED SERVICE ──
export const updateDeliveryStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, deliveryPhoto, customerSignature, deliveryNotes, rating } = req.body;
    const user = (req as any).user;

    if (user.role !== 'driver') {
      return res.status(403).json({ success: false, error: 'Driver access only' });
    }

    const delivery = await deliveryRepository.findOne({
      where: { id },
      relations: ['order']
    });

    if (!delivery) {
      return res.status(404).json({ success: false, error: 'Delivery not found' });
    }

    const result = await updateDeliveryStatusUnified({
      deliveryId: id,
      status,
      driverId: user.id,
      driverName: delivery.driverName,
      vehicleNumber: delivery.vehicleNumber,
      deliveryPhoto: deliveryPhoto || null,
      customerSignature: customerSignature || null,
      notes: deliveryNotes || null,
      rating: rating !== undefined ? Number(rating) : null,
    });

    res.json({
      success: true,
      data: result,
      message: `Delivery status updated to ${status}`,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const getDriverStats = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'driver') {
      return res.status(403).json({ success: false, error: 'Driver access only' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deliveries = await deliveryRepository.find({
      where: { driverId: user.id },
      relations: ['order']
    });

    const todayOrders = deliveries.filter(d =>
      d.order && new Date(d.order.createdAt) >= today
    );

    const todayCompleted = todayOrders.filter(d => d.status === 'delivered');
    const totalEarnings = todayCompleted.reduce((sum, d) =>
      sum + Number(d.order?.totalAmount || 0) * 0.1, 0
    );

    res.json({
      success: true,
      data: {
        todayOrders: todayOrders.length,
        todayCompleted: todayCompleted.length,
        todayEarnings: Math.round(totalEarnings),
        totalDeliveries: deliveries.filter(d => d.status === 'delivered').length,
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getDriverEarnings = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'driver') {
      return res.status(403).json({ success: false, error: 'Driver access only' });
    }

    const deliveries = await deliveryRepository.find({
      where: { driverId: user.id, status: 'delivered' },
      relations: ['order'],
      order: { createdAt: 'DESC' }
    });

    const earnings = deliveries.map(d => ({
      id: d.id,
      orderId: d.orderId,
      date: d.createdAt,
      amount: Math.round(Number(d.order?.totalAmount || 0) * 0.1),
      status: 'paid' as const,
      customerName: d.order?.user?.name || 'N/A',
    }));

    const totalEarnings = earnings.reduce((sum, e) => sum + e.amount, 0);

    res.json({ success: true, data: { earnings, totalEarnings } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};