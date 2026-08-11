import { io, Socket } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";

let socket: Socket | null = null;

export const initializeSocket = async (): Promise<Socket | null> => {
  try {
    // CRITICAL FIX: was "customer_token" — AuthContext stores as "access_token"
    const token = await AsyncStorage.getItem("access_token");
    if (!token) {
      console.log("[Socket] No access_token found, skipping init");
      return null;
    }

    const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace("/api", "");
    if (!API_URL) {
      console.warn("[Socket] API URL not configured");
      return null;
    }

    console.log("[Socket] Initializing socket to:", API_URL);

    socket = io(API_URL, {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socket.on("connect", () => console.log("[Socket] Connected"));
    socket.on("disconnect", (reason) => console.log("[Socket] Disconnected:", reason));
    socket.on("connect_error", (err) => console.error("[Socket] Connection error:", err.message));

    return socket;
  } catch (error) {
    console.error("[Socket] Init error:", error);
    return null;
  }
};

export const getSocket = () => socket;
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinOrderRoom = (orderId: string) => {
  if (socket) socket.emit("join_order", orderId);
};

export const leaveOrderRoom = (orderId: string) => {
  if (socket) socket.emit("leave_order", orderId);
};

export const onDriverLocationUpdate = (callback: (data: any) => void) => {
  if (socket) socket.on("driver_location_update", callback);
};

export const onOrderStatusUpdate = (callback: (data: any) => void) => {
  if (socket) socket.on("order_status_update", callback);
};

export const removeAllListeners = () => {
  if (socket) {
    socket.removeAllListeners("driver_location_update");
    socket.removeAllListeners("order_status_update");
  }
};