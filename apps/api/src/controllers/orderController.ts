import { Request, Response } from "express";
import AppDataSource from "../config/database";
import { Order } from "../entities/Order";
import { OrderItem } from "../entities/OrderItem";
import { Product } from "../entities/Product";
import { User } from "../entities/User";
import { Station } from "../entities/Station";
import { Delivery } from "../entities/Delivery";
import { createSystemNotification } from "../services/notificationService";

const orderRepository = AppDataSource.getRepository(Order);
const productRepository = AppDataSource.getRepository(Product);
const userRepository = AppDataSource.getRepository(User);
const stationRepository = AppDataSource.getRepository(Station);
const deliveryRepository = AppDataSource.getRepository(Delivery);

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export const createOrder = async (req: Request, res: Response) => {
  try {
    const { items, deliveryAddress, deliveryCity, deliveryLatitude, deliveryLongitude, paymentMethod, notes } = req.body;
    const { user } = req as any;

    if (user.role !== "customer") {
      return res.status(403).json({ success: false, error: "Only customers can place orders" });
    }

    // ── CRITICAL: Enforce real GPS location ──
    if (!deliveryLatitude || !deliveryLongitude) {
      return res.status(400).json({
        success: false,
        error: "Device GPS location is required. Please enable location services in the app and retry."
      });
    }

    const lat = parseFloat(deliveryLatitude);
    const lng = parseFloat(deliveryLongitude);

    // Validate coordinates are within Uganda bounds (approximate)
    if (lat < -1.5 || lat > 4.5 || lng < 29.5 || lng > 35.0) {
      return res.status(400).json({
        success: false,
        error: "Invalid location coordinates. Location must be within Uganda."
      });
    }

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

    const stations = await stationRepository.find({ where: { isActive: true } });
    if (stations.length === 0) {
      return res.status(400).json({ success: false, error: "No active stations available" });
    }

    let nearestStation = stations[0];
    let minDistance = Infinity;

    for (const station of stations) {
      if (station.latitude && station.longitude) {
        const dist = getDistance(lat, lng, station.latitude, station.longitude);
        if (dist < minDistance) {
          minDistance = dist;
          nearestStation = station;
        }
      }
    }

    const finalAddress = deliveryAddress || "";
    const finalCity = deliveryCity || "";

    const order = orderRepository.create({
      userId: user.id,
      stationId: nearestStation.id,
      totalAmount,
      deliveryAddress: finalAddress,
      deliveryCity: finalCity,
      deliveryLatitude: lat,
      deliveryLongitude: lng,
      locationAccuracy: req.body.accuracy || null,
      paymentMethod: paymentMethod || "cash",
      paymentStatus: paymentMethod === "wallet" ? "paid" : "pending",
      status: "pending",
      notes,
      items: orderItems,
    });

    await orderRepository.save(order);

    for (const item of items) {
      const product = await productRepository.findOne({ where: { id: item.productId } });
      if (product) {
        product.stock -= item.quantity;
        await productRepository.save(product);
      }
    }

    // ── Notify ALL stakeholders ──
    await createSystemNotification({
      type: "order_placed",
      orderId: order.id,
      stationId: nearestStation.id,
      title: "New Order Received",
      message: `Order #${order.id.slice(0, 8).toUpperCase()} from ${user.name} — UGX ${totalAmount.toLocaleString()}`,
      data: { orderId: order.id, totalAmount, customerName: user.name, address: finalAddress },
      notifyAdmin: true,
      notifyAgent: true,
      notifyCustomer: true,
      userId: user.id,
    });

    res.status(201).json({ success: true, data: order });
  } catch (error: any) {
    console.error("[createOrder]", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getOrders = async (req: Request, res: Response) => {
  try {
    const { user } = req as any;
    let query = orderRepository.createQueryBuilder("order")
      .leftJoinAndSelect("order.items", "items")
      .leftJoinAndSelect("items.product", "product")
      .leftJoinAndSelect("order.user", "user")
      .leftJoinAndSelect("order.station", "station")
      .leftJoinAndSelect("order.deliveries", "deliveries");

    if (user.role === "customer") {
      query = query.where("order.userId = :userId", { userId: user.id });
    } else if (user.role === "agent") {
      const agent = await userRepository.findOne({ where: { id: user.id } });
      if (agent?.stationId) {
        query = query.where("order.stationId = :stationId", { stationId: agent.stationId });
      }
    }

    const orders = await query.orderBy("order.createdAt", "DESC").getMany();
    res.json({ success: true, data: orders });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user } = req as any;

    const order = await orderRepository.findOne({
      where: { id },
      relations: ["items", "items.product", "user", "station", "deliveries"],
    });

    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    if (user.role === "customer" && order.userId !== user.id) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }
    if (user.role === "agent" && order.stationId !== user.stationId) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    res.json({ success: true, data: order });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const cancelOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const { user } = req as any;

    const order = await orderRepository.findOne({
      where: { id },
      relations: ["items", "items.product"],
    });

    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    if (user.role === "customer" && order.userId !== user.id) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    if (!["pending", "confirmed"].includes(order.status)) {
      return res.status(400).json({ success: false, error: "Order cannot be cancelled at this stage" });
    }

    order.status = "cancelled";
    order.cancellationReason = reason;
    await orderRepository.save(order);

    for (const item of order.items) {
      const product = await productRepository.findOne({ where: { id: item.productId } });
      if (product) {
        product.stock += item.quantity;
        await productRepository.save(product);
      }
    }

    await createSystemNotification({
      type: "cancelled",
      orderId: order.id,
      stationId: order.stationId,
      title: "Order Cancelled",
      message: `Order #${order.id.slice(0, 8).toUpperCase()} has been cancelled. Reason: ${reason || "No reason provided"}`,
      data: { orderId: order.id, reason, cancelledBy: user.role },
      notifyAdmin: true,
      notifyAgent: true,
      notifyCustomer: true,
      userId: order.userId,
    });

    res.json({ success: true, data: order });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { user } = req as any;

    const order = await orderRepository.findOne({
      where: { id },
      relations: ["user", "station"],
    });
    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    if (user.role === "agent" && order.stationId !== user.stationId) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    const oldStatus = order.status;
    order.status = status;
    await orderRepository.save(order);

    const statusMessages: Record<string, { title: string; message: string; type: any }> = {
      confirmed: {
        title: "Order Confirmed",
        message: `Your order #${id.slice(0, 8).toUpperCase()} has been confirmed and is being prepared.`,
        type: "order_confirmed",
      },
      driver_assigned: {
        title: "Driver Assigned",
        message: `A driver has been assigned to your order #${id.slice(0, 8).toUpperCase()}.`,
        type: "driver_assigned",
      },
      picked_up: {
        title: "Order Picked Up",
        message: `Your order #${id.slice(0, 8).toUpperCase()} has been picked up by the driver.`,
        type: "picked_up",
      },
      in_transit: {
        title: "On The Way",
        message: `Your order #${id.slice(0, 8).toUpperCase()} is on the way!`,
        type: "in_transit",
      },
      nearby: {
        title: "Driver Nearby",
        message: `Your driver is approaching your location.`,
        type: "nearby",
      },
      delivered: {
        title: "Delivered",
        message: `Your order #${id.slice(0, 8).toUpperCase()} has been delivered. Please confirm receipt.`,
        type: "delivered",
      },
      completed: {
        title: "Order Completed",
        message: `Your order #${id.slice(0, 8).toUpperCase()} is complete. Thank you for using GasMobil!`,
        type: "delivered",
      },
    };

    const msg = statusMessages[status];
    if (msg) {
      await createSystemNotification({
        type: msg.type,
        orderId: order.id,
        stationId: order.stationId,
        title: msg.title,
        message: msg.message,
        data: { orderId: order.id, status, oldStatus, updatedBy: user.role },
        notifyAdmin: true,
        notifyAgent: true,
        notifyCustomer: true,
        userId: order.userId,
      });
    }

    res.json({ success: true, data: order });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};