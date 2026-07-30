import React, { useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import TopBar from "../src/components/TopBar";
import Card from "../src/components/Card";
import BottomNav from "../src/components/BottomNav";
import { COLORS } from "../src/utils/constants";
import { apiRequest } from "../src/services/api";

const STATUS_MAP: Record<string, { label: string; icon: string; done: boolean }> = {
  pending: { label: "Order confirmed", icon: "✓", done: true },
  confirmed: { label: "Order confirmed", icon: "✓", done: true },
  driver_assigned: { label: "Driver assigned", icon: "🚚", done: true },
  picked_up: { label: "Picked up from station", icon: "📦", done: true },
  in_transit: { label: "On the way", icon: "🚚", done: true },
  delivered: { label: "Delivered", icon: "🏠", done: true },
  cancelled: { label: "Cancelled", icon: "✕", done: false },
};

const TIMELINE_KEYS = ["pending", "picked_up", "in_transit", "delivered"];

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  deliveryAddress?: string;
  createdAt: string;
  deliveries?: Array<{
    driverName?: string;
    driverPhone?: string;
    status?: string;
  }>;
}

export default function TrackingScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();

  // Single-order tracking state
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Orders list state (when no orderId provided)
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

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
        // Only show non-delivered, non-cancelled orders for tracking
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
      const interval = setInterval(fetchOrder, 10000);
      return () => clearInterval(interval);
    } else {
      fetchOrders();
    }
  }, [orderId]);

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

  return (
    <View style={styles.container}>
      <TopBar title="Live Tracking" onBack={() => router.push("/(tabs)")} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Map Mock */}
        <View style={styles.map}>
          <View style={styles.path} />
          <View style={[styles.dot, styles.dotStart]} />
          <View style={[styles.dot, styles.dotEnd]} />
          <Text style={{ position: "absolute", bottom: 10, left: 10, color: COLORS.muted, fontSize: 10 }}>
            🗺️ Map view — coming soon
          </Text>
        </View>

        {loading ? (
          <View style={{ padding: 40, alignItems: "center" }}>
            <ActivityIndicator size="large" color={COLORS.accent} />
            <Text style={{ color: COLORS.muted, marginTop: 12 }}>Loading...</Text>
          </View>
        ) : error ? (
          <View style={{ padding: 40, alignItems: "center" }}>
            <Text style={{ color: COLORS.danger, fontSize: 14, marginBottom: 16 }}>{error}</Text>
            <TouchableOpacity onPress={fetchOrder} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : orderId && order ? (
          <>
            <Card style={{ marginHorizontal: 16, marginBottom: 14 }}>
              <Text style={styles.orderId}>Order #{order.id?.slice(0, 12)?.toUpperCase() || "GM-UNKNOWN"}</Text>
              {order.deliveries?.[0]?.driverName && (
                <Text style={styles.driver}>
                  Driver: {order.deliveries[0].driverName} · {order.deliveries[0].vehicleNumber || "Vehicle"}
                </Text>
              )}
              <Text style={[styles.statusBadge, { color: order.status === "cancelled" ? COLORS.danger : COLORS.success }]}>
                Status: {(order.status || "pending").replace("_", " ").toUpperCase()}
              </Text>
            </Card>

            <Card style={{ marginHorizontal: 16 }}>
              <View style={styles.timeline}>
                {timeline.map((item, i) => (
                  <View key={i} style={styles.tl}>
                    <View style={[styles.tlIcon, item.done && styles.tlIconDone]}>
                      <Text style={{ fontSize: 14 }}>{item.icon}</Text>
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
            </Card>
          </>
        ) : (
          /* No orderId — show list of active orders */
          <View style={{ marginHorizontal: 16 }}>
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600", marginBottom: 12 }}>
              📦 Active Orders
            </Text>
            {ordersLoading ? (
              <ActivityIndicator size="small" color={COLORS.accent} />
            ) : orders.length === 0 ? (
              <Card>
                <Text style={{ color: COLORS.muted, textAlign: "center", padding: 20 }}>
                  No active orders to track.
Place an order first!
                </Text>
                <TouchableOpacity
                  onPress={() => router.push("/order")}
                  style={[styles.retryBtn, { marginTop: 12, alignSelf: "center" }]}
                >
                  <Text style={styles.retryText}>Place Order →</Text>
                </TouchableOpacity>
              </Card>
            ) : (
              orders.map((o) => (
                <TouchableOpacity
                  key={o.id}
                  onPress={() => navigateToOrderTracking(o.id)}
                  activeOpacity={0.8}
                >
                  <Card style={{ marginBottom: 10 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <View>
                        <Text style={{ color: "#fff", fontWeight: "600", fontSize: 14 }}>
                          Order #{o.id?.slice(0, 8)?.toUpperCase()}
                        </Text>
                        <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 4 }}>
                          {(o.status || "pending").replace("_", " ").toUpperCase()}
                        </Text>
                        {o.deliveryAddress && (
                          <Text style={{ color: COLORS.muted, fontSize: 11, marginTop: 2 }} numberOfLines={1}>
                            📍 {o.deliveryAddress}
                          </Text>
                        )}
                      </View>
                      <Text style={{ color: COLORS.accent, fontWeight: "700" }}>
                        UGX {o.totalAmount?.toLocaleString()}
                      </Text>
                    </View>
                  </Card>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </ScrollView>

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  map: { height: 240, borderRadius: 14, backgroundColor: "#0a1530", borderWidth: 1, borderColor: COLORS.border, marginHorizontal: 16, marginBottom: 14, position: "relative", overflow: "hidden" },
  path: { position: "absolute", left: "20%", top: "30%", width: "60%", height: "40%", borderWidth: 2, borderStyle: "dashed", borderColor: "rgba(59,130,246,0.5)", borderRadius: 100, borderRightWidth: 0, borderBottomWidth: 0 },
  dot: { position: "absolute", width: 14, height: 14, borderRadius: 7, backgroundColor: COLORS.accent, shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 8 },
  dotStart: { left: "18%", top: "60%" },
  dotEnd: { right: "18%", top: "25%", backgroundColor: COLORS.success, shadowColor: COLORS.success },
  orderId: { color: "#fff", fontSize: 14, fontWeight: "600" },
  driver: { color: COLORS.muted, fontSize: 12, marginTop: 4 },
  statusBadge: { fontSize: 12, fontWeight: "700", marginTop: 6, marginBottom: 14 },
  timeline: { marginTop: 8 },
  tl: { flexDirection: "row", gap: 14, paddingVertical: 12, position: "relative" },
  tlIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#1a2236", alignItems: "center", justifyContent: "center", zIndex: 1 },
  tlIconDone: { backgroundColor: COLORS.accent },
  tlText: { flex: 1 },
  tlTitle: { color: "#fff", fontSize: 13, fontWeight: "600" },
  tlTime: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  tlLine: { position: "absolute", left: 15, top: 32, bottom: 0, width: 2, backgroundColor: "#1a2236" },
  tlLineDone: { backgroundColor: COLORS.accent },
  retryBtn: { backgroundColor: COLORS.accent, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 999 },
  retryText: { color: "#fff", fontWeight: "600" },
});