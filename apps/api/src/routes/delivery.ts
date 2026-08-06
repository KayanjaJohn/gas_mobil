import { Router } from 'express';
import { requireDriver } from '../middleware/requireRole';
import AppDataSource from '../config/database';
import { Order } from '../entities/Order';
import { Delivery } from '../entities/Delivery';
import { updateDeliveryStatusUnified } from '../services/deliveryService';

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

    const result = await updateDeliveryStatusUnified({
      deliveryId: delivery.id,
      status,
      driverId: driver.id,
      driverName: delivery.driverName,
      vehicleNumber: driver.vehicleNumber,
      notes: notes || null,
    });

    res.json({ success: true, data: result.order });
  } catch (error: any) {
    console.error('[driverUpdateStatus]', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;