import { Request, Response } from "express";
import { In } from "typeorm";
import AppDataSource from "../config/database";
import { Order } from "../entities/Order";
import { User } from "../entities/User";
import { Product } from "../entities/Product";
import { Delivery } from "../entities/Delivery";
import { Station } from "../entities/Station";
import { StationActivity } from "../entities/StationActivity";
import { inferUgandaRegion } from "../services/stationRegionService";
import bcryptjs from "bcryptjs";
import { previewStationDataCleanup, clearStationTransactionalData } from "../services/stationDataCleanupService";

const orderRepository = AppDataSource.getRepository(Order);
const userRepository = AppDataSource.getRepository(User);
const productRepository = AppDataSource.getRepository(Product);
const stationRepository = AppDataSource.getRepository(Station);

// GET /api/admin/stations/:id/history
export const getStationHistory = async (req: Request, res: Response) => {
  try {
    const { user } = req as any;
    if (user.role !== "admin") return res.status(403).json({ success: false, error: "Admin access only" });

    const { id: stationId } = req.params;
    const station = await stationRepository.findOne({ where: { id: stationId } });
    if (!station) return res.status(404).json({ success: false, error: "Station not found" });

    const { from, to } = req.query;
    const query = AppDataSource.getRepository(StationActivity)
      .createQueryBuilder("activity")
      .where("activity.stationId = :stationId", { stationId });

    if (typeof from === "string") {
      const fromDate = new Date(from);
      if (!Number.isFinite(fromDate.getTime())) {
        return res.status(400).json({ success: false, error: "Invalid start date." });
      }
      query.andWhere("activity.createdAt >= :fromDate", { fromDate });
    }
    if (typeof to === "string") {
      const toDate = new Date(to);
      if (!Number.isFinite(toDate.getTime())) {
        return res.status(400).json({ success: false, error: "Invalid end date." });
      }
      toDate.setHours(23, 59, 59, 999);
      query.andWhere("activity.createdAt <= :toDate", { toDate });
    }

    const history = await query.orderBy("activity.createdAt", "DESC").take(300).getMany();
    return res.json({ success: true, data: { station, history } });
  } catch (error: any) {
    console.error("getStationHistory error:", error);
    return res.status(500).json({ success: false, error: error.message || "Failed to load station history." });
  }
};

// DELETE /api/admin/stations/:id/history
export const clearStationHistory = async (req: Request, res: Response) => {
  try {
    const { user } = req as any;
    if (user.role !== "admin") return res.status(403).json({ success: false, error: "Admin access only" });

    const { id: stationId } = req.params;
    const station = await stationRepository.findOne({ where: { id: stationId } });
    if (!station) return res.status(404).json({ success: false, error: "Station not found" });

    const result = await AppDataSource.getRepository(StationActivity).delete({ stationId });
    return res.json({
      success: true,
      deletedCount: result.affected || 0,
      message: `Station activity history cleared for ${station.name}.`,
    });
  } catch (error: any) {
    console.error("clearStationHistory error:", error);
    return res.status(500).json({ success: false, error: error.message || "Failed to clear station history." });
  }
};

