import { Server as SocketServer } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import AppDataSource from "./database";
import { User } from "../entities/User";
import { Order } from "../entities/Order";
import { Delivery } from "../entities/Delivery";

interface DecodedToken {
  userId?: string;
  id?: string;
  email?: string;
  name?: string;
  role?: string;
}

interface DriverLocationPayload {
  orderId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

let io: SocketServer;

const driverLocationRateLimit = new Map<string, number>();
const LOCATION_UPDATE_MIN_INTERVAL_MS = 3000;
const RATE_LIMIT_CLEANUP_INTERVAL_MS = 60000;

const isUuid = (value: unknown): value is string =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const isValidCoordinates = (latitude: unknown, longitude: unknown) =>
  typeof latitude === "number" &&
  Number.isFinite(latitude) &&
  latitude >= -90 &&
  latitude <= 90 &&
  typeof longitude === "number" &&
  Number.isFinite(longitude) &&
  longitude >= -180 &&
  longitude <= 180;

const cleanupRateLimits = setInterval(() => {
  const now = Date.now();
  for (const [driverId, timestamp] of driverLocationRateLimit.entries()) {
    if (now - timestamp > LOCATION_UPDATE_MIN_INTERVAL_MS * 10) {
      driverLocationRateLimit.delete(driverId);
    }
  }
}, RATE_LIMIT_CLEANUP_INTERVAL_MS);

// This timer should not keep a test process alive after the server has stopped.
cleanupRateLimits.unref?.();

export const initializeSocket = (server: HttpServer) => {
  io = new SocketServer(server, {
    cors: {
      origin: (origin, callback) => {
        const allowedOrigins =
          process.env.NODE_ENV === "production"
            ? process.env.ALLOWED_ORIGINS?.split(",").map((value) => value.trim()).filter(Boolean) || []
            : [
                "http://localhost:8081",
                "http://localhost:19006",
                "http://localhost:3000",
              ];

        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Verify the token and load the current user record. Database role/status
  // is authoritative; stale JWT role claims are not used for authorization.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token || typeof token !== "string") {
        return next(new Error("Authentication required"));
      }

      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) throw new Error("JWT_SECRET not configured");

      const decoded = jwt.verify(token, jwtSecret) as DecodedToken;
      const userId = decoded.userId || decoded.id;
      if (!userId) return next(new Error("Invalid token payload"));

      const user = await AppDataSource.getRepository(User).findOne({
        where: { id: userId, isActive: true },
      });

      if (!user) return next(new Error("User is unavailable"));

      socket.data.userId = user.id;
      socket.data.userRole = user.role;
      socket.data.userName = user.name;
      socket.data.stationId = user.stationId || null;
      next();
    } catch (error) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const { userId, userRole, userName, stationId } = socket.data;
    console.log(`[Socket] ${userName} (${userRole}) connected: ${socket.id}`);

    socket.join(`user_${userId}`);

    if (userRole === "driver") {
      socket.join("drivers");
      socket.join(`driver_${userId}`);
    } else if (userRole === "admin") {
      socket.join("admins");
    } else if (userRole === "agent" && stationId) {
      socket.join(`station_${stationId}`);
    }

    socket.on("join_station", (requestedStationId: string) => {
      if (!isUuid(requestedStationId)) return;

      const canJoin =
        userRole === "admin" ||
        (userRole === "agent" && stationId === requestedStationId);

      if (!canJoin) {
        socket.emit("authorization_error", {
          event: "join_station",
          message: "You are not authorized to access this station",
        });
        return;
      }

      socket.join(`station_${requestedStationId}`);
    });

    socket.on("leave_station", (requestedStationId: string) => {
      if (!isUuid(requestedStationId)) return;
      if (userRole === "admin" || (userRole === "agent" && stationId === requestedStationId)) {
        socket.leave(`station_${requestedStationId}`);
      }
    });

    // Only order owners, assigned drivers, station agents, and admins may
    // subscribe to an order's private real-time tracking room.
    socket.on("join_order", async (orderId: string) => {
      if (!isUuid(orderId)) {
        socket.emit("authorization_error", {
          event: "join_order",
          message: "Invalid order identifier",
        });
        return;
      }

      try {
        const order = await AppDataSource.getRepository(Order).findOne({
          where: { id: orderId },
          select: { id: true, userId: true, stationId: true },
        });

        if (!order) {
          socket.emit("authorization_error", {
            event: "join_order",
            message: "Order not found",
          });
          return;
        }

        let authorized = userRole === "admin";

        if (userRole === "customer") {
          authorized = order.userId === userId;
        } else if (userRole === "driver") {
          const delivery = await AppDataSource.getRepository(Delivery).findOne({
            where: { orderId, driverId: userId },
            select: { id: true },
          });
          authorized = !!delivery;
        } else if (userRole === "agent") {
          authorized = !!stationId && order.stationId === stationId;
        }

        if (!authorized) {
          socket.emit("authorization_error", {
            event: "join_order",
            message: "You are not authorized to track this order",
          });
          return;
        }

        await socket.join(`order_${orderId}`);
        socket.emit("order_room_joined", { orderId });
      } catch (error) {
        console.error("[Socket] Failed to authorize order room:", error);
        socket.emit("authorization_error", {
          event: "join_order",
          message: "Unable to authorize order tracking",
        });
      }
    });

    socket.on("leave_order", (orderId: string) => {
      if (isUuid(orderId)) socket.leave(`order_${orderId}`);
    });

    socket.on("driver_location_update", async (data: DriverLocationPayload) => {
      if (userRole !== "driver") {
        socket.emit("authorization_error", {
          event: "driver_location_update",
          message: "Only drivers can update delivery location",
        });
        return;
      }

      if (
        !data ||
        !isUuid(data.orderId) ||
        !isValidCoordinates(data.latitude, data.longitude)
      ) {
        socket.emit("location_update_rejected", {
          orderId: data?.orderId,
          message: "Invalid delivery location payload",
        });
        return;
      }

      try {
        // A driver may publish location only for a delivery currently assigned
        // to that driver's authenticated account.
        const delivery = await AppDataSource.getRepository(Delivery).findOne({
          where: { orderId: data.orderId, driverId: userId },
          select: { id: true, orderId: true, status: true },
        });

        if (!delivery || ["delivered", "failed"].includes(delivery.status)) {
          socket.emit("location_update_rejected", {
            orderId: data.orderId,
            message: "No active delivery assigned to this driver",
          });
          return;
        }

        const now = Date.now();
        const lastUpdate = driverLocationRateLimit.get(userId) || 0;
        if (now - lastUpdate < LOCATION_UPDATE_MIN_INTERVAL_MS) return;
        driverLocationRateLimit.set(userId, now);

        const locationData = {
          orderId: delivery.orderId,
          driverId: userId,
          driverName: userName,
          latitude: data.latitude,
          longitude: data.longitude,
          accuracy: typeof data.accuracy === "number" ? data.accuracy : undefined,
          speed: typeof data.speed === "number" ? data.speed : undefined,
          heading: typeof data.heading === "number" ? data.heading : undefined,
          timestamp: new Date().toISOString(),
        };

        io.to(`order_${delivery.orderId}`).emit("location_update", locationData);
        socket.emit("location_confirmed", {
          orderId: delivery.orderId,
          received: true,
        });
      } catch (error) {
        console.error("[Socket] Driver location authorization failed:", error);
        socket.emit("location_update_rejected", {
          orderId: data.orderId,
          message: "Unable to verify delivery assignment",
        });
      }
    });

    socket.on(
      "driver_status_change",
      (data: { status: "online" | "offline" | "busy" | "on_break" }) => {
        if (userRole !== "driver") return;
        if (!data || !["online", "offline", "busy", "on_break"].includes(data.status)) return;

        io.to("admins").emit("driver_status_changed", {
          driverId: userId,
          driverName: userName,
          status: data.status,
          timestamp: new Date().toISOString(),
        });
      }
    );

    socket.on("disconnect", () => {
      console.log(`[Socket] ${userName} disconnected: ${socket.id}`);
      if (userRole === "driver") {
        driverLocationRateLimit.delete(userId);
        io.to("admins").emit("driver_offline", {
          driverId: userId,
          driverName: userName,
          timestamp: new Date().toISOString(),
        });
      }
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};

export const broadcastToOrder = (orderId: string, event: string, data: any) => {
  if (!io) return;
  io.to(`order_${orderId}`).emit(event, data);
};

export const broadcastToUser = (userId: string, event: string, data: any) => {
  if (!io) return;
  io.to(`user_${userId}`).emit(event, data);
};

export const broadcastToAdmins = (event: string, data: any) => {
  if (!io) return;
  io.to("admins").emit(event, data);
};

export const broadcastToDrivers = (event: string, data: any) => {
  if (!io) return;
  io.to("drivers").emit(event, data);
};

export const broadcastToStation = (stationId: string, event: string, data: any) => {
  if (!io) return;
  io.to(`station_${stationId}`).emit(event, data);
};
