import { Router } from 'express';
import { requireDriver } from '../middleware/requireRole';
import AppDataSource from '../config/database';
import { Order } from '../entities/Order';
import { Delivery } from '../entities/Delivery';
import { createSystemNotification } from '../services/notificationService';

const router = Router();
const orderRepo = AppDataSource.getRepository(Order);
const deliveryRepo = AppDataSource.getRepository(Delivery);

// Driver: Update order status (picked_up, in_transit, nearby, delivered)
router.put('/:orderId/status', requireDriver, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, notes } = req.body;
    const driver = (req as any).user;

    const order = await orderRepo.findOne({
      where: { id: orderId },
      relations: ['deliveries'],
    });
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Verify driver is assigned to this order
    const delivery = await deliveryRepo.findOne({
      where: { orderId, driverId: driver.id },
    });
    if (!delivery) {
      return res.status(403).json({ success: false, error: 'You are not assigned to this order' });
    }

    const validDriverStatuses = ['picked_up', 'in_transit', 'nearby', 'delivered'];
    if (!validDriverStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status for driver update' });
    }

    // Update order status
    order.status = status;
    await orderRepo.save(order);

    // Update delivery record timestamps
    delivery.status = status;
    if (status === 'picked_up') {
      delivery.pickedUpAt = new Date();
      if (!delivery.startedAt) delivery.startedAt = new Date();
    }
    if (status === 'delivered') {
      delivery.deliveredAt = new Date();
    }
    if (notes) {
      delivery.notes = notes;
    }
    await deliveryRepo.save(delivery);

    const statusConfig: Record<string, { title: string; message: string; type: any }> = {
      picked_up: {
        title: 'Order Picked Up',
        message: `Your order has been picked up by driver ${driver.name}.`,
        type: 'picked_up',
      },
      in_transit: {
        title: 'On The Way',
        message: `Your order is on the way! Driver: ${driver.name}, Vehicle: ${driver.vehicleNumber || 'N/A'}.`,
        type: 'in_transit',
      },
      nearby: {
        title: 'Driver Nearby',
        message: `Your driver is approaching your location. Get ready!`,
        type: 'nearby',
      },
      delivered: {
        title: 'Delivered',
        message: `Your order has been delivered. Please confirm receipt in the app.`,
        type: 'delivered',
      },
    };

    const cfg = statusConfig[status];
    await createSystemNotification({
      type: cfg.type,
      orderId: order.id,
      stationId: order.stationId,
      title: cfg.title,
      message: cfg.message,
      data: {
        driverId: driver.id,
        driverName: driver.name,
        vehicleNumber: driver.vehicleNumber,
        phone: driver.phone,
      },
      notifyAdmin: true,
      notifyAgent: true,
      notifyCustomer: true,
      userId: order.userId,
    });

    res.json({ success: true, data: order });
  } catch (error: any) {
    console.error('[driverUpdateStatus]', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;