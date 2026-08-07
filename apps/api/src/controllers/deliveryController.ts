import { Request, Response } from 'express';
import AppDataSource from '../config/database';
import { Delivery } from '../entities/Delivery';
import { Order } from '../entities/Order';
import { User } from '../entities/User';
import { broadcastToOrder, broadcastToAdmins } from '../config/socket';
import { updateDeliveryStatusUnified } from '../services/deliveryService';

const deliveryRepository = AppDataSource.getRepository(Delivery);
const orderRepository = AppDataSource.getRepository(Order);
const userRepository = AppDataSource.getRepository(User);

export const getDeliveryTracking = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const user = (req as any).user;

    const order = await orderRepository.findOne({
      where: { id: orderId },
      relations: ['deliveries', 'items', 'items.product', 'user', 'station'],
    });

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const isOwner = order.userId === user.id;
    const isAssignedDriver = order.deliveries?.some((d: Delivery) => d.driverId === user.id);
    const isAdminOrAgent = ['admin', 'agent'].includes(user.role);

    if (!isOwner && !isAssignedDriver && !isAdminOrAgent) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    res.json({
      success: true,
      data: {
        order,
        delivery: order.deliveries?.[0] || null,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateDeliveryLocation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { latitude, longitude, accuracy, speed, heading } = req.body;
    const user = (req as any).user;

    if (user.role !== 'driver') {
      return res.status(403).json({ success: false, error: 'Only drivers can update location' });
    }

    const delivery = await deliveryRepository.findOne({
      where: { id },
      relations: ['order'],
    });

    if (!delivery) {
      return res.status(404).json({ success: false, error: 'Delivery not found' });
    }

    if (delivery.driverId !== user.id) {
      return res.status(403).json({ success: false, error: 'Not your assigned delivery' });
    }

    const locationPoint = {
      latitude,
      longitude,
      accuracy: accuracy || null,
      speed: speed || null,
      heading: heading || null,
      timestamp: new Date().toISOString(),
    };

    delivery.currentLocation = locationPoint;

    const driver = await userRepository.findOneBy({ id: user.id });
    if (driver) {
      driver.currentLatitude = latitude;
      driver.currentLongitude = longitude;
      driver.lastLocationUpdate = new Date();
      await userRepository.save(driver);
    }

    await deliveryRepository.save(delivery);

    broadcastToOrder(delivery.orderId, 'driver_location_update', {
      orderId: delivery.orderId,
      driverId: user.id,
      driverName: delivery.driverName,
      location: locationPoint,
    });

    broadcastToAdmins('driver_location_update', {
      driverId: user.id,
      driverName: delivery.driverName,
      orderId: delivery.orderId,
      location: locationPoint,
    });

    res.json({ success: true, data: delivery });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ── USE SHARED SERVICE ──
export const updateDeliveryStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, deliveryPhoto, customerSignature, rating } = req.body;
    const user = (req as any).user;

    if (user.role !== 'driver') {
      return res.status(403).json({ success: false, error: 'Only drivers can update delivery status' });
    }

    const delivery = await deliveryRepository.findOne({
      where: { id },
      relations: ['order'],
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