import { Request, Response } from "express";
import AppDataSource from "../config/database";
import { Order } from "../entities/Order";
import { User } from "../entities/User";
import { Product } from "../entities/Product";
import { Delivery } from "../entities/Delivery";
import { Station } from "../entities/Station";
import bcryptjs from "bcryptjs";

const orderRepository = AppDataSource.getRepository(Order);
const userRepository = AppDataSource.getRepository(User);
const productRepository = AppDataSource.getRepository(Product);
const stationRepository = AppDataSource.getRepository(Station);

// GET /api/admin/dashboard
export const getDashboardStats = async (req: Request, res: Response) => {
	try {
		const { user } = req as any;
		if (user.role !== "admin") {
			return res.status(403).json({ success: false, error: "Admin access only" });
		}

		const totalOrders = await orderRepository.count();
		const pendingOrders = await orderRepository.count({ where: { status: "pending" } });
		const totalDrivers = await userRepository.count({ where: { role: "driver" } });
		const totalProducts = await productRepository.count();
		const totalStations = await stationRepository.count();

		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const todayOrders = await orderRepository
			.createQueryBuilder("order")
			.where("order.createdAt >= :today", { today })
			.andWhere("order.paymentStatus = :status", { status: "paid" })
			.getMany();
		const todayRevenue = todayOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);

		res.json({
			success: true,
			data: {
				totalOrders,
				pendingOrders,
				totalDrivers,
				totalProducts,
				totalStations,
				todayRevenue,
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
			relations: ["items", "items.product", "user", "station", "deliveries"],
			order: { createdAt: "DESC" },
		});

		res.json({ success: true, data: orders });
	} catch (error: any) {
		res.status(500).json({ success: false, error: error.message });
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
			select: ["id", "name", "email", "phone", "createdAt"],
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

// POST /api/admin/orders/:id/cancel - Admin cancels order
export const cancelOrder = async (req: Request, res: Response) => {
  try {
    const { user } = req as any;
    if (user.role !== "admin") {
      return res.status(403).json({ success: false, error: "Admin access only" });
    }

    const { id } = req.params;
    const { reason } = req.body;

    const order = await orderRepository.findOne({
      where: { id },
      relations: ["items", "items.product"],
    });

    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    if (!["pending", "confirmed", "driver_assigned"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        error: "Order cannot be cancelled at this stage",
      });
    }

    order.status = "cancelled";
    order.cancellationReason = reason || "Cancelled by admin";
    await orderRepository.save(order);

    // Restore stock
    for (const item of order.items) {
      const product = await productRepository.findOne({ where: { id: item.productId } });
      if (product) {
        product.stock += item.quantity;
        await productRepository.save(product);
      }
    }

    res.json({ success: true, data: order, message: "Order cancelled" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
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

		const order = await orderRepository.findOne({ where: { id }, relations: ["station"] });
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

		const { name, address, latitude, longitude, phone, email, agentName, agentPassword } =
			req.body;

		if (!email) {
			return res
				.status(400)
				.json({ success: false, error: "Station email is required for agent login" });
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
			isActive: true,
		});

		await stationRepository.save(station);

		// Create agent using station email as login
		const hashedPassword = await bcryptjs.hash(agentPassword || "Agent@123", 12);

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
			message: "Station and agent created successfully. Agent logs in with station email.",
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

				return { ...station, agents: agents };
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
		const { name, address, latitude, longitude, phone, email, isActive } = req.body;

		const station = await stationRepository.findOne({ where: { id } });
		if (!station) {
			return res.status(404).json({ success: false, error: "Station not found" });
		}

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
		station.isActive = isActive !== undefined ? isActive : station.isActive;

		await stationRepository.save(station);

		// Update agent email if station email changed
		if (email && email !== station.email) {
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

		// Check if email already exists
		const existing = await userRepository.findOne({ where: { email } });
		if (existing) {
			return res.status(400).json({ success: false, error: "Email already in use" });
		}

		const hashedPassword = await bcryptjs.hash(password || "Agent@123", 12);

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
				password: password || "Agent@123",
			},
			message: "Agent added to station successfully",
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
