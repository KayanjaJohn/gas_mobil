import { Request, Response } from 'express';
import AppDataSource  from '../config/database';
import { Order } from '../entities/Order';
import { User } from '../entities/User';
import { Delivery } from '../entities/Delivery';

const orderRepository = AppDataSource.getRepository(Order);
const userRepository = AppDataSource.getRepository(User);
const deliveryRepository = AppDataSource.getRepository(Delivery);

// GET /api/driver/orders - Get orders assigned to this driver
export const getDriverOrders = async (req: Request, res: Response) => {
  try {
    const { user } = req as any;

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

// POST /api/driver/orders/:id/accept - Driver accepts order
export const acceptOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user } = req as any;

    const order = await orderRepository.findOne({
      where: { id },
      relations: ['deliveries']
    });

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Verify this delivery belongs to this driver
const delivery = order.deliveries?.find((d: Delivery) => d.driverId === user.id);    if (!delivery) {
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

// PUT /api/driver/status - Update driver online/offline/busy status + GPS
export const updateDriverStatus = async (req: Request, res: Response) => {
  try {
    const { status, latitude, longitude } = req.body;
    const { user } = req as any;

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

    // Broadcast status change via Socket.IO
    const io = (req as any).io;
    if (io) {
      io.to(`driver_${driver.id}`).emit('driver_status_change', {
        driverId: driver.id,
        status,
        location: { latitude, longitude }
      });
    }

    res.json({ success: true, data: driver });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/driver/profile - Get driver profile with station info
export const getDriverProfile = async (req: Request, res: Response) => {
  try {
    const { user } = req as any;

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

// PUT /api/delivery/:id/status - Update delivery status (picked_up, in_transit, delivered)
export const updateDeliveryStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, deliveryPhoto, customerSignature } = req.body;
    const { user } = req as any;

    const delivery = await deliveryRepository.findOne({
      where: { id },
      relations: ['order']
    });

    if (!delivery) {
      return res.status(404).json({ success: false, error: 'Delivery not found' });
    }

    if (delivery.driverId !== user.id) {
      return res.status(403).json({ success: false, error: 'Not your delivery' });
    }

    delivery.status = status;
    if (deliveryPhoto) delivery.deliveryPhoto = deliveryPhoto;
    if (customerSignature) delivery.customerSignature = customerSignature;

    await deliveryRepository.save(delivery);

    // Update order status accordingly
    const order = delivery.order;
    if (status === 'delivered') {
      order.status = 'delivered';
    } else if (status === 'in_transit') {
      order.status = 'in_transit';
    }
    await orderRepository.save(order);

    res.json({ success: true, data: delivery });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
