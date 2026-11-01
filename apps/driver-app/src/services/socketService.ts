import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

let socket: Socket | null = null;
let socketPromise: Promise<Socket | null> | null = null;

export const initializeSocket = async (): Promise<Socket | null> => {
  if (socket?.connected || socket?.active) return socket;
  if (socketPromise) return socketPromise;

  socketPromise = (async () => {
    try {
      const token = await AsyncStorage.getItem('driver_token');
      if (!token) return null;

      const rawUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';
      const apiUrl = rawUrl.replace(/\/api\/?$/, '');

      socket = io(apiUrl, {
        auth: { token },
        transports: ['polling', 'websocket'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
        timeout: 20000,
      });

      socket.on('connect', () => console.log('[DriverSocket] Connected:', socket?.id));
      socket.on('connect_error', (err) => console.error('[DriverSocket] Connection error:', err.message));
      socket.on('disconnect', (reason) => console.log('[DriverSocket] Disconnected:', reason));

      return socket;
    } catch (error) {
      console.error('[DriverSocket] Initialization error:', error);
      return null;
    } finally {
      socketPromise = null;
    }
  })();

  return socketPromise;
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
  socketPromise = null;
};

export const emitLocation = (data: {
  orderId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
}) => {
  if (socket?.connected) {
    socket.emit('driver_location_update', data);
  } else {
    console.warn('[DriverSocket] Not connected; location update will be retried on next GPS fix.');
  }
};

export const emitStatusChange = (status: string) => {
  if (socket?.connected) socket.emit('driver_status_change', { status });
};

export const onNewOrder = (callback: (data: any) => void) => {
  socket?.on('new_order_assigned', callback);
  return () => socket?.off('new_order_assigned', callback);
};

export const removeListeners = () => {
  socket?.off('new_order_assigned');
};
