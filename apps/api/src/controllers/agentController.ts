import { Request, Response } from "express";
import { In } from "typeorm";
import bcrypt from "bcryptjs";
import AppDataSource from "../config/database";
import { User } from "../entities/User";
import { Order } from "../entities/Order";
import { Delivery } from "../entities/Delivery";
import { Product } from "../entities/Product";
import { Station } from "../entities/Station";
import { isStationEligibleForLocation } from "../services/stationRegionService";
import { createSystemNotification } from "../services/notificationService";
import { previewStationDataCleanup, clearStationTransactionalData } from "../services/stationDataCleanupService";

const userRepo = () => AppDataSource.getRepository(User);
const orderRepo = () => AppDataSource.getRepository(Order);
const deliveryRepo = () => AppDataSource.getRepository(Delivery);
const productRepo = () => AppDataSource.getRepository(Product);
const stationRepo = () => AppDataSource.getRepository(Station);

const getAgentStationId = async (req: Request): Promise<string | null> => {
  const agentId = (req as any).userId;
  const agent = await userRepo().findOne({
    where: { id: agentId },
    relations: ["station"],
  });
  if (!agent) return null;
  return (agent as any).stationId || (agent as any).station?.id || null;
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
  // Order.stationId is the historical fulfilment owner. Product.stationId can
  // change after a sale, so it must not hide valid historical orders or block
  // driver assignment. Cancellation still checks stock ownership before restocking.
  if (!order.station || !isStationEligibleForLocation(order.station, {
    latitude: order.deliveryLatitude,
    longitude: order.deliveryLongitude,
    city: order.deliveryCity,
    address: order.deliveryAddress,
  })) {
    return { order: null, error: "This customer's delivery location is outside your station's region and nearby service area." };
  }
  return { order };
};

const fetchOrdersWithDeliveries = async (where: any): Promise<Order[]> => {
  return orderRepo().find({
    where,
    relations: ["deliveries", "user", "station", "items", "items.product"],
    order: { createdAt: "DESC" },
  } as any);
};

const isSafeAgentOrder = (order: any, stationId: string, station: Station): boolean => {
  const correctStation = order.stationId === stationId;
  // Product ownership is mutable inventory metadata. A completed order remains
  // associated with the station recorded on the order, even if stock is later moved.
  const correctRegion = isStationEligibleForLocation(station, {
    latitude: order.deliveryLatitude ?? order.user?.latitude,
    longitude: order.deliveryLongitude ?? order.user?.longitude,
    city: order.deliveryCity || order.user?.city,
    address: order.deliveryAddress || order.user?.address,
  });
  return correctStation && correctRegion;
};

