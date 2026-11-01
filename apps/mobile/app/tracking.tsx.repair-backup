import React, { useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import TopBar from "../src/components/TopBar";
import BottomNav from "../src/components/BottomNav";
import { LiveTrackingMap } from "../src/components/LiveTrackingMap";
import { COLORS } from "../src/utils/constants";
import { apiRequest } from "../src/services/api";
import { useOrderTracking } from "../src/hooks/useOrderTracking";

const STATUS_MAP: Record<string, { label: string; icon: string; done: boolean }> = {
  pending: { label: "Order confirmed", icon: "✓", done: true },
  confirmed: { label: "Order confirmed", icon: "✓", done: true },
  driver_assigned: { label: "Driver assigned", icon: "🚚", done: true },
  picked_up: { label: "Picked up from station", icon: "📦", done: true },
  in_transit: { label: "On the way", icon: "🚚", done: true },
  nearby: { label: "Driver nearby", icon: "📍", done: true },
  delivered: { label: "Delivered", icon: "🏠", done: true },
  cancelled: { label: "Cancelled", icon: "✕", done: false },
};

const TIMELINE_KEYS = ["pending", "picked_up", "in_transit", "delivered"];

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  deliveryAddress?: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  createdAt: string;
  deliveries?: Array<{
    driverName?: string;
    driverPhone?: string;
    vehicleNumber?: string;
    status?: string;
  }>;
}

