import { Request, Response } from "express";
import { In } from "typeorm";
import bcrypt from "bcryptjs";
import AppDataSource from "../config/database";
import { User } from "../entities/User";
import { Order } from "../entities/Order";
import { Delivery } from "../entities/Delivery";
import { Product } from "../entities/Product";

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
  try {
    return await orderRepo().find({
      where,
      relations: ["deliveries", "user", "station", "items", "items.product"],
      order: { createdAt: "DESC" },
    } as any);
  } catch {
    try {
      return await orderRepo().find({
        where,
        relations: ["deliveries", "user", "station"],
        order: { createdAt: "DESC" },
      } as any);
    } catch {
      return await orderRepo().find({
        where,
        order: { createdAt: "DESC" },
      } as any);
    }
  }
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
    const orders = await orderRepo().find({ where: { stationId } } as any);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = orders.filter((o: any) => new Date(o.createdAt) >= today);
    const totalRevenue = orders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);
    const pendingOrders = orders.filter((o: any) => o.status === "pending").length;
    const drivers = await userRepo().find({ where: { role: "driver", stationId } } as any);
    const products = await productRepo().find({ where: { stationId } });
    res.json({
      success: true,
      data: {
        totalOrders: orders.length,
        todayOrders: todayOrders.length,
        totalRevenue,
        pendingOrders,
        totalDrivers: drivers.length,
        totalProducts: products.length,
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
    const repo = userRepo();
    const existing = await repo.findOne({ where: [{ email }, { phone }] } as any);
    if (existing)
      return res.status(400).json({ success: false, error: "Driver already exists" });
    const hashed = await bcrypt.hash(password || "Driver@123", 12);
    const driver = repo.create({
      name, email, phone,
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
    if (existing) {
      await dRepo.update(
        (existing as any).id,
        { driverId, driverName: driver.name, driverPhone: driver.phone, status: "assigned" } as any
      );
      const updated = await dRepo.findOne({ where: { orderId } } as any);
      return res.json({ success: true, delivery: updated });
    }
    const delivery = dRepo.create({
      orderId, driverId, driverName: driver.name,
      driverPhone: driver.phone, status: "assigned",
    } as any);
    const result: any = await dRepo.save(delivery);
    const saved = Array.isArray(result) ? result[0] : result;
    await orderRepo().update(orderId, { status: "driver_assigned" } as any);
    const io = (req as any).io || req.app.get("io");
    if (io) {
      io.to(`driver_${driverId}`).emit("new_order_assigned", { orderId: order.id });
    }
    res.status(201).json({ success: true, delivery: saved });
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
