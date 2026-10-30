import { io, Socket } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";

let socket: Socket | null = null;
let socketPromise: Promise<Socket | null> | null = null;

const getSocketUrl = () => process.env.EXPO_PUBLIC_API_URL?.replace(/\/api\/?$/, "");

export const initializeSocket = async (): Promise<Socket | null> => {
  if (socket?.connected || socket?.active) return socket;
  if (socketPromise) return socketPromise;

  socketPromise = (async () => {
    try {
      const token = await AsyncStorage.getItem("access_token");
      const apiUrl = getSocketUrl();
      if (!token) {
        console.log("[Socket] No access_token found; connection deferred");
        return null;
      }
      if (!apiUrl) {
        console.warn("[Socket] EXPO_PUBLIC_API_URL is not configured");
        return null;
      }

      if (socket) {
        socket.disconnect();
        socket = null;
      }

      console.log("[Socket] Creating shared connection:", apiUrl);
      socket = io(apiUrl, {
        auth: { token },
        transports: ["polling", "websocket"],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
        timeout: 20000,
      });

      socket.on("connect", () => console.log("[Socket] Connected:", socket?.id));
      socket.on("disconnect", (reason) => console.log("[Socket] Disconnected:", reason));
      socket.on("connect_error", (error) => console.error("[Socket] Connection error:", error.message));
      return socket;
    } catch (error) {
      console.error("[Socket] Initialization failed:", error);
      return null;
    } finally {
      socketPromise = null;
    }
  })();

  return socketPromise;
};

export const getSocket = () => socket;

export const updateSocketToken = async (token: string) => {
  if (!token) return;
  const activeSocket = socket || await initializeSocket();
  if (!activeSocket) return;

  activeSocket.auth = { token };
  if (activeSocket.connected) {
    activeSocket.disconnect();
    activeSocket.connect();
  } else if (!activeSocket.active) {
    activeSocket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
  socketPromise = null;
};

export const joinOrderRoom = (orderId: string) => {
  if (socket?.connected) socket.emit("join_order", orderId);
};

export const leaveOrderRoom = (orderId: string) => {
  if (socket?.connected) socket.emit("leave_order", orderId);
};

export const onDriverLocationUpdate = (callback: (data: any) => void) => {
  socket?.on("location_update", callback);
  socket?.on("driver_location_update", callback);
};

export const onOrderStatusUpdate = (callback: (data: any) => void) => {
  socket?.on("order_status_update", callback);
};

export const removeAllListeners = () => {
  socket?.removeAllListeners("location_update");
  socket?.removeAllListeners("driver_location_update");
  socket?.removeAllListeners("order_status_update");
};
