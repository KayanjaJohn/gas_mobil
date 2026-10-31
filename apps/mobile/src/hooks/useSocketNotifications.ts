import { useEffect, useState } from "react";
import { initializeSocket, getSocket } from "../services/socketService";
import { useNotificationStore } from "../store/useNotificationStore";

export function useSocketNotifications() {
  const addNotification = useNotificationStore((state) => state.addNotification);
  const fetchNotifications = useNotificationStore((state) => state.fetchNotifications);
  const [isConnected, setIsConnected] = useState(!!getSocket()?.connected);

  useEffect(() => {
    let mounted = true;
    let activeSocket: ReturnType<typeof getSocket> = null;

    const attach = async () => {
      const connectedSocket = await initializeSocket();
      if (!mounted || !connectedSocket) return;
      activeSocket = connectedSocket;

      const onConnect = () => {
        setIsConnected(true);
        fetchNotifications();
      };
      const onDisconnect = () => setIsConnected(false);
      const onConnectError = () => setIsConnected(false);
      const onNotification = (payload: any) => {
        if (payload?.id) {
          addNotification({
            id: payload.id,
            type: payload.type || "system_announcement",
            title: payload.title || "Notification",
            message: payload.message || "",
            isRead: !!payload.isRead,
            createdAt: payload.createdAt || new Date().toISOString(),
            orderId: payload.orderId,
            data: payload.data,
          });
        } else {
          fetchNotifications();
        }
      };

      activeSocket.on("connect", onConnect);
      activeSocket.on("disconnect", onDisconnect);
      activeSocket.on("connect_error", onConnectError);
      activeSocket.on("notification", onNotification);
      activeSocket.on("admin_notification", onNotification);
      activeSocket.on("system_broadcast", onNotification);
      activeSocket.on("order_status_changed", onNotification);
      activeSocket.on("payment_completed", onNotification);
      setIsConnected(activeSocket.connected);
      if (activeSocket.connected) fetchNotifications();

      // Store exact handlers for safe cleanup.
      cleanup = () => {
        activeSocket?.off("connect", onConnect);
        activeSocket?.off("disconnect", onDisconnect);
        activeSocket?.off("connect_error", onConnectError);
        activeSocket?.off("notification", onNotification);
        activeSocket?.off("admin_notification", onNotification);
        activeSocket?.off("system_broadcast", onNotification);
        activeSocket?.off("order_status_changed", onNotification);
        activeSocket?.off("payment_completed", onNotification);
      };
    };

    let cleanup = () => {};
    attach();
    return () => {
      mounted = false;
      cleanup();
    };
  }, [addNotification, fetchNotifications]);

  return { socket: getSocket(), isConnected };
}