export default function TrackingScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // ── SOCKET TRACKING (only when orderId is present) ──
  const { driverLocation, orderStatus, isConnected } = useOrderTracking(orderId || null);

  const fetchOrder = async () => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<{ success: boolean; data: Order; error?: string }>("get", `/orders/${orderId}`);
      if (res.success && res.data) {
        setOrder(res.data);
        setError(null);
      } else {
        setError(res.error || "Order not found");
      }
    } catch (err: any) {
      console.error("[Tracking] Fetch error:", err);
      setError(err?.response?.data?.error || err?.message || "Failed to load order");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await apiRequest<{ success: boolean; data: Order[]; error?: string }>("get", "/orders");
      if (res.success && res.data) {
        const active = res.data.filter((o: Order) => o.status !== "delivered" && o.status !== "cancelled");
        setOrders(active);
      }
    } catch (err: any) {
      console.error("[Tracking] Fetch orders error:", err);
    } finally {
      setOrdersLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrder();
      // ── No more HTTP polling every 10s — socket handles real-time updates ──
    } else {
      fetchOrders();
    }
  }, [orderId]);

  // Update local order status when socket pushes an update
  useEffect(() => {
    if (orderStatus && order) {
      setOrder((prev) => (prev ? { ...prev, status: orderStatus.status || prev.status } : prev));
    }
  }, [orderStatus]);

  const getTimeline = () => {
    const status = order?.status || "pending";
    const statusIndex = TIMELINE_KEYS.indexOf(status);
    return TIMELINE_KEYS.map((key, i) => {
      const mapped = STATUS_MAP[key] || { label: key, icon: "•", done: false };
      const isDone = i <= statusIndex && status !== "cancelled";
      return {
        status: mapped.label,
        icon: mapped.icon,
        done: isDone,
        time: isDone ? (i === statusIndex ? "Just now" : "Completed") : "—",
      };
    });
  };

  const timeline = getTimeline();

  const navigateToOrderTracking = (id: string) => {
    router.push(`/tracking?orderId=${id}`);
  };

  const activeOrder = orderId && order;
  const hasDeliveryCoords = activeOrder && order.deliveryLatitude && order.deliveryLongitude;

  return (
    <View style={styles.container}>
      <TopBar showBack onBack={() => router.push("/(tabs)")} />

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* ── LIVE MAP (replaces mock) ── */}
        {activeOrder && hasDeliveryCoords ? (
          <View style={styles.mapContainer}>
            <LiveTrackingMap
              orderId={order.id}
              deliveryLatitude={order.deliveryLatitude!}
              deliveryLongitude={order.deliveryLongitude!}
            />
            <View style={styles.connectionBadge}>
              <Text style={styles.connectionText}>
                {isConnected ? "🟢 Live" : "🔴 Offline"}
              </Text>
            </View>
          </View>
        ) : activeOrder ? (
          <View style={[styles.mapContainer, styles.mapFallback]}>
            <Text style={styles.mapFallbackText}>🗺️ Waiting for delivery coordinates...</Text>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={COLORS.accent} />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={fetchOrder} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : activeOrder ? (
          <>
            <View style={styles.card}>
              <Text style={styles.orderId}>
                Order #{order.id?.slice(0, 12)?.toUpperCase() || "GM-UNKNOWN"}
              </Text>
              {order.deliveries?.[0]?.driverName && (
                <Text style={styles.driver}>
                  Driver: {order.deliveries[0].driverName}
                  {order.deliveries[0].vehicleNumber ? ` · ${order.deliveries[0].vehicleNumber}` : ""}
                </Text>
              )}
              {driverLocation && (
                <Text style={styles.driver}>
                  📍 Driver at: {driverLocation.latitude.toFixed(5)}, {driverLocation.longitude.toFixed(5)}
                </Text>
              )}
              <Text style={[styles.statusBadge, { color: order.status === "cancelled" ? COLORS.danger : COLORS.accent }]}>
                Status: {(order.status || "pending").replace("_", " ").toUpperCase()}
              </Text>
            </View>

            <View style={styles.timeline}>
              {timeline.map((item, i) => (
                <View key={item.status} style={styles.tl}>
                  <View style={[styles.tlIcon, item.done && styles.tlIconDone]}>
                    <Text>{item.icon}</Text>
                  </View>
                  <View style={styles.tlText}>
                    <Text style={styles.tlTitle}>{item.status}</Text>
                    <Text style={styles.tlTime}>{item.time}</Text>
                  </View>
                  {i < timeline.length - 1 && (
                    <View style={[styles.tlLine, item.done && styles.tlLineDone]} />
                  )}
                </View>
              ))}
            </View>
          </>
        ) : (
          /* No orderId — show list of active orders */
          <>
            <Text style={styles.sectionTitle}>📦 Active Orders</Text>
            {ordersLoading ? (
              <ActivityIndicator style={{ marginTop: 40 }} color={COLORS.accent} />
            ) : orders.length === 0 ? (
              <View style={styles.center}>
                <Text style={styles.emptyTitle}>No active orders to track.</Text>
                <Text style={styles.emptySub}>Place an order first!</Text>
                <TouchableOpacity
                  onPress={() => router.push("/order")}
                  style={[styles.retryBtn, { marginTop: 12 }]}
                >
                  <Text style={styles.retryText}>Place Order →</Text>
                </TouchableOpacity>
              </View>
            ) : (
              orders.map((o) => (
                <TouchableOpacity
                  key={o.id}
                  onPress={() => navigateToOrderTracking(o.id)}
                  activeOpacity={0.8}
                  style={styles.orderCard}
                >
                  <Text style={styles.orderCardId}>Order #{o.id?.slice(0, 8)?.toUpperCase()}</Text>
                  <Text style={styles.orderCardStatus}>
                    {(o.status || "pending").replace("_", " ").toUpperCase()}
                  </Text>
                  {o.deliveryAddress && (
                    <Text style={styles.orderCardAddr}>📍 {o.deliveryAddress}</Text>
                  )}
                  <Text style={styles.orderCardAmount}>UGX {o.totalAmount?.toLocaleString()}</Text>
                </TouchableOpacity>
              ))
            )}
          </>
        )}
      </ScrollView>

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  mapContainer: { height: 280, marginHorizontal: 16, marginBottom: 14, borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: COLORS.border },
  mapFallback: { backgroundColor: "#0a1530", alignItems: "center", justifyContent: "center" },
  mapFallbackText: { color: COLORS.muted, fontSize: 14 },
  connectionBadge: { position: "absolute", top: 12, right: 12, backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  connectionText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  center: { alignItems: "center", marginTop: 60, paddingHorizontal: 24 },
  loadingText: { color: COLORS.muted, marginTop: 12 },
  errorText: { color: COLORS.danger, fontSize: 14, textAlign: "center" },
  retryBtn: { backgroundColor: COLORS.accent, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 999, marginTop: 16 },
  retryText: { color: "#fff", fontWeight: "600" },
  card: { marginHorizontal: 16, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, padding: 16, marginBottom: 14 },
  orderId: { color: "#fff", fontSize: 14, fontWeight: "600" },
  driver: { color: COLORS.muted, fontSize: 12, marginTop: 4 },
  statusBadge: { fontSize: 12, fontWeight: "700", marginTop: 8 },
  timeline: { marginHorizontal: 16, marginTop: 8 },
  tl: { flexDirection: "row", gap: 14, paddingVertical: 12, position: "relative" },
  tlIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#1a2236", alignItems: "center", justifyContent: "center", zIndex: 1 },
  tlIconDone: { backgroundColor: COLORS.accent },
  tlText: { flex: 1 },
  tlTitle: { color: "#fff", fontSize: 13, fontWeight: "600" },
  tlTime: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  tlLine: { position: "absolute", left: 15, top: 32, bottom: 0, width: 2, backgroundColor: "#1a2236" },
  tlLineDone: { backgroundColor: COLORS.accent },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#fff", paddingHorizontal: 16, marginBottom: 12, marginTop: 8 },
  emptyTitle: { color: "#fff", fontSize: 16, fontWeight: "600" },
  emptySub: { color: COLORS.muted, fontSize: 13, marginTop: 4 },
  orderCard: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, padding: 16, marginHorizontal: 16, marginBottom: 10 },
  orderCardId: { color: "#fff", fontSize: 14, fontWeight: "600" },
  orderCardStatus: { color: COLORS.accent, fontSize: 11, fontWeight: "700", marginTop: 4, textTransform: "uppercase" },
  orderCardAddr: { color: COLORS.muted, fontSize: 12, marginTop: 4 },
  orderCardAmount: { color: COLORS.accent, fontSize: 14, fontWeight: "700", marginTop: 6 },
});