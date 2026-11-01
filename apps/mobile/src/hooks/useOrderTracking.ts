import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";
import {
  initializeSocket,
  joinOrderRoom,
  leaveOrderRoom,
  getSocket,
} from "../services/socketService";

interface DriverLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  timestamp?: string;
}

interface OrderStatus {
  orderId: string;
  status: string;
  deliveryStatus?: string;
  message?: string;
}

export const useOrderTracking = (orderId: string | null) => {
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null);
  const [isConnected, setIsConnected] = useState(!!getSocket()?.connected);

  useEffect(() => {
    if (!orderId) return;

    let mounted = true;

    // Hydrate the last persisted GPS fix so customers opening tracking mid-journey
    // see the driver's current/last known position before the next socket event.
    apiRequest<any>("get", `/orders/${orderId}`)
      .then((response) => {
        if (!mounted || !response.success || !response.data) return;
        const order: any = response.data;
        const delivery = order.deliveries?.find((item: any) => item.currentLocation) || order.deliveries?.[0];
        const point = delivery?.currentLocation?.location || delivery?.currentLocation;
        const latitude = Number(point?.latitude ?? point?.lat);
        const longitude = Number(point?.longitude ?? point?.lng ?? point?.lon);
        if (Number.isFinite(latitude) && Number.isFinite(longitude) &&
            latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180 &&
            (latitude !== 0 || longitude !== 0)) {
          setDriverLocation({
            latitude,
            longitude,
            accuracy: point.accuracy ?? undefined,
            speed: point.speed ?? undefined,
            heading: point.heading ?? undefined,
            timestamp: point.timestamp || delivery?.updatedAt || new Date().toISOString(),
          });
        }
        if (order.status) {
          setOrderStatus({ orderId, status: order.status });
        }
      })
      .catch((error) => console.warn("[Tracking] Could not hydrate last driver position:", error?.message));

    let activeSocket: Awaited<ReturnType<typeof initializeSocket>> = null;

    const handleLocation = (payload: any) => {
      const location = payload?.location || payload;
      if (payload?.orderId && String(payload.orderId) !== String(orderId)) return;
      const latitude = Number(location?.latitude ?? location?.lat);
      const longitude = Number(location?.longitude ?? location?.lng ?? location?.lon);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
      setDriverLocation({
        latitude,
        longitude,
        accuracy: location.accuracy ?? undefined,
        speed: location.speed ?? undefined,
        heading: location.heading ?? undefined,
        timestamp: location.timestamp || new Date().toISOString(),
      });
    };

    const handleStatus = (payload: any) => {
      if (!payload) return;
      const payloadOrderId = payload.orderId || payload.data?.orderId;
      if (payloadOrderId && String(payloadOrderId) !== String(orderId)) return;
      const status = payload.status || payload.data?.status || payload.data?.deliveryStatus;
      if (!status) return;
      setOrderStatus({
        orderId,
        status,
        deliveryStatus: payload.deliveryStatus || payload.data?.deliveryStatus,
        message: payload.message || payload.data?.message,
      });
    };

    const handleNotification = (payload: any) => {
      if (String(payload?.orderId || payload?.data?.orderId || "") !== String(orderId)) return;
      handleStatus(payload);
    };

    const attach = async () => {
      const connectedSocket = await initializeSocket();
      if (!mounted || !connectedSocket) return;
      activeSocket = connectedSocket;

      const onConnect = () => {
        setIsConnected(true);
        joinOrderRoom(orderId);
      };
      const onDisconnect = () => setIsConnected(false);

      activeSocket.on("connect", onConnect);
      activeSocket.on("disconnect", onDisconnect);
      activeSocket.on("location_update", handleLocation);
      activeSocket.on("driver_location_update", handleLocation);
      activeSocket.on("order_status_update", handleStatus);
      activeSocket.on("order_status_changed", handleStatus);
      activeSocket.on("notification", handleNotification);
      setIsConnected(activeSocket.connected);
      if (activeSocket.connected) joinOrderRoom(orderId);

      cleanup = () => {
        activeSocket?.off("connect", onConnect);
        activeSocket?.off("disconnect", onDisconnect);
        activeSocket?.off("location_update", handleLocation);
        activeSocket?.off("driver_location_update", handleLocation);
        activeSocket?.off("order_status_update", handleStatus);
        activeSocket?.off("order_status_changed", handleStatus);
        activeSocket?.off("notification", handleNotification);
      };
    };

    let cleanup = () => {};
    attach();

    return () => {
      mounted = false;
      leaveOrderRoom(orderId);
      cleanup();
      setIsConnected(false);
    };
  }, [orderId]);

  return { driverLocation, orderStatus, isConnected };
};
