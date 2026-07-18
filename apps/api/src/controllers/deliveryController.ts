import { Request, Response } from 'express';
import AppDataSource from '../config/database';
import { Delivery } from '../entities/Delivery';
import { Order } from '../entities/Order';
import { User } from '../entities/User';
import { broadcastToOrder, broadcastToUser, broadcastToAdmins } from '../config/socket';

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

export const updateDeliveryStatus = async (req: Request, res: Response) => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const { id } = req.params;
    const { status, deliveryPhoto, customerSignature, rating } = req.body;
    const user = (req as any).user;

    if (user.role !== 'driver') {
      return res.status(403).json({ success: false, error: 'Only drivers can update delivery status' });
    }

    const delivery = await queryRunner.manager.findOne(Delivery, {
      where: { id },
      relations: ['order', 'order.user'],
    });

    if (!delivery) {
      return res.status(404).json({ success: false, error: 'Delivery not found' });
    }

    if (delivery.driverId !== user.id) {
      return res.status(403).json({ success: false, error: 'Not your delivery' });
    }

    const validTransitions: Record<string, string[]> = {
      'pending': ['picked_up'],
      'picked_up': ['in_transit'],
      'in_transit': ['nearby', 'delivered'],
      'nearby': ['delivered'],
    };

    if (validTransitions[delivery.status] && !validTransitions[delivery.status].includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Cannot transition from ${delivery.status} to ${status}`,
      });
    }

    delivery.status = status as any;
    if (deliveryPhoto) delivery.deliveryPhoto = deliveryPhoto;
    if (customerSignature) delivery.customerSignature = customerSignature;
    if (rating) delivery.rating = rating;

    const order = delivery.order;
    const statusMap: Record<string, string> = {
      'picked_up': 'picked_up',
      'in_transit': 'in_transit',
      'nearby': 'nearby',
      'delivered': 'delivered',
    };

    if (statusMap[status]) {
      order.status = statusMap[status] as any;
    }

    if (status === 'delivered') {
      order.status = 'completed' as any;
      if (order.paymentMethod === 'cash') {
        order.paymentStatus = 'paid' as any;
      }

      const driver = await queryRunner.manager.findOne(User, { where: { id: user.id } });
      if (driver) {
        driver.driverStatus = 'online';
        await queryRunner.manager.save(driver);
      }

      broadcastToUser(order.userId, 'order_delivered', {
        orderId: order.id,
        message: 'Your order has been delivered!',
        deliveryPhoto,
        rating,
      });
    } else {
      broadcastToUser(order.userId, 'order_status_update', {
        orderId: order.id,
        status: order.status,
        deliveryStatus: status,
        message: `Your order is now ${status.replace('_', ' ')}`,
      });
    }

    broadcastToAdmins('delivery_status_update', {
      orderId: order.id,
      driverId: user.id,
      driverName: delivery.driverName,
      status,
      timestamp: new Date().toISOString(),
    });

    await queryRunner.manager.save(delivery);
    await queryRunner.manager.save(order);
    await queryRunner.commitTransaction();

    res.json({
      success: true,
      data: { delivery, order },
      message: `Delivery status updated to ${status}`,
    });
  } catch (error: any) {
    await queryRunner.rollbackTransaction();
    res.status(500).json({ success: false, error: error.message });
  } finally {
    await queryRunner.release();
  }
};
