import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSocket, initializeSocket } from '../services/socketService';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';
const MAX_NOTIFICATIONS = 100;

export interface DriverNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  orderId?: string | null;
  data?: any;
}

export function useDriverNotifications() {
  const [notifications, setNotifications] = useState<DriverNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('driver_token');
      if (!token) return;
      setLoading(true);
      const res = await fetch(`${API_URL}/notifications?page=1&limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success && json.data) {
        setNotifications(json.data);
        setUnreadCount(json.meta?.unreadCount || 0);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    try {
      const token = await AsyncStorage.getItem('driver_token');
      if (!token) return;
      await fetch(`${API_URL}/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err: any) {
      console.error('[DriverNotif] markAsRead error:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('driver_token');
      if (!token) return;
      await fetch(`${API_URL}/notifications/read-all`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err: any) {
      console.error('[DriverNotif] markAllAsRead error:', err);
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      const token = await AsyncStorage.getItem('driver_token');
      if (!token) return;
      await fetch(`${API_URL}/notifications/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => {
        const removed = prev.find((n) => n.id === id);
        if (removed && !removed.isRead) setUnreadCount((c) => Math.max(0, c - 1));
        return prev.filter((n) => n.id !== id);
      });
    } catch (err: any) {
      console.error('[DriverNotif] delete error:', err);
    }
  }, []);

  // Socket listeners
  useEffect(() => {
    let socketCheckInterval: NodeJS.Timeout;

    const setupSocketListeners = async () => {
      // Ensure socket is initialized
      let socket = getSocket();
      if (!socket) {
        socket = await initializeSocket();
      }
      if (!socket) return;

      const handleNotification = (payload: any) => {
        console.log('[DriverNotif] Socket event:', payload.type || payload.title);
        if (payload.id && typeof payload.id === 'string' && payload.id.length === 36) {
          const newNotif: DriverNotification = {
            id: payload.id,
            type: payload.type || 'system_announcement',
            title: payload.title || 'Notification',
            message: payload.message || '',
            isRead: false,
            createdAt: payload.createdAt || new Date().toISOString(),
            orderId: payload.orderId,
            data: payload.data,
          };
          setNotifications((prev) => {
            const next = [newNotif, ...prev];
            return next.slice(0, MAX_NOTIFICATIONS);
          });
          setUnreadCount((prev) => prev + 1);
        } else {
          fetchNotifications();
        }
      };

      socket.on('notification', handleNotification);
      socket.on('new_order_assigned', (payload) => {
        handleNotification({
          ...payload,
          type: 'new_order_assigned',
          title: 'New Order Assigned',
          message: `Order #${payload.orderId?.slice(0, 8)} assigned to you`,
        });
      });
      socket.on('order_status_changed', handleNotification);

      // Poll as fallback when socket is disconnected
      socketCheckInterval = setInterval(() => {
        const s = getSocket();
        if (!s?.connected) {
          fetchNotifications();
        }
      }, 30000);
    };

    setupSocketListeners();
    fetchNotifications();

    return () => {
      if (socketCheckInterval) clearInterval(socketCheckInterval);
      const socket = getSocket();
      if (socket) {
        socket.off('notification');
        socket.off('new_order_assigned');
        socket.off('order_status_changed');
      }
    };
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: fetchNotifications,
  };
}