import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNotificationStore } from '../store/useNotificationStore';

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

export function useSocketNotifications() {
  const socketRef = useRef<Socket | null>(null);
  const addNotification = useNotificationStore((s) => s.addNotification);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);

  useEffect(() => {
    let socket: Socket;

    const connect = async () => {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) return;

      socket = io(API_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('[Socket] Connected');
        fetchNotifications();
      });

      socket.on('notification', (payload) => {
        addNotification({
          id: payload.id || `socket_${Date.now()}`,
          type: payload.type,
          title: payload.title,
          message: payload.message,
          isRead: false,
          createdAt: new Date().toISOString(),
          orderId: payload.orderId,
          data: payload.data,
        });
      });

      socket.on('admin_notification', (payload) => {
        addNotification({
          id: `admin_${Date.now()}`,
          type: payload.type,
          title: payload.title,
          message: payload.message,
          isRead: false,
          createdAt: new Date().toISOString(),
          orderId: payload.orderId,
          data: payload.data,
        });
      });

      socket.on('system_broadcast', (payload) => {
        addNotification({
          id: `broadcast_${Date.now()}`,
          type: payload.type || 'system_announcement',
          title: payload.title,
          message: payload.message,
          isRead: false,
          createdAt: new Date().toISOString(),
          data: payload.data,
        });
      });

      socket.on('order_status_changed', (payload) => {
        addNotification({
          id: `status_${Date.now()}`,
          type: payload.status,
          title: payload.title,
          message: payload.message,
          isRead: false,
          createdAt: new Date().toISOString(),
          orderId: payload.orderId,
          data: payload.data,
        });
      });

      socket.on('payment_completed', (payload) => {
        addNotification({
          id: `payment_${Date.now()}`,
          type: 'payment_received',
          title: 'Payment Confirmed',
          message: payload.message,
          isRead: false,
          createdAt: new Date().toISOString(),
          orderId: payload.orderId,
          data: payload.data,
        });
      });

      socket.on('disconnect', (reason) => {
        console.log('[Socket] Disconnected:', reason);
      });

      socket.on('connect_error', (err) => {
        console.log('[Socket] Connection error:', err.message);
      });
    };

    connect();

    return () => {
      if (socket) {
        socket.disconnect();
        socketRef.current = null;
      }
    };
  }, [addNotification, fetchNotifications]);

  return { socket: socketRef.current };
}