import React from "react";
import {
  View, Text, StyleSheet, ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import TopBar from "../src/components/TopBar";
import Card from "../src/components/Card";
import BottomNav from "../src/components/BottomNav";
import { COLORS } from "../src/utils/constants";

const TIMELINE = [
  { status: "Order confirmed", time: "2 mins ago", done: true, icon: "✓" },
  { status: "Picked up from station", time: "Just now", done: true, icon: "📦" },
  { status: "On the way", time: "ETA 18 min", done: false, icon: "🚚" },
  { status: "Delivered", time: "—", done: false, icon: "🏠" },
];

export default function TrackingScreen() {
  const router = useRouter();

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
          <Text style={styles.orderId}>Order #GM-20260507</Text>
          <Text style={styles.driver}>Driver: Moses K. · Toyota Hiace · UAX 234B</Text>

          <View style={styles.timeline}>
            {TIMELINE.map((item, i) => (
              <View key={i} style={styles.tl}>
                <View style={[styles.tlIcon, item.done && styles.tlIconDone]}>
                  <Text style={{ fontSize: 12, color: item.done ? "#fff" : COLORS.muted }}>{item.icon}</Text>
                </View>
                <View style={styles.tlText}>
                  <Text style={styles.tlTitle}>{item.status}</Text>
                  <Text style={styles.tlTime}>{item.time}</Text>
                </View>
                {i < TIMELINE.length - 1 && <View style={styles.tlLine} />}
              </View>
            ))}
          </View>
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
  driver: { color: COLORS.muted, fontSize: 12, marginTop: 4, marginBottom: 14 },
  timeline: { marginTop: 8 },
  tl: { flexDirection: "row", gap: 14, paddingVertical: 12, position: "relative" },
  tlIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#1a2236", alignItems: "center", justifyContent: "center", zIndex: 1 },
  tlIconDone: { backgroundColor: COLORS.accent },
  tlText: { flex: 1 },
  tlTitle: { color: "#fff", fontSize: 13, fontWeight: "600" },
  tlTime: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  tlLine: { position: "absolute", left: 15, top: 32, bottom: 0, width: 2, backgroundColor: "#1a2236" },
});