// GET /api/admin/dashboard
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const { user } = req as any;
    if (user.role !== "admin") {
      return res.status(403).json({ success: false, error: "Admin access only" });
    }

    const [totalOrders, pendingOrders, totalDrivers, totalProducts, totalStations, orders, recentOrders] =
      await Promise.all([
        orderRepository.count({ where: { isArchived: false } }),
        orderRepository.count({ where: { isArchived: false, status: In(["pending", "confirmed", "driver_assigned"]) } }),
        userRepository.count({ where: { role: "driver", isActive: true } }),
        productRepository.count(),
        stationRepository.count(),
        orderRepository.find({ where: { isArchived: false }, select: ["id", "totalAmount", "paymentStatus", "status", "createdAt"] }),
        orderRepository.find({
          relations: ["user", "station"],
          order: { createdAt: "DESC" },
          take: 6,
        }),
      ]);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todayOrders = orders.filter((order) => new Date(order.createdAt) >= startOfDay);
    const totalOrderValue = orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
    const todayOrderValue = todayOrders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
    const todayRevenue = todayOrders
      .filter((order) => order.paymentStatus === "paid")
      .reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
    const outstandingCash = orders
      .filter((order) => order.paymentStatus === "pending" && !["cancelled", "failed", "refunded"].includes(order.status))
      .reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);

    res.json({
      success: true,
      data: {
        totalOrders, pendingOrders, totalDrivers, totalProducts, totalStations,
        totalRevenue: totalOrderValue, totalOrderValue, todayOrderValue, todayRevenue,
        outstandingCash, recentOrders,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/admin/orders
export const getAllOrders = async (req: Request, res: Response) => {
	try {
		const { user } = req as any;
		if (user.role !== "admin") {
			return res.status(403).json({ success: false, error: "Admin access only" });
		}

		const orders = await orderRepository.find({
			where: { isArchived: false },
			relations: ["items", "items.product", "user", "station", "deliveries"],
			order: { createdAt: "DESC" },
		});

		res.json({ success: true, data: orders });
	} catch (error: any) {
		res.status(500).json({ success: false, error: error.message });
	}
};

// POST /api/admin/stations/:id/orders/archive
// Archive only closed orders; keep financial and delivery records intact.
export const archiveStationOrders = async (req: Request, res: Response) => {
  const runner = AppDataSource.createQueryRunner();
  await runner.connect();
  await runner.startTransaction();
  try {
    const { user } = req as any;
    if (user.role !== "admin") {
      await runner.rollbackTransaction();
      return res.status(403).json({ success: false, error: "Admin access only." });
    }
    const { id: stationId } = req.params;
    const orderIds = Array.isArray(req.body?.orderIds)
      ? [...new Set(req.body.orderIds.filter((id: unknown) => typeof id === "string" && id.length > 0))]
      : [];
    const reason = typeof req.body?.reason === "string" ? req.body.reason.trim().slice(0, 1000) : "";
    if (!orderIds.length || orderIds.length > 200) {
      await runner.rollbackTransaction();
      return res.status(400).json({ success: false, error: "Select between 1 and 200 orders to archive." });
    }
    const station = await runner.manager.findOne(Station, { where: { id: stationId } });
    if (!station) {
      await runner.rollbackTransaction();
      return res.status(404).json({ success: false, error: "Station not found." });
    }
    const orders = await runner.manager.find(Order, {
      where: { id: In(orderIds), stationId, isArchived: false },
      lock: { mode: "pessimistic_write" },
    } as any);
    if (orders.length !== orderIds.length) {
      await runner.rollbackTransaction();
      return res.status(409).json({ success: false, error: "Some selected orders are missing, already archived, or belong to another station. Refresh and try again." });
    }
    const activeStatuses = ["pending", "confirmed", "driver_assigned", "picked_up", "in_transit", "nearby"];
    const active = orders.filter(order => activeStatuses.includes(order.status));
    if (active.length) {
      await runner.rollbackTransaction();
      return res.status(409).json({
        success: false,
        error: "Active orders cannot be archived. Complete or cancel them first.",
        blockedOrderIds: active.map(order => order.id),
      });
    }
    const archivedAt = new Date();
    for (const order of orders) {
      order.isArchived = true;
      order.archivedAt = archivedAt;
      order.archivedBy = user.id;
      order.archiveReason = reason || "Archived by administrator";
    }
    await runner.manager.save(Order, orders);
    await runner.commitTransaction();
    return res.json({
      success: true,
      data: { stationId, archivedCount: orders.length, orderIds },
      message: `${orders.length} order(s) archived. Their financial and delivery history remains in the database.`,
    });
  } catch (error: any) {
    if (runner.isTransactionActive) await runner.rollbackTransaction();
    console.error("[archiveStationOrders]", error);
    return res.status(500).json({ success: false, error: "Could not archive selected orders." });
  } finally {
    await runner.release();
  }
};

// GET /api/admin/stations/:id/report-orders
// Reports are fetched by the selected station on the server; do not download
// all station orders and rely only on a browser-side filter.
export const getStationReportOrders = async (req: Request, res: Response) => {
  try {
    const { user } = req as any;
    if (user.role !== "admin") {
      return res.status(403).json({ success: false, error: "Admin access only." });
    }

    const { id: stationId } = req.params;
    const station = await stationRepository.findOne({ where: { id: stationId } });
    if (!station) {
      return res.status(404).json({ success: false, error: "The selected station could not be found." });
    }

    const orders = await orderRepository.find({
      where: { stationId, isArchived: false },
      relations: ["items", "items.product", "user", "station", "deliveries"],
      order: { createdAt: "DESC" },
    } as any);

    // Integrity guard: a station report must not include a line item whose
    // inventory belongs to a different station. Keep the excluded count visible
    // to admins so historic data inconsistencies can be investigated.
    const mismatchedOrders = orders.filter((order: any) =>
      order.stationId !== stationId ||
      (order.items || []).some((item: any) =>
        item.product?.stationId && item.product.stationId !== stationId
      )
    );
    const safeOrders = orders.filter((order: any) =>
      order.stationId === stationId &&
      !(order.items || []).some((item: any) =>
        item.product?.stationId && item.product.stationId !== stationId
      )
    );

    return res.json({
      success: true,
      data: safeOrders,
      meta: {
        stationId,
        stationName: station.name,
        totalMatchingOrders: safeOrders.length,
        excludedIntegrityOrders: mismatchedOrders.length,
      },
    });
  } catch (error: any) {
    console.error("[getStationReportOrders] error:", error);
    return res.status(500).json({
      success: false,
      error: "We could not prepare this station report. Please try again.",
    });
  }
};

// GET /api/admin/drivers
export const getAllDrivers = async (req: Request, res: Response) => {
	try {
		const { user } = req as any;
		if (user.role !== "admin") {
			return res.status(403).json({ success: false, error: "Admin access only" });
		}

		const drivers = await userRepository.find({
			where: { role: "driver" },
			relations: ["station"],
			select: [
				"id",
				"name",
				"email",
				"phone",
				"driverStatus",
				"currentLatitude",
				"currentLongitude",
				"lastLocationUpdate",
				"vehicleNumber",
				"vehicleType",
				"stationId",
			],
		});

		res.json({ success: true, data: drivers });
	} catch (error: any) {
		res.status(500).json({ success: false, error: error.message });
	}
};

// GET /api/admin/customers
export const getAllCustomers = async (req: Request, res: Response) => {
	try {
		const { user } = req as any;
		if (user.role !== "admin") {
			return res.status(403).json({ success: false, error: "Admin access only" });
		}

		const customers = await userRepository.find({
			where: { role: "customer" },
			select: ["id", "name", "email", "phone", "address", "city", "createdAt"],
		});

		res.json({ success: true, data: customers });
	} catch (error: any) {
		res.status(500).json({ success: false, error: error.message });
	}
};



// POST /api/admin/drivers - Create driver by admin
export const createDriver = async (req: Request, res: Response) => {
  try {
    const { user } = req as any;
    if (user.role !== "admin") {
      return res.status(403).json({ success: false, error: "Admin access only" });
    }

    const { name, email, phone, password, stationId, vehicleNumber, vehicleType } = req.body;

    if (!name || !email || !phone || !password || !stationId) {
      return res.status(400).json({
        success: false,
        error: "Name, email, phone, password, and stationId are required",
      });
    }
    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({
        success: false,
        error: "Driver password must be at least 8 characters",
      });
    }

    const existing = await userRepository.findOne({ where: [{ email }, { phone }] });
    if (existing) {
      return res.status(400).json({ success: false, error: "Driver already exists" });
    }

    const station = await stationRepository.findOne({ where: { id: stationId } });
    if (!station) {
      return res.status(404).json({ success: false, error: "Station not found" });
    }

    const hashedPassword = await bcryptjs.hash(password, 12);

    const driver = userRepository.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role: "driver",
      stationId,
      vehicleNumber,
      vehicleType,
      driverStatus: "offline",
      isActive: true,
    });

    await userRepository.save(driver);

    res.status(201).json({
      success: true,
      data: {
        id: driver.id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        role: driver.role,
        vehicleNumber: driver.vehicleNumber,
        vehicleType: driver.vehicleType,
        stationId: driver.stationId,
      },
      message: "Driver created successfully",
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// PUT /api/admin/drivers/:id - Edit driver contact, vehicle and station details.
export const updateDriver = async (req: Request, res: Response) => {
  try {
    const { user } = req as any;
    if (user.role !== "admin") {
      return res.status(403).json({ success: false, error: "Admin access only" });
    }

    const { id } = req.params;
    const { name, email, phone, password, stationId, vehicleNumber, vehicleType } = req.body;
    const driver = await userRepository.findOne({ where: { id, role: "driver" } as any });
    if (!driver) {
      return res.status(404).json({ success: false, error: "Driver not found" });
    }

    const cleanName = typeof name === "string" ? name.trim() : driver.name;
    const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : driver.email;
    const cleanPhone = typeof phone === "string" ? phone.trim() : driver.phone;
    if (!cleanName || !cleanEmail || !cleanPhone) {
      return res.status(400).json({ success: false, error: "Name, email and phone are required." });
    }

    const duplicate = await userRepository.findOne({
      where: [{ email: cleanEmail }, { phone: cleanPhone }],
    });
    if (duplicate && duplicate.id !== driver.id) {
      return res.status(409).json({ success: false, error: "Another account already uses this email or phone." });
    }

    if (stationId !== undefined) {
      const station = await stationRepository.findOne({ where: { id: stationId } });
      if (!station) return res.status(404).json({ success: false, error: "Station not found." });
      driver.stationId = stationId;
    }
    if (password !== undefined && password !== "") {
      if (typeof password !== "string" || password.length < 8) {
        return res.status(400).json({ success: false, error: "Password must be at least 8 characters." });
      }
      driver.password = await bcryptjs.hash(password, 12);
    }

    driver.name = cleanName;
    driver.email = cleanEmail;
    driver.phone = cleanPhone;
    if (vehicleNumber !== undefined) driver.vehicleNumber = vehicleNumber || null;
    if (vehicleType !== undefined) driver.vehicleType = vehicleType || null;

    await userRepository.save(driver);
    const updated = await userRepository.findOne({ where: { id: driver.id }, relations: ["station"] });
    return res.json({
      success: true,
      data: updated ? {
        id: updated.id, name: updated.name, email: updated.email,
        phone: updated.phone, vehicleNumber: updated.vehicleNumber,
        vehicleType: updated.vehicleType, stationId: updated.stationId,
        station: updated.station, driverStatus: updated.driverStatus,
      } : null,
    });
  } catch (error: any) {
    console.error("updateDriver error:", error);
    return res.status(500).json({ success: false, error: error.message || "Failed to update driver." });
  }
};

// POST /api/admin/orders/:id/cancel - Admin cancels order
export const cancelOrder = async (req: Request, res: Response) => {
  const runner = AppDataSource.createQueryRunner();
  await runner.connect();
  await runner.startTransaction();
  try {
    const { user } = req as any;
    if (user.role !== "admin") {
      await runner.rollbackTransaction();
      return res.status(403).json({ success: false, error: "Admin access only" });
    }
    const { id } = req.params;
    const reason = typeof req.body?.reason === "string" ? req.body.reason.trim().slice(0, 1000) : "";
    const order = await runner.manager.findOne(Order, {
      where: { id },
      relations: ["items", "items.product", "deliveries"],
      lock: { mode: "pessimistic_write" },
    } as any);
    if (!order) {
      await runner.rollbackTransaction();
      return res.status(404).json({ success: false, error: "Order not found" });
    }
    if (order.isArchived || !["pending", "confirmed"].includes(order.status) || (order.deliveries || []).length > 0) {
      await runner.rollbackTransaction();
      return res.status(409).json({ success: false, error: "This order can only be cancelled before any driver assignment or delivery record exists." });
    }
    const movedStock = (order.items || []).some(item => item.product && item.product.stationId !== order.stationId);
    if (movedStock) {
      await runner.rollbackTransaction();
      return res.status(409).json({ success: false, error: "Inventory ownership has changed. Reconcile stock before cancelling this order." });
    }
    order.status = "cancelled";
    order.cancellationReason = reason || "Cancelled by admin";
    await runner.manager.save(order);
    for (const item of order.items || []) {
      const product = await runner.manager.findOne(Product, { where: { id: item.productId }, lock: { mode: "pessimistic_write" } as any });
      if (product) {
        product.stock += item.quantity;
        await runner.manager.save(product);
      }
    }
    await runner.commitTransaction();
    return res.json({ success: true, data: order, message: "Order cancelled and stock restored." });
  } catch (error: any) {
    if (runner.isTransactionActive) await runner.rollbackTransaction();
    return res.status(500).json({ success: false, error: error.message });
  } finally {
    await runner.release();
  }
};

// POST /api/admin/orders/:id/assign
export const assignDriverToOrder = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const { driverId } = req.body;
		const { user } = req as any;

		if (user.role !== "admin" && user.role !== "agent") {
			return res.status(403).json({ success: false, error: "Access denied" });
		}

		const order = await orderRepository.findOne({ where: { id }, relations: ["station", "deliveries"] });
		if (order && (order.isArchived || !["pending", "confirmed"].includes(order.status) || (order.deliveries || []).length > 0)) {
			return res.status(409).json({ success: false, error: "Only unassigned pending or confirmed orders can receive a driver." });
		}
		if (!order) {
			return res.status(404).json({ success: false, error: "Order not found" });
		}

		if (user.role === "agent" && order.stationId !== user.stationId) {
			return res.status(403).json({ success: false, error: "Not your station order" });
		}

		const driver = await userRepository.findOne({ where: { id: driverId, role: "driver" } });
		if (!driver) {
			return res.status(400).json({ success: false, error: "Driver not found" });
		}

		if (driver.stationId !== order.stationId) {
			return res
				.status(400)
				.json({ success: false, error: "Driver is not from this station" });
		}

		if (driver.driverStatus !== "online") {
			return res.status(400).json({ success: false, error: "Driver is not online" });
		}

		const delivery = new Delivery();
		delivery.orderId = order.id;
		delivery.driverId = driver.id;
		delivery.driverName = driver.name;
		delivery.driverPhone = driver.phone;
		delivery.vehicleNumber = driver.vehicleNumber;
		delivery.status = "pending";

		await AppDataSource.getRepository(Delivery).save(delivery);

		order.status = "driver_assigned";
		await orderRepository.save(order);

		const io = (req as any).io;
		if (io) {
			io.to(`driver_${driver.id}`).emit("new_order_assigned", { orderId: order.id });
		}

		res.json({ success: true, data: order });
	} catch (error: any) {
		res.status(500).json({ success: false, error: error.message });
	}
};

// POST /api/admin/stations - Create station + agent (uses station email for login)
export const createStation = async (req: Request, res: Response) => {
	try {
		const { user } = req as any;
		if (user.role !== "admin") {
			return res.status(403).json({ success: false, error: "Admin access only" });
		}

		const { name, address, latitude, longitude, phone, email, agentName, agentPassword, region } =
			req.body;
		const allowedRegions = ["central", "north", "east", "west", "south"] as const;
		const requestedRegion = allowedRegions.find(
			(candidate) => candidate === String(region || "").toLowerCase()
		);
		const inferredRegion = inferUgandaRegion({ name, address, latitude, longitude });
		const stationRegion: Station["region"] = requestedRegion || inferredRegion || "central";

		if (!name || !address || latitude === undefined || longitude === undefined || !phone || !email || !agentPassword) {
			return res.status(400).json({
				success: false,
				error: "Station details and a unique agent password are required",
			});
		}
		if (typeof agentPassword !== "string" || agentPassword.length < 8) {
			return res.status(400).json({ success: false, error: "Agent password must be at least 8 characters" });
		}

		// Check if station email already exists as agent login
		const existingAgent = await userRepository.findOne({ where: { email } });
		if (existingAgent) {
			return res
				.status(400)
				.json({
					success: false,
					error: "This email is already in use by another station/agent",
				});
		}

		// Create station
		const station = stationRepository.create({
			name,
			address,
			latitude,
			longitude,
			phone,
			email,
			region: stationRegion,
			isActive: true,
		});

		await stationRepository.save(station);

		// Create agent using station email as login
		const hashedPassword = await bcryptjs.hash(agentPassword, 12);

		const agent = userRepository.create({
			name: agentName || `${name} Agent`,
			email: email, // Station email is the login
			phone: phone,
			password: hashedPassword,
			role: "agent",
			stationId: station.id,
			isActive: true,
		});

		await userRepository.save(agent);

		res.status(201).json({
			success: true,
			data: {
				station,
				agent: {
					id: agent.id,
					name: agent.name,
					email: agent.email,
					phone: agent.phone,
					role: agent.role,
					password: agentPassword || "Agent@123",
				},
			},
			message: "Station and agent created successfully. Share the agent's credentials securely.",
		});
	} catch (error: any) {
		res.status(500).json({ success: false, error: error.message });
	}
};

// GET /api/admin/stations - Get all stations with their agents
export const getAllStations = async (req: Request, res: Response) => {
	try {
		const { user } = req as any;
		if (user.role !== "admin") {
			return res.status(403).json({ success: false, error: "Admin access only" });
		}

		const stations = await stationRepository.find({
			order: { createdAt: "DESC" },
		});

		const stationsWithAgents = await Promise.all(
			stations.map(async (station) => {
				const agents = await userRepository.find({
					where: { stationId: station.id, role: "agent" },
					select: ["id", "name", "email", "phone", "isActive", "createdAt"],
				});

				return { ...station, region: inferUgandaRegion(station) ?? station.region, agents: agents };
			}),
		);

		res.json({ success: true, data: stationsWithAgents });
	} catch (error: any) {
		res.status(500).json({ success: false, error: error.message });
	}
};

// PUT /api/admin/stations/:id - Update station
export const updateStation = async (req: Request, res: Response) => {
	try {
		const { user } = req as any;
		if (user.role !== "admin") {
			return res.status(403).json({ success: false, error: "Admin access only" });
		}

		const { id } = req.params;
		const { name, address, latitude, longitude, phone, email, isActive, region } = req.body;

		const station = await stationRepository.findOne({ where: { id } });
		if (!station) {
			return res.status(404).json({ success: false, error: "Station not found" });
		}

		const previousEmail = station.email;

		// If email is changing, check it's not used elsewhere
		if (email && email !== station.email) {
			const existing = await userRepository.findOne({ where: { email } });
			if (existing && existing.stationId !== id) {
				return res
					.status(400)
					.json({ success: false, error: "Email already in use by another station" });
			}
		}

		station.name = name || station.name;
		station.address = address || station.address;
		station.latitude = latitude !== undefined ? latitude : station.latitude;
		station.longitude = longitude !== undefined ? longitude : station.longitude;
		station.phone = phone !== undefined ? phone : station.phone;
		station.email = email !== undefined ? email : station.email;
		if (region !== undefined) {
			if (!["central", "north", "east", "west", "south"].includes(String(region).toLowerCase())) {
				return res.status(400).json({ success: false, error: "Choose Central, North, East, West or South as the station region." });
			}
			station.region = String(region).toLowerCase() as any;
		}
		station.isActive = isActive !== undefined ? isActive : station.isActive;

		await stationRepository.save(station);

		// Update agent email if station email changed
		if (email && email !== previousEmail) {
			await userRepository.update({ stationId: id, role: "agent" }, { email: email });
		}

		res.json({ success: true, data: station });
	} catch (error: any) {
		res.status(500).json({ success: false, error: error.message });
	}
};

// DELETE /api/admin/stations/:id
export const deleteStation = async (req: Request, res: Response) => {
	try {
		const { user } = req as any;
		if (user.role !== "admin") {
			return res.status(403).json({ success: false, error: "Admin access only" });
		}

		const { id } = req.params;
		const station = await stationRepository.findOne({ where: { id } });
		if (!station) {
			return res.status(404).json({ success: false, error: "Station not found" });
		}

		station.isActive = false;
		await stationRepository.save(station);

		await userRepository.update({ stationId: id, role: "agent" }, { isActive: false });

		res.json({ success: true, message: "Station and its agents deactivated" });
	} catch (error: any) {
		res.status(500).json({ success: false, error: error.message });
	}
};

// PUT /api/admin/agents/:id - Update agent credentials
export const updateAgent = async (req: Request, res: Response) => {
	try {
		const { user } = req as any;
		if (user.role !== "admin") {
			return res.status(403).json({ success: false, error: "Admin access only" });
		}

		const { id } = req.params;
		const { name, password, isActive } = req.body;

		const agent = await userRepository.findOne({ where: { id, role: "agent" } });
		if (!agent) {
			return res.status(404).json({ success: false, error: "Agent not found" });
		}

		if (name) agent.name = name;
		if (isActive !== undefined) agent.isActive = isActive;

		if (password) {
			if (typeof password !== "string" || password.length < 8) {
				return res.status(400).json({ success: false, error: "Agent password must be at least 8 characters" });
			}
			const hashedPassword = await bcryptjs.hash(password, 12);
			agent.password = hashedPassword;
		}

		await userRepository.save(agent);

		res.json({
			success: true,
			data: {
				id: agent.id,
				name: agent.name,
				email: agent.email,
				isActive: agent.isActive,
				stationId: agent.stationId,
			},
			message: password ? "Agent updated with new password" : "Agent updated",
		});
	} catch (error: any) {
		res.status(500).json({ success: false, error: error.message });
	}
};

// POST /api/admin/stations/:id/agents - Add new agent to existing station
export const addAgentToStation = async (req: Request, res: Response) => {
	try {
		const { user } = req as any;
		if (user.role !== "admin") {
			return res.status(403).json({ success: false, error: "Admin access only" });
		}

		const { id } = req.params; // station id
		const { name, email, phone, password } = req.body;

		// Check station exists
		const station = await stationRepository.findOne({ where: { id } });
		if (!station) {
			return res.status(404).json({ success: false, error: "Station not found" });
		}

		if (!email || !password || typeof password !== "string" || password.length < 8) {
			return res.status(400).json({ success: false, error: "Agent email and a password of at least 8 characters are required" });
		}

		// Check if email already exists
		const existing = await userRepository.findOne({ where: { email } });
		if (existing) {
			return res.status(400).json({ success: false, error: "Email already in use" });
		}

		const hashedPassword = await bcryptjs.hash(password, 12);

		const agent = userRepository.create({
			name: name || `${station.name} Agent`,
			email,
			phone: phone || station.phone,
			password: hashedPassword,
			role: "agent",
			stationId: station.id,
			isActive: true,
		});

		await userRepository.save(agent);

		res.status(201).json({
			success: true,
			data: {
				id: agent.id,
				name: agent.name,
				email: agent.email,
				phone: agent.phone,
				role: agent.role,
				stationId: agent.stationId,
			},
			message: "Agent added to station successfully. Share credentials securely.",
		});
	} catch (error: any) {
		res.status(500).json({ success: false, error: error.message });
	}
};

// PUT /api/admin/users/:id/assign-station
export const assignUserToStation = async (req: Request, res: Response) => {
	try {
		const { user } = req as any;
		if (user.role !== "admin") {
			return res.status(403).json({ success: false, error: "Admin access only" });
		}

		const { id } = req.params;
		const { stationId } = req.body;

		const targetUser = await userRepository.findOne({ where: { id } });
		if (!targetUser) {
			return res.status(404).json({ success: false, error: "User not found" });
		}

		targetUser.stationId = stationId;
		await userRepository.save(targetUser);

		res.json({ success: true, data: targetUser });
	} catch (error: any) {
		res.status(500).json({ success: false, error: error.message });
	}
};


// GET /api/admin/stations/:id/data-cleanup-preview
export const previewStationData = async (req: Request, res: Response) => {
  try {
    const preview = await previewStationDataCleanup(req.params.id);
    if (!preview) return res.status(404).json({ success: false, error: "Station not found." });
    return res.json({ success: true, data: preview });
  } catch (error) {
    console.error("[StationCleanup] Admin preview failed:", error);
    return res.status(500).json({ success: false, error: "Could not preview station data cleanup." });
  }
};

// POST /api/admin/stations/:id/clear-data
export const clearStationData = async (req: Request, res: Response) => {
  try {
    const preview = await previewStationDataCleanup(req.params.id);
    if (!preview) return res.status(404).json({ success: false, error: "Station not found." });
    if (req.body?.confirmStationName !== preview.station.name ||
        req.body?.confirmation !== `CLEAR ${preview.station.name}`) {
      return res.status(400).json({ success: false, error: "Type the exact station name and confirmation phrase to continue." });
    }
    const deleted = await clearStationTransactionalData(req.params.id);
    return res.json({
      success: true,
      station: { id: preview.station.id, name: preview.station.name },
      deleted,
      preserved: ["station", "products and current stock", "product catalogue", "customers", "agents and drivers", "wallet balances", "unrelated transactions and notifications"],
      message: `Transactional test history cleared for ${preview.station.name}. Station setup and inventory were preserved.`,
    });
  } catch (error) {
    console.error("[StationCleanup] Admin clear failed:", error);
    return res.status(500).json({ success: false, error: "Station data cleanup failed; no partial cleanup was committed." });
  }
};
