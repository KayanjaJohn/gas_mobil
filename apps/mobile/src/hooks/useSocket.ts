import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000";

export function useSocket(onNotification?: (data: any) => void) {
  const socketRef = useRef<Socket | null>(null);

  const connect = useCallback(async () => {
    const token = await AsyncStorage.getItem("access_token");
    if (!token) return;

    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      auth: { token },
    });

    socket.on("connect", () => {
      console.log("[Socket] Connected");
    });

    socket.on("notification", (data) => {
      console.log("[Socket] Notification:", data);
      onNotification?.(data);
    });

    socket.on("order_status_changed", (data) => {
      console.log("[Socket] Order status:", data);
      onNotification?.(data);
    });

    socket.on("disconnect", () => {
      console.log("[Socket] Disconnected");
    });

    socket.on("connect_error", (err) => {
      console.error("[Socket] Error:", err.message);
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