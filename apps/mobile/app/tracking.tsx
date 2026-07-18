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

export default function TrackingScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = async () => {
    if (!orderId) {
      setError("No order ID provided");
      setLoading(false);
      return;
    }
    try {
      const res = await apiRequest("get", `/orders/${orderId}`);
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

  useEffect(() => {
    fetchOrder();
    // Poll every 10 seconds
    const interval = setInterval(fetchOrder, 10000);
    return () => clearInterval(interval);
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

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <TopBar title="Live Tracking" showBack onBack={() => router.push("/(tabs)")} />

        {/* Map Mock */}
        <View style={styles.map}>
          <View style={styles.path} />
          <View style={[styles.dot, styles.dotStart]} />
          <View style={[styles.dot, styles.dotEnd]} />
        </View>

        <Card>
          {loading ? (
            <ActivityIndicator color={COLORS.accent} style={{ marginVertical: 20 }} />
          ) : error ? (
            <View style={{ paddingVertical: 20, alignItems: "center" }}>
              <Text style={{ color: COLORS.danger, fontSize: 14 }}>{error}</Text>
              <TouchableOpacity onPress={fetchOrder} style={{ marginTop: 12 }}>
                <Text style={{ color: COLORS.accent, fontSize: 14 }}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.orderId}>Order #{order?.id?.slice(0, 12)?.toUpperCase() || "GM-UNKNOWN"}</Text>
              {order?.deliveries?.[0]?.driverName && (
                <Text style={styles.driver}>
                  Driver: {order.deliveries[0].driverName} · {order.deliveries[0].vehicleNumber || "Vehicle"}
                </Text>
              )}
              <Text style={[styles.statusBadge, { color: order?.status === "cancelled" ? COLORS.danger : COLORS.success }]}>
                Status: {(order?.status || "pending").replace("_", " ").toUpperCase()}
              </Text>

              <View style={styles.timeline}>
                {timeline.map((item, i) => (
                  <View key={i} style={styles.tl}>
                    <View style={[styles.tlIcon, item.done && styles.tlIconDone]}>
                      <Text style={{ fontSize: 12, color: item.done ? "#fff" : COLORS.muted }}>{item.icon}</Text>
                    </View>
                    <View style={styles.tlText}>
                      <Text style={styles.tlTitle}>{item.status}</Text>
                      <Text style={styles.tlTime}>{item.time}</Text>
                    </View>
                    {i < timeline.length - 1 && <View style={[styles.tlLine, item.done && styles.tlLineDone]} />}
                  </View>
                ))}
              </View>
            </>
          )}
        </Card>
      </ScrollView>
      <View style={{ height: 100 }} />
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
});
