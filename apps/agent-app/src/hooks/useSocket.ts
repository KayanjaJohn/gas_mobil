import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";
const SOCKET_URL = /^https?:\/\//i.test(API_BASE_URL)
  ? API_BASE_URL.replace(/\/api\/?$/i, "")
  : window.location.origin;

export function useSocket() {
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const socketRef = useRef<Socket | null>(null);

  const connect = useCallback(() => {
    const token = localStorage.getItem("agent_token");
    if (!token) return;

    if (socketRef.current) {
      socketRef.current.auth = { token };
      if (!socketRef.current.connected) socketRef.current.connect();
      return;
    }

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });

    socket.on("connect", () => {
      console.log("[AgentSocket] Connected");
      setConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("[AgentSocket] Disconnected");
      setConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.warn("[AgentSocket] Connection error:", error.message);
      setConnected(false);
    });

    socket.on("new_order", (data) => {
      setNotifications((prev) => [data, ...prev]);
    });

    socket.on("notification", (data) => {
      setNotifications((prev) => [data, ...prev]);
    });

    socket.on("driver_status_change", (data) => {
      console.log("[AgentSocket] Driver status changed:", data);
    });

    socketRef.current = socket;
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
      setConnected(false);
    }
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  useEffect(() => {
    const onTokenRefreshed = (event: Event) => {
      const nextToken = (event as CustomEvent<{ token?: string }>).detail?.token;
      if (!nextToken) return;
      if (socketRef.current) {
        socketRef.current.auth = { token: nextToken };
        socketRef.current.disconnect();
        socketRef.current.connect();
      } else {
        connect();
      }
    };
    const onSessionExpired = () => disconnect();

    window.addEventListener("gasmobil:token-refreshed", onTokenRefreshed as EventListener);
    window.addEventListener("gasmobil:session-expired", onSessionExpired);
    connect();

    return () => {
      window.removeEventListener("gasmobil:token-refreshed", onTokenRefreshed as EventListener);
      window.removeEventListener("gasmobil:session-expired", onSessionExpired);
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    socket: socketRef.current,
    connected,
    notifications,
    clearNotifications,
    connect,
    disconnect,
  };
}
