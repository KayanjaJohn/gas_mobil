import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import { apiRequest } from "../../src/services/api";
import { useSocketNotifications } from "../../src/hooks/useSocketNotifications";
import TopBar from "../../src/components/TopBar";
import BottomNav from "../../src/components/BottomNav";
import { COLORS } from "../../src/utils/constants";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  orderId: string | null;
  isRead: boolean;
  createdAt: string;
}

const ICONS: Record<string, string> = {
  order_placed: "🛒",
  order_confirmed: "✅",
  driver_assigned: "🚚",
  picked_up: "📦",
  in_transit: "🚛",
  nearby: "📍",
  delivered: "🏠",
  cancelled: "❌",
  payment_received: "💰",
  payment_failed: "💳",
  wallet_debited: "💸",
  wallet_credited: "💵",
  driver_status_changed: "🚗",
  system_announcement: "📢",
  refund_processed: "↩️",
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isConnected } = useSocketNotifications();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await apiRequest<{
        success: boolean;
        data?: NotificationItem[];
        meta?: { unreadCount: number };
      }>("get", "/notifications?page=1&limit=50");
      if (res.success && res.data) {
        setNotifications(Array.isArray(res.data) ? res.data : []);
        setUnreadCount(res.meta?.unreadCount || 0);
      }
    } catch (err) {
      console.error("[Notifications] Fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  /**
   * HIGH FIX: isConnected is now a stable boolean from useSocketNotifications.
   * The dependency array is safe because isConnected is a primitive value,
   * not a function reference.
   */
  useEffect(() => {
    fetchNotifications();

    const setupPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (!isConnected) {
        intervalRef.current = setInterval(fetchNotifications, 30000);
      }
    };

    setupPolling();

    const checkInterval = setInterval(setupPolling, 10000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      clearInterval(checkInterval);
    };
  }, [fetchNotifications, isConnected]);

  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));

    try {
      await apiRequest("patch", `/notifications/${id}/read`);
    } catch (err) {
      console.error("[Notifications] Mark read error:", err);
      fetchNotifications();
    }
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      await apiRequest("patch", "/notifications/read-all");
    } catch (err) {
      console.error("[Notifications] Mark all read error:", err);
      fetchNotifications();
    }
  };

  const deleteNotification = async (id: string) => {
    const removed = notifications.find((n) => n.id === id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (removed && !removed.isRead) {
      setUnreadCount((c) => Math.max(0, c - 1));
    }

    try {
      await apiRequest("delete", `/notifications/${id}`);
    } catch (err) {
      console.error("[Notifications] Delete error:", err);
      fetchNotifications();
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  return (
    <View style={styles.container}>
      <TopBar title="Notifications" showBack onBack={() => router.back()} />

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1484FF" />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>
              Mark all as read ({unreadCount})
            </Text>
          </TouchableOpacity>
        )}

        {loading ? (
          <ActivityIndicator style={{ marginTop: 60 }} color="#1484FF" />
        ) : notifications.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptySub}>
              You'll see updates about your orders here.
            </Text>
          </View>
        ) : (
          notifications.map((n) => (
            <TouchableOpacity
              key={n.id}
              onPress={() => {
                if (!n.isRead) markAsRead(n.id);
                if (n.orderId) router.push(`/tracking?orderId=${n.orderId}`);
              }}
              style={[styles.item, !n.isRead && styles.itemUnread]}
            >
              <View style={styles.iconBox}>
                <Text>{ICONS[n.type] || "🔔"}</Text>
              </View>
              <View style={styles.content}>
                <Text style={[styles.title, !n.isRead && styles.titleUnread]}>
                  {n.title}
                </Text>
                <Text style={styles.message}>{n.message}</Text>
                <Text style={styles.time}>
                  {new Date(n.createdAt).toLocaleString()}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => deleteNotification(n.id)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={{ color: "#8A93A6", fontSize: 18 }}>×</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#070b14" },
  markAllBtn: { marginHorizontal: 16, marginTop: 12, marginBottom: 4, alignSelf: "flex-end" },
  markAllText: { color: "#1484FF", fontSize: 12, fontWeight: "600" },
  empty: { alignItems: "center", marginTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { color: "#fff", fontSize: 16, fontWeight: "600" },
  emptySub: { color: "#8A93A6", fontSize: 13, marginTop: 4, textAlign: "center" },
  item: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: "#101723",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1F2A3D",
  },
  itemUnread: {
    borderColor: "#1484FF",
    backgroundColor: "rgba(20,132,255,0.06)",
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  content: { flex: 1 },
  title: { color: "#fff", fontSize: 14, fontWeight: "600" },
  titleUnread: { fontWeight: "700" },
  message: { color: "#8A93A6", fontSize: 12, marginTop: 3, lineHeight: 18 },
  time: { color: "#475569", fontSize: 10, marginTop: 6 },
});