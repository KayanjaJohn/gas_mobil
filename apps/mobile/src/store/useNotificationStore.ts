import { create } from 'zustand';
import { apiRequest } from '../services/api';

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

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  addNotification: (n: Notification) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  getUnreadCount: () => number;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  addNotification: (n) => {
    set((state) => ({
      notifications: [n, ...state.notifications].slice(0, 100), // keep last 100
      unreadCount: state.unreadCount + (n.isRead ? 0 : 1),
    }));
  },

  markAsRead: async (id) => {
    try {
      await apiRequest('patch', `/notifications/${id}/read`);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (err) {
      console.error('markAsRead error:', err);
    }
  },

  markAllAsRead: async () => {
    try {
      await apiRequest('patch', '/notifications/read-all');
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch (err) {
      console.error('markAllAsRead error:', err);
    }
  },

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const res = await apiRequest('get', '/notifications?page=1&limit=50');
      if (res.success) {
        const unread = (res.data as Notification[]).filter((n) => !n.isRead).length;
        set({
          notifications: res.data as Notification[],
          unreadCount: unread,
          isLoading: false,
        });
      }
    } catch (err) {
      console.error('fetchNotifications error:', err);
      set({ isLoading: false });
    }
  },

  deleteNotification: async (id) => {
    try {
      await apiRequest('delete', `/notifications/${id}`);
      set((state) => {
        const removed = state.notifications.find((n) => n.id === id);
        return {
          notifications: state.notifications.filter((n) => n.id !== id),
          unreadCount: removed && !removed.isRead
            ? Math.max(0, state.unreadCount - 1)
            : state.unreadCount,
        };
      });
    } catch (err) {
      console.error('deleteNotification error:', err);
    }
  },

  getUnreadCount: () => get().unreadCount,
}));