import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

let socket: Socket | null = null;

export const initializeSocket = async (): Promise<Socket | null> => {
  try {
    const token = await AsyncStorage.getItem('driver_token');
    if (!token) return null;

    const rawUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';
    // Remove /api suffix if present for socket connection
    const API_URL = rawUrl.replace(/\/api$/, '').replace(/\/api\/$/, '');

    socket = io(API_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('Driver socket connected:', socket?.id);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connect error:', err.message);
    });

    socket.on('disconnect', () => {
      console.log('Driver socket disconnected');
    });

    return socket;
  } catch (error) {
    console.error('Socket init error:', error);
    return null;
  }
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
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
    console.warn('Socket not connected, location update dropped');
  }
};

export const emitStatusChange = (status: string) => {
  if (socket?.connected) {
    socket.emit('driver_status_change', { status });
  }
};

export const onNewOrder = (callback: (data: any) => void) => {
  if (socket) {
    socket.on('new_order_assigned', callback);
  }
};

export const removeListeners = () => {
  if (socket) {
    socket.off('new_order_assigned');
  }
};
