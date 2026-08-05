import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  orderId?: string;
  data?: any;
}

export interface NotificationFilters {
  status: 'all' | 'unread' | 'read';
  type: string;
  dateRange: 'today' | 'week' | 'month' | 'all';
}

export function useAgentNotifications(token: string | null) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<NotificationFilters>({
    status: 'all',
    type: 'all',
    dateRange: 'all',
  });
  const socketRef = useRef<Socket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize notification sound
  useEffect(() => {
    audioRef.current = new Audio('/notification-sound.mp3');
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/notifications?page=1&limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setNotifications(json.data);
        setUnreadCount(json.meta?.unreadCount || 0);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const markAsRead = useCallback(async (id: string) => {
    if (!token) return;
    try {
      await fetch(`${API_URL}/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err: any) {
      console.error('markAsRead error:', err);
    }
  }, [token]);

  const markAllAsRead = useCallback(async () => {
    if (!token) return;
    try {
      await fetch(`${API_URL}/api/notifications/read-all`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err: any) {
      console.error('markAllAsRead error:', err);
    }
  }, [token]);

  const deleteNotification = useCallback(async (id: string) => {
    if (!token) return;
    try {
      await fetch(`${API_URL}/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => {
        const removed = prev.find((n) => n.id === id);
        if (removed && !removed.isRead) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
        return prev.filter((n) => n.id !== id);
      });
    } catch (err: any) {
      console.error('deleteNotification error:', err);
    }
  }, [token]);

  // Socket.IO for real-time notifications
  useEffect(() => {
    if (!token) return;

    const socket = io(API_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[AdminSocket] Connected');
    });

    socket.on('admin_notification', (payload) => {
      const newNotif: Notification = {
        id: payload.id || `admin_${Date.now()}`,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        isRead: false,
        createdAt: new Date().toISOString(),
        orderId: payload.orderId,
        data: payload.data,
      };
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);
      audioRef.current?.play().catch(() => {});
    });

    socket.on('notification', (payload) => {
      const newNotif: Notification = {
        id: payload.id || `notif_${Date.now()}`,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        isRead: false,
        createdAt: new Date().toISOString(),
        orderId: payload.orderId,
        data: payload.data,
      };
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);
      audioRef.current?.play().catch(() => {});
    });

    socket.on('new_order', (payload) => {
      const newNotif: Notification = {
        id: `order_${Date.now()}`,
        type: 'order_placed',
        title: 'New Order',
        message: `New order #${payload.orderId?.slice(0, 8).toUpperCase()} from ${payload.customerName}`,
        isRead: false,
        createdAt: new Date().toISOString(),
        orderId: payload.orderId,
        data: payload,
      };
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);
      audioRef.current?.play().catch(() => {});
    });

    socket.on('driver_status_changed', (payload) => {
      const newNotif: Notification = {
        id: `driver_${Date.now()}`,
        type: 'driver_status_changed',
        title: 'Driver Update',
        message: `${payload.driverName} is now ${payload.status}`,
        isRead: false,
        createdAt: new Date().toISOString(),
        data: payload,
      };
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    socket.on('disconnect', () => {
      console.log('[AdminSocket] Disconnected');
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Filtered notifications
  const filteredNotifications = notifications.filter((n) => {
    if (filters.status === 'unread' && n.isRead) return false;
    if (filters.status === 'read' && !n.isRead) return false;
    if (filters.type !== 'all' && n.type !== filters.type) return false;
    if (filters.dateRange !== 'all') {
      const date = new Date(n.createdAt);
      const now = new Date();
      if (filters.dateRange === 'today') {
        return date.toDateString() === now.toDateString();
      }
      if (filters.dateRange === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return date >= weekAgo;
      }
      if (filters.dateRange === 'month') {
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }
    }
    return true;
  });

  return {
    notifications: filteredNotifications,
    allNotifications: notifications,
    unreadCount,
    loading,
    error,
    filters,
    setFilters,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: fetchNotifications,
  };
}