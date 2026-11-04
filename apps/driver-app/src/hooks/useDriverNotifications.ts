import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSocket, initializeSocket } from '../services/socketService';
import * as Notifications from 'expo-notifications';
import { Vibration } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';
const MAX_NOTIFICATIONS = 100;
const alertedNotificationIds = new Set<string>();

async function alertDriver(payload: any) {
  const id = String(payload?.id || '');
  if (!id || alertedNotificationIds.has(id)) return;
  alertedNotificationIds.add(id);
  if (alertedNotificationIds.size > 300) {
    const oldest = alertedNotificationIds.values().next().value;
    if (oldest) alertedNotificationIds.delete(oldest);
  }
  Vibration.vibrate([0, 500, 180, 500, 180, 650]);
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: payload.title || 'GasMobil notification',
        body: payload.message || 'You have a new update.',
        sound: 'default',
        data: { orderId: payload.orderId || payload.data?.orderId },
      },
      trigger: null,
    });
  } catch (error) {
    console.warn('[DriverNotif] Could not display phone notification:', error);
  }
}

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
  const receivedNotificationIdsRef = useRef(new Set<string>());

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
        (json.data as DriverNotification[]).forEach((item) => receivedNotificationIdsRef.current.add(item.id));
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

  // Socket listeners. The driver Home and Notifications screens share one
  // socket, so cleanup must remove only this hook instance's handlers.
  useEffect(() => {
    let disposed = false;
    let socketCheckInterval: NodeJS.Timeout | undefined;
    let activeSocket: ReturnType<typeof getSocket> = null;

    const handleNotification = (payload: any) => {
      const id = payload?.id;
      if (typeof id !== 'string' || id.length !== 36) {
        fetchNotifications();
        return;
      }

      const newNotif: DriverNotification = {
        id,
        type: payload.type || 'system_announcement',
        title: payload.title || 'Notification',
        message: payload.message || '',
        isRead: !!payload.isRead,
        createdAt: payload.createdAt || new Date().toISOString(),
        orderId: payload.orderId || payload.data?.orderId || null,
        data: payload.data,
      };

      const isNewForThisHook = !receivedNotificationIdsRef.current.has(id);
      receivedNotificationIdsRef.current.add(id);
      setNotifications((prev) => {
        if (prev.some((item) => item.id === id)) return prev;
        return [newNotif, ...prev].slice(0, MAX_NOTIFICATIONS);
      });
      if (isNewForThisHook && !newNotif.isRead) {
        setUnreadCount((prev) => prev + 1);
      }
      void alertDriver(payload);
    };

    const handleLegacyAssignment = () => {
      // Older API builds emit this event without a database ID. Reload the
      // stored notification rather than inventing an ID that cannot be read.
      fetchNotifications();
    };

    const setupSocketListeners = async () => {
      let socket = getSocket();
      if (!socket) socket = await initializeSocket();
      if (disposed || !socket) return;
      activeSocket = socket;

      socket.on('notification', handleNotification);
      socket.on('new_order_assigned', handleLegacyAssignment);
      socket.on('order_status_changed', handleNotification);

      socketCheckInterval = setInterval(() => {
        if (!getSocket()?.connected) fetchNotifications();
      }, 30000);
    };

    void setupSocketListeners();
    void fetchNotifications();

    return () => {
      disposed = true;
      if (socketCheckInterval) clearInterval(socketCheckInterval);
      activeSocket?.off('notification', handleNotification);
      activeSocket?.off('new_order_assigned', handleLegacyAssignment);
      activeSocket?.off('order_status_changed', handleNotification);
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