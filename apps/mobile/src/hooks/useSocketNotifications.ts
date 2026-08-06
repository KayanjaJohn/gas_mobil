import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNotificationStore } from '../store/useNotificationStore';

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

export function useSocketNotifications() {
  const socketRef = useRef<Socket | null>(null);
  const addNotification = useNotificationStore((s) => s.addNotification);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);
  const isConnectedRef = useRef(false);

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
        isConnectedRef.current = true;
        fetchNotifications(); // Sync on connect
      });

      socket.on('disconnect', (reason) => {
        console.log('[Socket] Disconnected:', reason);
        isConnectedRef.current = false;
      });

      socket.on('connect_error', (err) => {
        console.log('[Socket] Connection error:', err.message);
        isConnectedRef.current = false;
      });

      // ── CRITICAL FIX: On any notification event, REFETCH from API ──
      // This guarantees we always have real DB IDs (not synthetic Date.now() ones)
      const handleNotificationEvent = (payload: any) => {
        console.log('[Socket] Notification event received:', payload.type || payload.title);
        // If the payload has a real UUID id, we can optimistically add it
        if (payload.id && typeof payload.id === 'string' && payload.id.length === 36) {
          addNotification({
            id: payload.id,
            type: payload.type || 'system_announcement',
            title: payload.title || 'Notification',
            message: payload.message || '',
            isRead: false,
            createdAt: payload.createdAt || new Date().toISOString(),
            orderId: payload.orderId,
            data: payload.data,
          });
        } else {
          // No real ID — fetch fresh to avoid "mark as read" 404s
          fetchNotifications();
        }
      };

      socket.on('notification', handleNotificationEvent);
      socket.on('admin_notification', handleNotificationEvent);
      socket.on('system_broadcast', handleNotificationEvent);
      socket.on('order_status_changed', handleNotificationEvent);
      socket.on('payment_completed', handleNotificationEvent);
    };

    connect();

    return () => {
      if (socket) {
        socket.disconnect();
        socketRef.current = null;
        isConnectedRef.current = false;
      }
    };
  }, [addNotification, fetchNotifications]);

  return { socket: socketRef.current, isConnected: () => isConnectedRef.current };
};