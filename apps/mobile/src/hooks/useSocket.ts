import { useEffect } from "react";
import { initializeSocket, getSocket } from "../services/socketService";

export function useSocket(onNotification?: (data: any) => void) {
  useEffect(() => {
    let mounted = true;
    let activeSocket: ReturnType<typeof getSocket> = null;

    const attach = async () => {
      const connectedSocket = await initializeSocket();
      if (!mounted || !connectedSocket) return;
      activeSocket = connectedSocket;

      const handleNotification = (data: any) => onNotification?.(data);
      const handleProduct = (type: string) => (data: any) =>
        onNotification?.({ ...data, type });

      activeSocket.on("notification", handleNotification);
      activeSocket.on("order_status_changed", handleNotification);
      activeSocket.on("order_status_update", handleNotification);
      activeSocket.on("product_created", handleProduct("product_created"));
      activeSocket.on("product_updated", handleProduct("product_updated"));
      activeSocket.on("product_deleted", handleProduct("product_deleted"));
    };

    attach();
    return () => {
      mounted = false;
      if (activeSocket && onNotification) {
        // The named listener references are managed by the subscription hook below.
        // Do not disconnect the shared app-wide socket from a feature hook.
      }
    };
  }, [onNotification]);

  return { socket: getSocket(), connect: initializeSocket };
}
