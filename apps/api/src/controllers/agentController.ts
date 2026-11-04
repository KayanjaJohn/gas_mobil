import { Request, Response } from "express";
import { In } from "typeorm";
import bcrypt from "bcryptjs";
import AppDataSource from "../config/database";
import { User } from "../entities/User";
import { Order } from "../entities/Order";
import { Delivery } from "../entities/Delivery";
import { Product } from "../entities/Product";
import { createSystemNotification } from "../services/notificationService";

const userRepo = () => AppDataSource.getRepository(User);
const orderRepo = () => AppDataSource.getRepository(Order);
const deliveryRepo = () => AppDataSource.getRepository(Delivery);
const productRepo = () => AppDataSource.getRepository(Product);

const getAgentStationId = async (req: Request): Promise<string | null> => {
  const agentId = (req as any).userId;
  const agent = await userRepo().findOne({
    where: { id: agentId },
    relations: ["station"],
  });
  if (!agent) return null;
  return (agent as any).station?.id || null;
};

const verifyStationOrder = async (
  req: Request,
  orderId: string
): Promise<{ order: Order | null; error?: string }> => {
  const stationId = await getAgentStationId(req);
  if (!stationId) return { order: null, error: "Agent has no station" };
  const order = await orderRepo().findOne({
    where: { id: orderId },
    relations: ["station", "items", "items.product"],
  } as any);
  if (!order) return { order: null, error: "Order not found" };
  if ((order as any).stationId !== stationId)
    return { order: null, error: "Not your station order" };
  return { order };
};

const fetchOrdersWithDeliveries = async (where: any): Promise<Order[]> => {
  return orderRepo().find({
    where,
    relations: ["deliveries", "user", "station", "items", "items.product"],
    order: { createdAt: "DESC" },
  } as any);
};

