import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

let socket: Socket | null = null;

export const initializeSocket = async (): Promise<Socket | null> => {
  try {
    const token = await AsyncStorage.getItem('customer_token');
    if (!token) return null;

    const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

    socket = io(API_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
    });

    socket.on('connect', () => console.log('Customer socket connected'));
    socket.on('disconnect', () => console.log('Customer socket disconnected'));

    return socket;
  } catch (error) {
    console.error('Socket init error:', error);
    return null;
  }
};

export const getSocket = () => socket;
export const disconnectSocket = () => { if (socket) { socket.disconnect(); socket = null; } };
