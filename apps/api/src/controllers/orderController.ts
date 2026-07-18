import { Request, Response } from 'express';
import AppDataSource  from '../config/database';
import { Order } from '../entities/Order';
import { OrderItem } from '../entities/OrderItem';
import { Product } from '../entities/Product';
import { User } from '../entities/User';
import { Station } from '../entities/Station';
import { Delivery } from '../entities/Delivery';

const orderRepository = AppDataSource.getRepository(Order);
const productRepository = AppDataSource.getRepository(Product);
const userRepository = AppDataSource.getRepository(User);
const stationRepository = AppDataSource.getRepository(Station);
const deliveryRepository = AppDataSource.getRepository(Delivery);

// Helper: Calculate Haversine distance
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// POST /api/orders - Customer creates order
export const createOrder = async (req: Request, res: Response) => {
  try {
    const { items, deliveryAddress, deliveryLatitude, deliveryLongitude, paymentMethod, notes } = req.body;
    const { user } = req as any;

    if (user.role !== 'customer') {
      return res.status(403).json({ success: false, error: 'Only customers can place orders' });
    }

    // Validate items and calculate total
    let totalAmount = 0;
    const orderItems: OrderItem[] = [];

    for (const item of items) {
      const product = await productRepository.findOne({ where: { id: item.productId } });
      if (!product) {
        return res.status(400).json({ success: false, error: `Product ${item.productId} not found` });
      }
      if (!product.isAvailable) {
        return res.status(400).json({ success: false, error: `${product.name} is not available` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ success: false, error: `Insufficient stock for ${product.name}` });
      }

      totalAmount += product.price * item.quantity;

      const orderItem = new OrderItem();
      orderItem.productId = product.id;
      orderItem.quantity = item.quantity;
      orderItem.price = product.price;
      orderItem.subtotal = product.price * item.quantity;
      orderItems.push(orderItem);
    }

    // Find nearest active station
    const stations = await stationRepository.find({ where: { isActive: true } });
    if (stations.length === 0) {
      return res.status(400).json({ success: false, error: 'No active stations available' });
    }

    let nearestStation = stations[0];
    let minDistance = Infinity;

    if (deliveryLatitude && deliveryLongitude) {
      for (const station of stations) {
        const dist = getDistance(
          deliveryLatitude, deliveryLongitude,
          station.latitude, station.longitude
        );
        if (dist < minDistance) {
          minDistance = dist;
          nearestStation = station;
        }
      }
    }

    // Create order
    const order = orderRepository.create({
      userId: user.id,
      stationId: nearestStation.id,
      totalAmount,
      deliveryAddress,
      deliveryLatitude,
      deliveryLongitude,
      paymentMethod: paymentMethod || 'cash',
      paymentStatus: paymentMethod === 'wallet' ? 'paid' : 'pending',
      status: 'pending',
      notes,
      items: orderItems
    });

    await orderRepository.save(order);

    // Decrement stock
    for (const item of items) {
      const product = await productRepository.findOne({ where: { id: item.productId } });
      if (product) {
        product.stock -= item.quantity;
        await productRepository.save(product);
      }
    }

    res.status(201).json({ success: true, data: order });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/orders - Role-based order listing
export const getOrders = async (req: Request, res: Response) => {
  try {
    const { user } = req as any;
    let query = orderRepository.createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.station', 'station')
      .leftJoinAndSelect('order.deliveries', 'deliveries');
    // FIXED: Removed .leftJoinAndSelect('deliveries.driver', 'driver')
    // Delivery entity has no 'driver' relation; driver info is on delivery directly

    if (user.role === 'customer') {
      query = query.where('order.userId = :userId', { userId: user.id });
    } else if (user.role === 'agent') {
      const agent = await userRepository.findOne({ where: { id: user.id } });
      if (agent?.stationId) {
        query = query.where('order.stationId = :stationId', { stationId: agent.stationId });
      }
    }
    // Admin sees all

    const orders = await query.orderBy('order.createdAt', 'DESC').getMany();
    res.json({ success: true, data: orders });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/orders/:id - Single order (with role check)
export const getOrderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user } = req as any;

    const order = await orderRepository.findOne({
      where: { id },
      relations: ['items', 'items.product', 'user', 'station', 'deliveries']
      // FIXED: Removed 'deliveries.driver' — Delivery has no 'driver' relation
    });

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Access check
    if (user.role === 'customer' && order.userId !== user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    if (user.role === 'agent' && order.stationId !== user.stationId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    res.json({ success: true, data: order });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /api/orders/:id/cancel - Customer cancels order
export const cancelOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const { user } = req as any;

    const order = await orderRepository.findOne({
      where: { id },
      relations: ['items', 'items.product']
    });

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (user.role === 'customer' && order.userId !== user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ success: false, error: 'Order cannot be cancelled at this stage' });
    }

    order.status = 'cancelled';
    order.cancellationReason = reason;
    await orderRepository.save(order);

    // Restore stock
    for (const item of order.items) {
      const product = await productRepository.findOne({ where: { id: item.productId } });
      if (product) {
        product.stock += item.quantity;
        await productRepository.save(product);
      }
    }

    res.json({ success: true, data: order });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// PUT /api/orders/:id/status - Admin/Agent update status
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { user } = req as any;

    const order = await orderRepository.findOne({ where: { id } });
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (user.role === 'agent' && order.stationId !== user.stationId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    order.status = status;
    await orderRepository.save(order);
    res.json({ success: true, data: order });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
