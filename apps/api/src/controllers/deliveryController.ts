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
    const userId = (req as any).userId;
    const userRole = (req as any).userRole;

    const order = await orderRepository.findOne({
      where: { id: orderId },
      relations: ['deliveries', 'driver', 'items', 'items.product'],
    });

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (order.userId !== userId && !['admin', 'agent', 'driver'].includes(userRole)) {
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
    const driverId = (req as any).userId;
    const userRole = (req as any).userRole;

    if (userRole !== 'driver') {
      return res.status(403).json({ success: false, error: 'Only drivers can update location' });
    }

    const delivery = await deliveryRepository.findOne({
      where: { id },
      relations: ['order'],
    });

    if (!delivery) {
      return res.status(404).json({ success: false, error: 'Delivery not found' });
    }

    if (delivery.driverId !== driverId) {
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

    if (!delivery.route) delivery.route = [];
    delivery.route.push(locationPoint);

    // Update driver location
    const driver = await userRepository.findOneBy({ id: driverId });
    if (driver) {
      driver.currentLatitude = latitude;
      driver.currentLongitude = longitude;
      driver.lastLocationUpdate = new Date();
      await userRepository.save(driver);
    }

    await deliveryRepository.save(delivery);

    // Broadcast real-time location to customer
    broadcastToOrder(delivery.orderId, 'driver_location_update', {
      orderId: delivery.orderId,
      driverId,
      driverName: delivery.driverName,
      location: locationPoint,
      estimatedArrival: delivery.estimatedArrival,
    });

    // Broadcast to admin dashboard
    broadcastToAdmins('driver_location_update', {
      driverId,
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
    const { status, deliveryPhoto, customerSignature, deliveryNotes, rating, review } = req.body;
    const driverId = (req as any).userId;
    const userRole = (req as any).userRole;

    if (userRole !== 'driver') {
      return res.status(403).json({ success: false, error: 'Only drivers can update delivery status' });
    }

    const delivery = await queryRunner.manager.findOne(Delivery, {
      where: { id },
      relations: ['order', 'order.user'],
    });

    if (!delivery) {
      return res.status(404).json({ success: false, error: 'Delivery not found' });
    }

    if (delivery.driverId !== driverId) {
      return res.status(403).json({ success: false, error: 'Not your assigned delivery' });
    }

    const validTransitions: Record<string, string[]> = {
      'assigned': ['accepted', 'picked_up'],
      'accepted': ['picked_up'],
      'picked_up': ['in_transit'],
      'in_transit': ['nearby', 'arrived'],
      'nearby': ['arrived'],
      'arrived': ['delivered'],
    };

    if (validTransitions[delivery.status] && !validTransitions[delivery.status].includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Cannot transition from ${delivery.status} to ${status}`,
      });
    }

    delivery.status = status;
    if (deliveryPhoto) delivery.deliveryPhoto = deliveryPhoto;
    if (customerSignature) delivery.customerSignature = customerSignature;
    if (deliveryNotes) delivery.deliveryNotes = deliveryNotes;
    if (rating) delivery.rating = rating;
    if (review) delivery.review = review;

    const order = delivery.order;
    const statusMap: Record<string, string> = {
      'accepted': 'driver_assigned',
      'picked_up': 'picked_up',
      'in_transit': 'in_transit',
      'nearby': 'nearby',
      'arrived': 'nearby',
      'delivered': 'delivered',
    };

    if (statusMap[status]) {
      order.status = statusMap[status];
    }

    if (status === 'delivered') {
      order.actualDeliveryTime = new Date();
      order.status = 'completed';

      const driver = await queryRunner.manager.findOne(User, { where: { id: driverId } });
      if (driver) {
        driver.driverStatus = 'online';
        await queryRunner.manager.save(driver);
      }

      if (order.paymentMethod === 'cash') {
        order.paymentStatus = 'completed';
      }

      // Notify customer of delivery
      broadcastToUser(order.userId, 'order_delivered', {
        orderId: order.id,
        message: 'Your order has been delivered!',
        deliveryPhoto,
        rating,
      });
    }

    // Notify customer of status change
    if (status !== 'delivered') {
      broadcastToUser(order.userId, 'order_status_update', {
        orderId: order.id,
        status: order.status,
        deliveryStatus: status,
        message: `Your order is now ${status.replace('_', ' ')}`,
      });
    }

    // Notify admins
    broadcastToAdmins('delivery_status_update', {
      orderId: order.id,
      driverId,
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