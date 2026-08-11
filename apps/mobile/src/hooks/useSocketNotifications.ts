import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNotificationStore } from "../store/useNotificationStore";

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5000";

/**
 * HIGH FIX: Returns isConnected as a stable boolean instead of a function.
 * This prevents infinite re-renders in components that use it in useEffect deps.
 */
export function useSocketNotifications() {
  const socketRef = useRef<Socket | null>(null);
  const addNotification = useNotificationStore((s) => s.addNotification);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let socket: Socket;

    const connect = async () => {
      const token = await AsyncStorage.getItem("access_token");
      if (!token) return;

      socket = io(API_URL, {
        auth: { token },
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
      });

      socketRef.current = socket;

      socket.on("connect", () => {
        console.log("[Socket] Connected");
        setIsConnected(true);
        fetchNotifications();
      });

      socket.on("disconnect", (reason) => {
        console.log("[Socket] Disconnected:", reason);
        setIsConnected(false);
      });

      socket.on("connect_error", (err) => {
        console.log("[Socket] Connection error:", err.message);
        setIsConnected(false);
      });

      const handleNotificationEvent = (payload: any) => {
        console.log("[Socket] Notification event received:", payload.type || payload.title);
        if (payload.id && typeof payload.id === "string" && payload.id.length === 36) {
          addNotification({
            id: payload.id,
            type: payload.type || "system_announcement",
            title: payload.title || "Notification",
            message: payload.message || "",
            isRead: false,
            createdAt: payload.createdAt || new Date().toISOString(),
            orderId: payload.orderId,
            data: payload.data,
          });
        } else {
          fetchNotifications();
        }
      };

      socket.on("notification", handleNotificationEvent);
      socket.on("admin_notification", handleNotificationEvent);
      socket.on("system_broadcast", handleNotificationEvent);
      socket.on("order_status_changed", handleNotificationEvent);
      socket.on("payment_completed", handleNotificationEvent);
    };

    connect();

    return () => {
      if (socket) {
        socket.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
    };
  }, [addNotification, fetchNotifications]);

  return { socket: socketRef.current, isConnected };
}