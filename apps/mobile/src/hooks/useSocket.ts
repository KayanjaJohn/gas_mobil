import { useEffect } from "react";
import { initializeSocket, getSocket } from "../services/socketService";

export function useSocket(onNotification?: (data: any) => void) {
  useEffect(() => {
    let mounted = true;
    let activeSocket: ReturnType<typeof getSocket> = null;

    const handleNotification = (data: any) => onNotification?.(data);
    const handleProductCreated = (data: any) =>
      onNotification?.({ ...data, type: "product_created" });
    const handleProductUpdated = (data: any) =>
      onNotification?.({ ...data, type: "product_updated" });
    const handleProductDeleted = (data: any) =>
      onNotification?.({ ...data, type: "product_deleted" });

    const attach = async () => {
      const connectedSocket = await initializeSocket();
      if (!mounted || !connectedSocket) return;
      activeSocket = connectedSocket;

      activeSocket.on("notification", handleNotification);
      activeSocket.on("order_status_changed", handleNotification);
      activeSocket.on("order_status_update", handleNotification);
      activeSocket.on("product_created", handleProductCreated);
      activeSocket.on("product_updated", handleProductUpdated);
      activeSocket.on("product_deleted", handleProductDeleted);
    };

    attach();
    return () => {
      mounted = false;
      activeSocket?.off("notification", handleNotification);
      activeSocket?.off("order_status_changed", handleNotification);
      activeSocket?.off("order_status_update", handleNotification);
      activeSocket?.off("product_created", handleProductCreated);
      activeSocket?.off("product_updated", handleProductUpdated);
      activeSocket?.off("product_deleted", handleProductDeleted);
      // Feature hooks unsubscribe only; the authenticated session owns disconnect.
    };
  }, [onNotification]);

  return { socket: getSocket(), connect: initializeSocket };
}