export const getAgentCustomers = async (req: Request, res: Response) => {
  try {
    const stationId = await getAgentStationId(req);
    if (!stationId)
      return res.status(400).json({ success: false, error: "Agent has no station" });
    const orders = await orderRepo().find({ where: { stationId } } as any);
    const customerIds = [...new Set(orders.map((o: any) => o.userId))].filter(Boolean);
    const customers = customerIds.length > 0 ? await userRepo().find({ where: { id: In(customerIds) } }) : [];
    res.json({ success: true, data: customers });
  } catch (error) {
    console.error("getAgentCustomers error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

export const getAgentOrders = async (req: Request, res: Response) => {
  try {
    const stationId = await getAgentStationId(req);
    if (!stationId)
      return res.status(400).json({ success: false, error: "Agent has no station" });
    const orders = await fetchOrdersWithDeliveries({ stationId });
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error("getAgentOrders error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

export const getAgentDrivers = async (req: Request, res: Response) => {
  try {
    const stationId = await getAgentStationId(req);
    if (!stationId)
      return res.status(400).json({ success: false, error: "Agent has no station" });
    const drivers = await userRepo().find({
      where: { role: "driver", stationId },
      select: [
        "id", "name", "email", "phone", "driverStatus",
        "currentLatitude", "currentLongitude", "lastLocationUpdate",
        "vehicleNumber", "vehicleType", "stationId",
      ],
    } as any);
    res.json({ success: true, data: drivers });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
};

export const getAgentProducts = async (req: Request, res: Response) => {
  try {
    const stationId = await getAgentStationId(req);
    if (!stationId)
      return res.status(400).json({ success: false, error: "Agent has no station" });
    const products = await productRepo().find({
      where: { stationId },
      order: { createdAt: "DESC" },
    });
    res.json({ success: true, data: products });
  } catch (error) {
    console.error("getAgentProducts error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

export const getAgentDashboard = async (req: Request, res: Response) => {
  try {
    const stationId = await getAgentStationId(req);
    if (!stationId)
      return res.status(400).json({ success: false, error: "Agent has no station" });

    const [orders, drivers, products] = await Promise.all([
      orderRepo().find({
        where: { stationId } as any,
        order: { createdAt: "DESC" },
        relations: ["user", "station", "deliveries"],
      } as any),
      userRepo().find({ where: { role: "driver", stationId, isActive: true } as any }),
      productRepo().find({ where: { stationId } }),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = orders.filter((order: any) => new Date(order.createdAt) >= today);
    const pendingOrders = orders.filter((order: any) =>
      ["pending", "confirmed", "driver_assigned"].includes(order.status)
    ).length;
    const totalOrderValue = orders.reduce((sum: number, order: any) => sum + Number(order.totalAmount || 0), 0);
    const todayOrderValue = todayOrders.reduce((sum: number, order: any) => sum + Number(order.totalAmount || 0), 0);
    const todayRevenue = todayOrders
      .filter((order: any) => order.paymentStatus === "paid")
      .reduce((sum: number, order: any) => sum + Number(order.totalAmount || 0), 0);
    const outstandingCash = orders
      .filter((order: any) => order.paymentStatus === "pending" && !["cancelled", "failed", "refunded"].includes(order.status))
      .reduce((sum: number, order: any) => sum + Number(order.totalAmount || 0), 0);

    res.json({
      success: true,
      data: {
        totalOrders: orders.length,
        todayOrders: todayOrders.length,
        pendingOrders,
        totalDrivers: drivers.length,
        totalProducts: products.length,
        totalRevenue: totalOrderValue,
        totalOrderValue,
        todayOrderValue,
        todayRevenue,
        outstandingCash,
        recentOrders: orders.slice(0, 6),
      },
    });
  } catch (error) {
    console.error("getAgentDashboard error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

export const createAgentDriver = async (req: Request, res: Response) => {
  try {
    const stationId = await getAgentStationId(req);
    if (!stationId)
      return res.status(400).json({ success: false, error: "Agent has no station" });
    const { name, email, phone, password, vehicleNumber, vehicleType } = req.body;
    const cleanName = typeof name === "string" ? name.trim() : "";
    const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const cleanPhone = typeof phone === "string" ? phone.trim() : "";
    if (!cleanName || !cleanEmail || !cleanPhone || typeof password !== "string") {
      return res.status(400).json({
        success: false,
        error: "Name, email, phone, and a unique password are required",
      });
    }
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: "Driver password must be at least 8 characters",
      });
    }

    const repo = userRepo();
    const existing = await repo.findOne({
      where: [{ email: cleanEmail }, { phone: cleanPhone }],
    } as any);
    if (existing)
      return res.status(409).json({ success: false, error: "A user already exists with this email or phone" });
    const hashed = await bcrypt.hash(password, 12);
    const driver = repo.create({
      name: cleanName, email: cleanEmail, phone: cleanPhone,
      password: hashed,
      role: "driver",
      stationId,
      vehicleNumber,
      vehicleType,
      driverStatus: "offline",
      isActive: true,
    } as any);
    const result: any = await repo.save(driver);
    const saved = Array.isArray(result) ? result[0] : result;
    res.status(201).json({
      success: true,
      driver: {
        id: saved.id, name: saved.name, email: saved.email,
        phone: saved.phone, role: saved.role,
        vehicleNumber: saved.vehicleNumber,
        vehicleType: saved.vehicleType,
        stationId: saved.stationId,
      },
    });
  } catch (error) {
    console.error("createAgentDriver error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

export const assignDriverToOrder = async (req: Request, res: Response) => {
  try {
    const orderId = req.params.id;
    const { driverId } = req.body;
    const { order, error } = await verifyStationOrder(req, orderId);
    if (error || !order) {
      return res
        .status(error === "Not your station order" ? 403 : 404)
        .json({ success: false, error: error || "Order not found" });
    }

    const stationId = await getAgentStationId(req);
    const driver = await userRepo().findOne({
      where: { id: driverId, role: "driver", stationId },
    } as any);
    if (!driver) {
      return res.status(400).json({ success: false, error: "Driver not found at this station" });
    }
    if ((driver as any).driverStatus !== "online") {
      return res.status(400).json({ success: false, error: "Driver is not online" });
    }

    const dRepo = deliveryRepo();
    const existing = await dRepo.findOne({ where: { orderId } } as any);
    let delivery: Delivery;

    if (existing) {
      await dRepo.update(
        (existing as any).id,
        { driverId, driverName: driver.name, driverPhone: driver.phone, status: "driver_assigned" } as any
      );
      const updated = await dRepo.findOne({ where: { orderId } } as any);
      if (!updated) throw new Error("Delivery assignment could not be reloaded");
      delivery = updated;
    } else {
      const created = dRepo.create({
        orderId,
        driverId,
        driverName: driver.name,
        driverPhone: driver.phone,
        status: "driver_assigned",
      } as any);
      const result: any = await dRepo.save(created);
      delivery = Array.isArray(result) ? result[0] : result;
    }

    await orderRepo().update(orderId, { status: "driver_assigned" } as any);

    const orderLabel = order.id.slice(0, 8).toUpperCase();
    await createSystemNotification({
      type: "driver_assigned",
      orderId: order.id,
      stationId: order.stationId,
      title: "New Delivery Assigned",
      message: `Order #${orderLabel} has been assigned to you.`,
      data: {
        orderId: order.id,
        customerName: (order as any).user?.name,
        deliveryAddress: order.deliveryAddress,
      },
      notifyAdmin: true,
      notifyAgent: true,
      notifyDriver: true,
      userId: driver.id,
    });

    await createSystemNotification({
      type: "driver_assigned",
      orderId: order.id,
      stationId: order.stationId,
      title: "Driver Assigned",
      message: `${driver.name} has been assigned to deliver order #${orderLabel}.`,
      data: { orderId: order.id, driverId: driver.id, driverName: driver.name, phone: driver.phone },
      notifyCustomer: true,
      userId: order.userId,
    });

    // Keep the legacy event for older installed driver builds. New clients use
    // the persisted notification above so it also appears in notification history.
    const io = (req as any).io || req.app.get("io");
    if (io) {
      io.to(`driver_${driverId}`).emit("new_order_assigned", { orderId: order.id });
    }

    return res.status(existing ? 200 : 201).json({ success: true, delivery });
  } catch (error) {
    console.error("assignDriverToOrder error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

export const cancelOrder = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { order, error } = await verifyStationOrder(req, orderId);
    if (error || !order) {
      return res
        .status(error === "Not your station order" ? 403 : 404)
        .json({ success: false, error: error || "Order not found" });
    }
    if (!["pending", "confirmed"].includes((order as any).status)) {
      return res.status(400).json({ success: false, error: "Order cannot be cancelled at this stage" });
    }
    await orderRepo().update(orderId, {
      status: "cancelled",
      cancellationReason: req.body.reason || "Cancelled by agent",
    } as any);
    const items = (order as any).items || [];
    for (const item of items) {
      const prod = await productRepo().findOne({ where: { id: item.productId } } as any);
      if (prod) {
        (prod as any).stock += item.quantity;
        await productRepo().save(prod);
      }
    }
    res.json({ success: true, message: "Order cancelled" });
  } catch (error) {
    console.error("cancelOrder error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};


export const updateAgentDriverStatus = async (req: Request, res: Response) => {
  try {
    const stationId = await getAgentStationId(req);
    if (!stationId) {
      return res.status(400).json({ success: false, error: "Agent has no station" });
    }

    const { id } = req.params;
    const { status } = req.body;
    if (!["online", "offline"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Agents can set a driver to online or offline only.",
      });
    }

    const driver = await userRepo().findOne({
      where: { id, role: "driver", stationId },
    } as any);
    if (!driver) {
      return res.status(404).json({ success: false, error: "Driver not found at this station" });
    }

    if (["busy", "on_break"].includes(String(driver.driverStatus || ""))) {
      return res.status(409).json({
        success: false,
        error: "This driver is busy or on break. Their current status cannot be overridden.",
      });
    }

    if (status === "offline") {
      const activeDelivery = await deliveryRepo().findOne({
        where: { driverId: id, status: In(["pending", "driver_assigned", "picked_up", "in_transit", "nearby"]) } as any,
      });
      if (activeDelivery) {
        return res.status(409).json({
          success: false,
          error: "This driver has an active assignment. Complete or release that delivery before setting them offline.",
        });
      }
    }

    driver.driverStatus = status as any;
    await userRepo().save(driver);

    res.json({
      success: true,
      data: {
        id: driver.id,
        name: driver.name,
        driverStatus: driver.driverStatus,
        stationId: driver.stationId,
      },
      message: `${driver.name} is now ${status}.`,
    });
  } catch (error) {
    console.error("updateAgentDriverStatus error:", error);
    res.status(500).json({ success: false, error: "Failed to update driver availability" });
  }
};
