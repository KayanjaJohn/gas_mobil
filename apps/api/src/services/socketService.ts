import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

let socket: Socket | null = null;

export const initializeSocket = async (): Promise<Socket | null> => {
  try {
    const token = await AsyncStorage.getItem('auth_token');
    if (!token) return null;

    const API_URL = process.env.API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

    socket = io(API_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket?.id);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    return socket;
  } catch (error) {
    console.error('Socket initialization error:', error);
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

// Join order room for tracking
export const joinOrderRoom = (orderId: string) => {
  if (socket) {
    socket.emit('join_order', orderId);
  }
};

// Leave order room
export const leaveOrderRoom = (orderId: string) => {
  if (socket) {
    socket.emit('leave_order', orderId);
  }
};

// Listen for driver location updates
export const onDriverLocationUpdate = (callback: (data: any) => void) => {
  if (socket) {
    socket.on('driver_location_update', callback);
  }
};

// Listen for order status updates
export const onOrderStatusUpdate = (callback: (data: any) => void) => {
  if (socket) {
    socket.on('order_status_update', callback);
  }
};

// Listen for payment completion
export const onPaymentCompleted = (callback: (data: any) => void) => {
  if (socket) {
    socket.on('payment_completed', callback);
  }
};

// Remove listeners
export const removeAllListeners = () => {
  if (socket) {
    socket.off('driver_location_update');
    socket.off('order_status_update');
    socket.off('payment_completed');
  }
};