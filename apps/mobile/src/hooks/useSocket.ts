import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";

const rawUrl = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000";
const SOCKET_URL = rawUrl.replace(/\/api\/?$/, "");

export function useSocket(onNotification?: (data: any) => void) {
  const socketRef = useRef<Socket | null>(null);

  const connect = useCallback(async () => {
    const token = await AsyncStorage.getItem("access_token");
    if (!token) return;

    const socket = io(SOCKET_URL, {
      transports: ["polling", "websocket"],
      auth: { token },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socket.on("connect", () => {
      console.log("[Socket] Connected:", socket.id);
    });

    socket.on("notification", (data) => {
      console.log("[Socket] Notification:", data);
      onNotification?.(data);
    });

    socket.on("order_status_changed", (data) => {
      console.log("[Socket] Order status:", data);
      onNotification?.(data);
    });

    socket.on("product_created", (data) => {
      console.log("[Socket] Product created:", data);
      onNotification?.({ type: "product_created", ...data });
    });

    socket.on("product_updated", (data) => {
      console.log("[Socket] Product updated:", data);
      onNotification?.({ type: "product_updated", ...data });
    });

    socket.on("product_deleted", (data) => {
      console.log("[Socket] Product deleted:", data);
      onNotification?.({ type: "product_deleted", ...data });
    });

    socket.on("disconnect", (reason) => {
      console.log("[Socket] Disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
      console.error("[Socket] Connect error:", err.message);
    });

    socketRef.current = socket;
  }, [onNotification]);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { socket: socketRef.current, connect, disconnect };
}
