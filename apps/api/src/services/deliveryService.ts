import AppDataSource from '../config/database';
import { Delivery, DeliveryStatus } from '../entities/Delivery';
import { Order } from '../entities/Order';
import { User } from '../entities/User';
import { createSystemNotification } from './notificationService';
import { broadcastToAdmins } from '../config/socket';

const deliveryRepo = AppDataSource.getRepository(Delivery);
const orderRepo = AppDataSource.getRepository(Order);
const userRepo = AppDataSource.getRepository(User);

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['picked_up'],
  picked_up: ['in_transit'],
  in_transit: ['nearby', 'delivered'],
  nearby: ['delivered'],
};

const STATUS_CONFIG: Record<string, { title: string; message: string; type: string }> = {
  picked_up: {
    title: 'Order Picked Up',
    message: 'Your order has been picked up by the driver.',
    type: 'picked_up',
  },
  in_transit: {
    title: 'On The Way',
    message: 'Your order is on the way!',
    type: 'in_transit',
  },
  nearby: {
    title: 'Driver Nearby',
    message: 'Your driver is approaching your location. Get ready!',
    type: 'nearby',
  },
  delivered: {
    title: 'Delivered',
    message: 'Your order has been delivered. Please confirm receipt in the app.',
    type: 'delivered',
  },
};

export interface UpdateDeliveryStatusInput {
  deliveryId: string;
  status: DeliveryStatus;
  driverId: string;
  driverName: string;
  vehicleNumber?: string | null;
  phone?: string;
  deliveryPhoto?: string | null;
  customerSignature?: string | null;
  notes?: string | null;
  rating?: number | null;
}

/**
 * Single source of truth for updating delivery + order status.
 * Use this from BOTH driverController and delivery routes.
 */
export async function updateDeliveryStatusUnified(input: UpdateDeliveryStatusInput) {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const delivery = await queryRunner.manager.findOne(Delivery, {
      where: { id: input.deliveryId },
      relations: ['order', 'order.user'],
    });

    if (!delivery) {
      throw new Error('Delivery not found');
    }

    if (delivery.driverId !== input.driverId) {
      throw new Error('Not your assigned delivery');
    }

    const allowed = VALID_TRANSITIONS[delivery.status];
    if (allowed && !allowed.includes(input.status)) {
      throw new Error(`Cannot transition from ${delivery.status} to ${input.status}`);
    }

    // Update delivery
    delivery.status = input.status;
    if (input.deliveryPhoto) delivery.deliveryPhoto = input.deliveryPhoto;
    if (input.customerSignature) delivery.customerSignature = input.customerSignature;
    if (input.notes) delivery.notes = input.notes;
    if (input.rating !== undefined) delivery.rating = input.rating;

    if (input.status === 'picked_up') {
      delivery.pickedUpAt = new Date();
      if (!delivery.startedAt) delivery.startedAt = new Date();
    }
    if (input.status === 'delivered') {
      delivery.deliveredAt = new Date();
    }

    // Update order
    const order = delivery.order;
    const statusMap: Record<string, string> = {
      picked_up: 'picked_up',
      in_transit: 'in_transit',
      nearby: 'nearby',
      delivered: 'delivered',
    };

    if (statusMap[input.status]) {
      (order as any).status = statusMap[input.status];
    }

    if (input.status === 'delivered') {
      (order as any).status = 'completed';
      if (order.paymentMethod === 'cash') {
        (order as any).paymentStatus = 'paid';
      }

      // Free up driver
      const driver = await queryRunner.manager.findOne(User, { where: { id: input.driverId } });
      if (driver) {
        driver.driverStatus = 'online';
        await queryRunner.manager.save(driver);
      }
    }

    await queryRunner.manager.save(delivery);
    await queryRunner.manager.save(order);
    await queryRunner.commitTransaction();

    // ── Notifications & Socket (outside transaction) ──
    const cfg = STATUS_CONFIG[input.status];
    if (cfg) {
      await createSystemNotification({
        type: cfg.type as any,
        orderId: order.id,
        stationId: order.stationId,
        title: cfg.title,
        message: cfg.message,
        data: {
          driverId: input.driverId,
          driverName: input.driverName,
          vehicleNumber: input.vehicleNumber,
          phone: input.phone,
        },
        notifyAdmin: true,
        notifyAgent: true,
        notifyCustomer: true,
        userId: order.userId,
      });
    }

    broadcastToAdmins('delivery_status_update', {
      orderId: order.id,
      driverId: input.driverId,
      driverName: input.driverName,
      status: input.status,
      timestamp: new Date().toISOString(),
    });

    return { delivery, order };
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}