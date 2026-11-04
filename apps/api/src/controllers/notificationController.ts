import { Request, Response } from "express";
import { In } from "typeorm";
import { Order } from "../entities/Order";
import AppDataSource from "../config/database";
import { Notification } from "../entities/Notification";
import { User } from "../entities/User";

const notificationRepo = AppDataSource.getRepository(Notification);
const userRepo = AppDataSource.getRepository(User);

// POST /api/notifications/push-token — Save this authenticated device's Expo token.
export const registerPushToken = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const expoPushToken = String(req.body?.expoPushToken || "").trim();

    if (!/^(Expo|Exponent)PushToken\[[^\]]+\]$/.test(expoPushToken)) {
      return res.status(400).json({ success: false, error: "A valid Expo push token is required." });
    }

    await userRepo.update({ id: userId }, { expoPushToken });
    return res.json({ success: true, message: "Device notification token registered." });
  } catch (error: any) {
    console.error("[PUSH TOKEN] Registration failed:", error);
    return res.status(500).json({ success: false, error: "Could not register this device for notifications." });
  }
};

// DELETE /api/notifications/push-token — Stop sending private alerts to this device.
export const unregisterPushToken = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    await userRepo.update({ id: userId }, { expoPushToken: null });
    return res.json({ success: true, message: "Device notification token removed." });
  } catch (error: any) {
    console.error("[PUSH TOKEN] Removal failed:", error);
    return res.status(500).json({ success: false, error: "Could not remove this device notification token." });
  }
};

// GET /api/notifications — Get user's notifications
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const [notifications, total] = await notificationRepo.findAndCount({
      where: { userId },
      order: { createdAt: "DESC" },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    });

    const unreadCount = await notificationRepo.count({
      where: { userId, isRead: false },
    });

    // Build full order receipts from the current relational records rather than
    // relying on the small event payload that existed when each notification
    // was first created. This also enriches older notifications already saved.
    const orderIds = Array.from(new Set(
      notifications.map((notification) => notification.orderId).filter((id): id is string => !!id)
    ));

    const orders = orderIds.length
      ? await AppDataSource.getRepository(Order).find({
          where: { id: In(orderIds) },
          relations: ["user", "station", "items", "items.product", "deliveries"],
        } as any)
      : [];

    const driverIds = Array.from(new Set(
      orders.flatMap((order) => (order.deliveries || []).map((delivery) => delivery.driverId).filter(Boolean))
    ));
    const drivers = driverIds.length
      ? await userRepo.find({
          where: { id: In(driverIds) },
          select: ["id", "name", "phone", "vehicleNumber", "vehicleType"],
        } as any)
      : [];
    const driverById = new Map(drivers.map((driver) => [driver.id, driver] as const));
    const orderById = new Map(orders.map((order) => [order.id, order] as const));

    const enrichedNotifications = notifications.map((notification) => {
      const order = notification.orderId ? orderById.get(notification.orderId) : undefined;
      if (!order) return notification;

      const deliveries = [...(order.deliveries || [])].sort((a, b) => {
        const aTime = new Date(a.deliveredAt || a.updatedAt || a.createdAt).getTime();
        const bTime = new Date(b.deliveredAt || b.updatedAt || b.createdAt).getTime();
        return bTime - aTime;
      });
      const latestDelivery = deliveries[0];
      const driver = latestDelivery ? driverById.get(latestDelivery.driverId) : undefined;

      const items = (order.items || []).map((item) => {
        const quantity = Number(item.quantity || 0);
        const unitPrice = Number(item.price ?? item.product?.price ?? 0);
        const lineTotal = Number(item.subtotal ?? unitPrice * quantity);
        return {
          id: item.id,
          productId: item.productId,
          productName: item.product?.name || "Product details unavailable",
          productType: item.product?.type || null,
          size: item.product?.size || null,
          weight: item.product?.weight == null ? null : Number(item.product.weight),
          quantity,
          unitPrice,
          lineTotal,
          imageUrl: item.product?.imageUrl || null,
        };
      });

      const receipt = {
        orderId: order.id,
        orderNumber: order.id.slice(0, 8).toUpperCase(),
        status: order.status,
        customer: {
          id: order.user?.id || order.userId,
          name: order.user?.name || notification.data?.customerName || "Customer",
          phone: order.user?.phone || notification.data?.phone || null,
          email: order.user?.email || null,
        },
        delivery: {
          address: order.deliveryAddress || null,
          city: order.deliveryCity || null,
          latitude: order.deliveryLatitude == null ? null : Number(order.deliveryLatitude),
          longitude: order.deliveryLongitude == null ? null : Number(order.deliveryLongitude),
        },
        station: {
          id: order.station?.id || order.stationId,
          name: order.station?.name || "Station",
          address: order.station?.address || null,
        },
        driver: latestDelivery ? {
          id: latestDelivery.driverId,
          name: latestDelivery.driverName || driver?.name || notification.data?.driverName || null,
          phone: latestDelivery.driverPhone || driver?.phone || null,
          vehicleNumber: latestDelivery.vehicleNumber || driver?.vehicleNumber || notification.data?.vehicleNumber || null,
          vehicleType: driver?.vehicleType || null,
        } : {
          id: null,
          name: notification.data?.driverName || null,
          phone: notification.data?.phone || null,
          vehicleNumber: notification.data?.vehicleNumber || null,
          vehicleType: null,
        },
        payment: {
          method: order.paymentMethod,
          status: order.paymentStatus,
        },
        orderedAt: order.createdAt,
        updatedAt: order.updatedAt,
        deliveredAt: latestDelivery?.deliveredAt || null,
        items,
        totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
        subtotal: items.reduce((sum, item) => sum + item.lineTotal, 0),
        totalAmount: Number(order.totalAmount || 0),
        currency: "UGX",
      };

      return {
        ...notification,
        data: {
          ...(notification.data && typeof notification.data === "object" ? notification.data : {}),
          receipt,
        },
      };
    });

    res.json({
      success: true,
      data: enrichedNotifications,
      meta: { total, page: safePage, limit: safeLimit, unreadCount },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// PATCH /api/notifications/:id/read — Mark single as read
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const notification = await notificationRepo.findOne({ where: { id, userId } });
    if (!notification) {
      return res.status(404).json({ success: false, error: "Notification not found" });
    }

    notification.isRead = true;
    await notificationRepo.save(notification);

    res.json({ success: true, data: notification });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// PATCH /api/notifications/read-all — Mark all as read
export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    await notificationRepo.update({ userId, isRead: false }, { isRead: true });
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// DELETE /api/notifications/:id — Delete notification
export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const result = await notificationRepo.delete({ id, userId });
    if (result.affected === 0) {
      return res.status(404).json({ success: false, error: "Notification not found" });
    }

    res.json({ success: true, message: "Notification deleted" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};