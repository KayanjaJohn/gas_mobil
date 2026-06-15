import { useEffect, useState } from 'react';
import {
  initializeSocket,
  joinOrderRoom,
  leaveOrderRoom,
  onDriverLocationUpdate,
  onOrderStatusUpdate,
  removeAllListeners,
  disconnectSocket,
} from '../services/socketService';

interface DriverLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  timestamp: string;
}

interface OrderStatus {
  orderId: string;
  status: string;
  deliveryStatus: string;
  message: string;
}

export const useOrderTracking = (orderId: string | null) => {
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!orderId) return;

    const setupSocket = async () => {
      const socket = await initializeSocket();
      if (socket) {
        setIsConnected(true);
        joinOrderRoom(orderId);

        onDriverLocationUpdate((data) => {
          setDriverLocation(data.location);
        });

        onOrderStatusUpdate((data) => {
          setOrderStatus(data);
        });
      }
    };

    setupSocket();

    return () => {
      if (orderId) {
        leaveOrderRoom(orderId);
      }
      removeAllListeners();
      disconnectSocket();
      setIsConnected(false);
    };
  }, [orderId]);

  return {
    driverLocation,
    orderStatus,
    isConnected,
  };
};