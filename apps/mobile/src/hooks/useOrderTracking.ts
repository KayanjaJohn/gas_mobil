import { useEffect, useState, useRef } from 'react';
import {
  initializeSocket,
  joinOrderRoom,
  leaveOrderRoom,
  onDriverLocationUpdate,
  onOrderStatusUpdate,
  removeAllListeners,
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
  const socketRef = useRef<any>(null);

  useEffect(() => {
    if (!orderId) {
      console.log('[Tracking] No orderId provided, skipping setup');
      return;
    }

    console.log('[Tracking] Setting up tracking for order:', orderId);

    const setupSocket = async () => {
      const socket = await initializeSocket();
      socketRef.current = socket;
      if (socket) {
        console.log('[Tracking] Socket connected, joining room:', orderId);
        setIsConnected(true);
        joinOrderRoom(orderId);

        onDriverLocationUpdate((data: any) => {
          console.log('[Tracking] Driver location update:', data);
          setDriverLocation(data.location || data);
        });

        onOrderStatusUpdate((data: any) => {
          console.log('[Tracking] Order status update:', data);
          setOrderStatus(data);
        });
      } else {
        console.warn('[Tracking] Socket initialization returned null');
      }
    };

    setupSocket();

    return () => {
      console.log('[Tracking] Cleaning up tracking for order:', orderId);
      if (orderId) {
        leaveOrderRoom(orderId);
      }
      removeAllListeners();
      // ── CRITICAL FIX: Do NOT disconnectSocket() here ──
      // The socket is shared across the app for notifications.
      // Only leave the room and remove listeners.
      setIsConnected(false);
      socketRef.current = null;
    };
  }, [orderId]);

  return {
    driverLocation,
    orderStatus,
    isConnected,
  };
};