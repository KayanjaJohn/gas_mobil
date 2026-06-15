import { Request, Response } from 'express';
import AppDataSource from '../config/database';
import { User } from '../entities/User';
import { Order } from '../entities/Order';
import { Delivery } from '../entities/Delivery';

const userRepository = AppDataSource.getRepository(User);
const orderRepository = AppDataSource.getRepository(Order);
const deliveryRepository = AppDataSource.getRepository(Delivery);

export const getDriverOrders = async (req: Request, res: Response) => {
  try {
    const driverId = (req as any).userId;
    const userRole = (req as any).userRole;

    if (userRole !== 'driver') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const orders = await orderRepository.find({
      where: { driverId, status: 'driver_assigned' },
      relations: ['items', 'items.product', 'user', 'deliveries'],
      order: { createdAt: 'DESC' },
    });

    res.json({ success: true, data: orders });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const acceptOrder = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const driverId = (req as any).userId;
    const userRole = (req as any).userRole;

    if (userRole !== 'driver') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const order = await orderRepository.findOne({
      where: { id: orderId },
      relations: ['deliveries'],
    });

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (order.driverId !== driverId) {
      return res.status(403).json({ success: false, error: 'Not assigned to you' });
    }

    order.status = 'driver_assigned';
    await orderRepository.save(order);

    const delivery = order.deliveries?.[0];
    if (delivery) {
      delivery.status = 'accepted';
      await deliveryRepository.save(delivery);
    }

    res.json({ success: true, data: order, message: 'Order accepted' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateDriverStatus = async (req: Request, res: Response) => {
  try {
    const driverId = (req as any).userId;
    const userRole = (req as any).userRole;
    const { status, currentLatitude, currentLongitude } = req.body;

    if (userRole !== 'driver') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const driver = await userRepository.findOneBy({ id: driverId });
    if (!driver) {
      return res.status(404).json({ success: false, error: 'Driver not found' });
    }

    if (status) driver.driverStatus = status;
    if (currentLatitude !== undefined) driver.currentLatitude = currentLatitude;
    if (currentLongitude !== undefined) driver.currentLongitude = currentLongitude;
    if (currentLatitude || currentLongitude) driver.lastLocationUpdate = new Date();

    await userRepository.save(driver);

    res.json({
      success: true,
      data: {
        id: driver.id,
        name: driver.name,
        status: driver.driverStatus,
        location: driver.currentLatitude ? {
          latitude: driver.currentLatitude,
          longitude: driver.currentLongitude,
        } : null,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getDriverProfile = async (req: Request, res: Response) => {
  try {
    const driverId = (req as any).userId;
    const userRole = (req as any).userRole;

    if (userRole !== 'driver') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const driver = await userRepository.findOne({
      where: { id: driverId },
      relations: ['station'],
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
        vehicleNumber: driver.vehicleNumber,
        vehicleType: driver.vehicleType,
        status: driver.driverStatus,
        station: driver.station,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};