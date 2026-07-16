import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

let socket: Socket | null = null;

export const initializeSocket = async (): Promise<Socket | null> => {
  try {
    const token = await AsyncStorage.getItem('driver_token');
    if (!token) return null;

    const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

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
  if (socket) {
    socket.emit('driver_location_update', data);
  }
};

export const emitStatusChange = (status: string) => {
  if (socket) {
    socket.emit('driver_status_change', { status });
  }
};

export const onNewOrder = (callback: (data: any) => void) => {
  socket?.on('new_order_assigned', callback);
};

export const removeListeners = () => {
  socket?.off('new_order_assigned');
};