export const getAgentCustomers = async (req: Request, res: Response) => {
  try {
    const stationId = await getAgentStationId(req);
    if (!stationId)
      return res.status(400).json({ success: false, error: "Agent has no station" });
    const station = await stationRepo().findOne({ where: { id: stationId } });
    if (!station) return res.status(400).json({ success: false, error: "Agent station is unavailable." });
    const stationOrders = await orderRepo().find({
      where: { stationId, isArchived: false },
      relations: ["user", "items", "items.product"],
    } as any);
    const orders = stationOrders.filter((order: any) => isSafeAgentOrder(order, stationId, station));
    const customerIds = [...new Set(orders.map((o: any) => o.userId))].filter(Boolean);
    const customers = customerIds.length > 0 ? await userRepo().find({
      where: { id: In(customerIds) },
      select: ["id", "name", "email", "phone", "address", "city", "latitude", "longitude", "createdAt"],
    } as any) : [];
    const eligibleCustomers = customers.filter((customer: any) =>
      isStationEligibleForLocation(station, {
        latitude: customer.latitude,
        longitude: customer.longitude,
        city: customer.city,
        address: customer.address,
      })
    );
    res.json({ success: true, data: eligibleCustomers });
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
    const station = await stationRepo().findOne({ where: { id: stationId } });
    if (!station) return res.status(400).json({ success: false, error: "Agent station is unavailable." });
    const orders = await fetchOrdersWithDeliveries({ stationId, isArchived: false });
    const safeOrders = orders.filter((order: any) => isSafeAgentOrder(order, stationId, station));
    const mismatchedOrders = safeOrders.filter((order: any) =>
      (order.items || []).some((item: any) =>
        item.product?.stationId && item.product.stationId !== stationId
      )
    );
    res.json({
      success: true,
      data: safeOrders,
      meta: {
        stationId,
        // Historical orders are returned using Order.stationId as the source
        // of truth. This count is informational and does not withhold the order.
        ordersWithHistoricalProductStationMismatch: mismatchedOrders.length,
      },
    });
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

    const [station, stationOrders, drivers, products] = await Promise.all([
      stationRepo().findOne({ where: { id: stationId } }),
      orderRepo().find({
        where: { stationId, isArchived: false } as any,
        order: { createdAt: "DESC" },
        relations: ["user", "station", "deliveries", "items", "items.product"],
      } as any),
      userRepo().find({ where: { role: "driver", stationId, isActive: true } as any }),
      productRepo().find({ where: { stationId } }),
    ]);
    if (!station) return res.status(400).json({ success: false, error: "Agent station is unavailable." });
    const orders = stationOrders.filter((order: any) => isSafeAgentOrder(order, stationId, station));

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
    if (order.isArchived || !["pending", "confirmed"].includes(order.status) || (order.deliveries || []).length > 0) {
      return res.status(409).json({ success: false, error: "Only unassigned pending or confirmed orders can receive a driver." });
    }
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
  const runner = AppDataSource.createQueryRunner();
  await runner.connect();
  await runner.startTransaction();
  try {
    const orderId = req.params.id || req.params.orderId;
    const { order, error } = await verifyStationOrder(req, orderId);
    if (error || !order) {
      await runner.rollbackTransaction();
      return res.status(error === "Not your station order" ? 403 : 404)
        .json({ success: false, error: error || "Order not found" });
    }
    const lockedOrder = await runner.manager.findOne(Order, {
      where: { id: orderId },
      relations: ["items", "items.product", "deliveries"],
      lock: { mode: "pessimistic_write" },
    } as any);
    if (!lockedOrder || lockedOrder.stationId !== order.stationId) {
      await runner.rollbackTransaction();
      return res.status(404).json({ success: false, error: "Order not found at this station." });
    }
    if (lockedOrder.isArchived || !["pending", "confirmed"].includes(lockedOrder.status) ||
        (lockedOrder.deliveries || []).length > 0) {
      await runner.rollbackTransaction();
      return res.status(409).json({
        success: false,
        error: "Orders can only be cancelled before a driver is assigned. This order already has an assignment or has moved forward.",
      });
    }
    const movedStock = (lockedOrder.items || []).some(item =>
      item.product && item.product.stationId !== lockedOrder.stationId
    );
    if (movedStock) {
      await runner.rollbackTransaction();
      return res.status(409).json({
        success: false,
        error: "This historical order contains stock now assigned to another station. An administrator must reconcile stock before cancellation.",
      });
    }
    const actor = (req as any).user || {};
    lockedOrder.status = "cancelled";
    lockedOrder.cancellationReason = typeof req.body?.reason === "string" && req.body.reason.trim()
      ? req.body.reason.trim().slice(0, 1000)
      : "Cancelled by station agent";
    await runner.manager.save(lockedOrder);
    for (const item of lockedOrder.items || []) {
      const product = await runner.manager.findOne(Product, {
        where: { id: item.productId },
        lock: { mode: "pessimistic_write" },
      } as any);
      if (product) {
        product.stock += item.quantity;
        await runner.manager.save(product);
      }
    }
    await runner.commitTransaction();
    await createSystemNotification({
      type: "cancelled",
      orderId: lockedOrder.id,
      stationId: lockedOrder.stationId,
      title: "Order Cancelled",
      message: `Order #${lockedOrder.id.slice(0, 8).toUpperCase()} was cancelled by the station agent.`,
      data: { orderId: lockedOrder.id, reason: lockedOrder.cancellationReason, cancelledBy: actor.role || "agent" },
      notifyAdmin: true,
      notifyAgent: true,
      notifyCustomer: true,
      userId: lockedOrder.userId,
    });
    return res.json({ success: true, data: lockedOrder, message: "Order cancelled and stock restored." });
  } catch (error) {
    if (runner.isTransactionActive) await runner.rollbackTransaction();
    console.error("cancelOrder error:", error);
    return res.status(500).json({ success: false, error: "Could not cancel this order." });
  } finally {
    await runner.release();
  }
};


export const updateAgentDriver = async (req: Request, res: Response) => {
  try {
    const stationId = await getAgentStationId(req);
    if (!stationId) return res.status(400).json({ success: false, error: "Agent has no station" });

    const { id } = req.params;
    const { name, email, phone, password, vehicleNumber, vehicleType } = req.body;
    const driver = await userRepo().findOne({
      where: { id, role: "driver", stationId },
    } as any);
    if (!driver) return res.status(404).json({ success: false, error: "Driver not found at this station" });

    const cleanName = typeof name === "string" ? name.trim() : driver.name;
    const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : driver.email;
    const cleanPhone = typeof phone === "string" ? phone.trim() : driver.phone;
    if (!cleanName || !cleanEmail || !cleanPhone) {
      return res.status(400).json({ success: false, error: "Name, email and phone are required." });
    }

    const duplicate = await userRepo().findOne({
      where: [{ email: cleanEmail }, { phone: cleanPhone }],
    } as any);
    if (duplicate && duplicate.id !== driver.id) {
      return res.status(409).json({ success: false, error: "Another account already uses this email or phone." });
    }
    if (password !== undefined && password !== "") {
      if (typeof password !== "string" || password.length < 8) {
        return res.status(400).json({ success: false, error: "Password must be at least 8 characters." });
      }
      driver.password = await bcrypt.hash(password, 12);
    }

    driver.name = cleanName;
    driver.email = cleanEmail;
    driver.phone = cleanPhone;
    if (vehicleNumber !== undefined) driver.vehicleNumber = vehicleNumber || null;
    if (vehicleType !== undefined) driver.vehicleType = vehicleType || null;

    await userRepo().save(driver);
    return res.json({
      success: true,
      data: {
        id: driver.id, name: driver.name, email: driver.email, phone: driver.phone,
        vehicleNumber: driver.vehicleNumber, vehicleType: driver.vehicleType,
        driverStatus: driver.driverStatus, stationId: driver.stationId,
      },
    });
  } catch (error: any) {
    console.error("updateAgentDriver error:", error);
    return res.status(500).json({ success: false, error: error.message || "Failed to update driver." });
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


// Station agents can only preview and clear transactional history for their
// own assigned station. Inventory, staff, customers and wallet balances remain.
export const previewAgentStationData = async (req: Request, res: Response) => {
  try {
    const stationId = await getAgentStationId(req);
    if (!stationId) return res.status(400).json({ success: false, error: "Agent has no assigned station." });
    const preview = await previewStationDataCleanup(stationId);
    if (!preview) return res.status(404).json({ success: false, error: "Station not found." });
    return res.json({ success: true, data: preview });
  } catch (error) {
    console.error("[StationCleanup] Agent preview failed:", error);
    return res.status(500).json({ success: false, error: "Could not preview station data cleanup." });
  }
};

export const clearAgentStationData = async (req: Request, res: Response) => {
  try {
    const stationId = await getAgentStationId(req);
    if (!stationId) return res.status(400).json({ success: false, error: "Agent has no assigned station." });
    const preview = await previewStationDataCleanup(stationId);
    if (!preview) return res.status(404).json({ success: false, error: "Station not found." });
    if (req.body?.confirmStationName !== preview.station.name ||
        req.body?.confirmation !== `CLEAR ${preview.station.name}`) {
      return res.status(400).json({ success: false, error: "Type the exact station name and confirmation phrase to continue." });
    }
    const deleted = await clearStationTransactionalData(stationId);
    return res.json({
      success: true,
      station: { id: preview.station.id, name: preview.station.name },
      deleted,
      preserved: ["station", "products and current stock", "product catalogue", "customers", "agents and drivers", "wallet balances", "unrelated transactions and notifications"],
      message: `Transactional history cleared for your station, ${preview.station.name}.`,
    });
  } catch (error) {
    console.error("[StationCleanup] Agent clear failed:", error);
    return res.status(500).json({ success: false, error: "Station data cleanup failed; no partial cleanup was committed." });
  }
};
