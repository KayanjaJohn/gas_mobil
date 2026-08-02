import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import { apiRequest } from "../../src/services/api";
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
  delivered: "🏠",
  cancelled: "❌",
  payment_received: "💰",
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await apiRequest<{ notifications: NotificationItem[]; meta: { unreadCount: number } }>("get", "/notifications");
      if (res.success && res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.meta?.unreadCount || 0);
      }
    } catch (err) {
      console.error("[Notifications] Fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      await apiRequest("patch", `/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error("[Notifications] Mark read error:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiRequest("patch", "/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("[Notifications] Mark all read error:", err);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await apiRequest("delete", `/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error("[Notifications] Delete error:", err);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  return (
    <View style={styles.container}>
      <TopBar title="Notifications" />

      {unreadCount > 0 && (
        <TouchableOpacity style={styles.markAllBtn} onPress={markAllAsRead} activeOpacity={0.8}>
          <Text style={styles.markAllText}>Mark all as read ({unreadCount})</Text>
        </TouchableOpacity>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
      >
        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={COLORS.accent} />
        ) : notifications.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptySub}>You'll see updates about your orders here.</Text>
          </View>
        ) : (
          notifications.map((n) => (
            <TouchableOpacity
              key={n.id}
              style={[styles.item, !n.isRead && styles.itemUnread]}
              onPress={() => {
                if (!n.isRead) markAsRead(n.id);
                if (n.orderId) router.push(`/tracking?orderId=${n.orderId}`);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.iconBox}>
                <Text style={{ fontSize: 22 }}>{ICONS[n.type] || "🔔"}</Text>
              </View>
              <View style={styles.content}>
                <Text style={[styles.title, !n.isRead && styles.titleUnread]}>{n.title}</Text>
                <Text style={styles.message} numberOfLines={2}>{n.message}</Text>
                <Text style={styles.time}>{new Date(n.createdAt).toLocaleString()}</Text>
              </View>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => deleteNotification(n.id)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={{ color: COLORS.muted, fontSize: 18 }}>×</Text>
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
  container: { flex: 1, backgroundColor: COLORS.bg },
  markAllBtn: { marginHorizontal: 16, marginTop: 12, marginBottom: 4, alignSelf: "flex-end" },
  markAllText: { color: COLORS.accent, fontSize: 12, fontWeight: "600" },
  empty: { alignItems: "center", marginTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { color: "#fff", fontSize: 16, fontWeight: "600" },
  emptySub: { color: COLORS.muted, fontSize: 13, marginTop: 4, textAlign: "center" },
  item: { flexDirection: "row", alignItems: "flex-start", marginHorizontal: 16, marginBottom: 10, backgroundColor: COLORS.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: COLORS.border },
  itemUnread: { borderColor: COLORS.accent, backgroundColor: "rgba(20,132,255,0.06)" },
  iconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: "#0f172a", alignItems: "center", justifyContent: "center", marginRight: 12 },
  content: { flex: 1 },
  title: { color: "#fff", fontSize: 14, fontWeight: "600" },
  titleUnread: { fontWeight: "700" },
  message: { color: COLORS.muted, fontSize: 12, marginTop: 3, lineHeight: 18 },
  time: { color: "#475569", fontSize: 10, marginTop: 6 },
  deleteBtn: { padding: 4, marginLeft: 4 },
});