import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import TopBar from "../../src/components/TopBar";
import Card from "../../src/components/Card";
import BottomNav from "../../src/components/BottomNav";
import { COLORS, PRICES } from "../../src/utils/constants";
import { formatDate } from "../../src/utils/formatters";

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [percent, setPercent] = useState(15);
  const [inspectionDate] = useState(formatDate(new Date()));

  // Animated cylinder gauge
  const gaugeAnim = useState(new Animated.Value(15))[0];

  useEffect(() => {
    const interval = setInterval(() => {
      setPercent((p) => {
        const next = p <= 0 ? 100 : p - 0.5;
        Animated.timing(gaugeAnim, {
          toValue: next,
          duration: 500,
          useNativeDriver: false,
        }).start();
        return next;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const getColor = (p: number) => (p < 20 ? COLORS.danger : p < 50 ? COLORS.warn : COLORS.success);
  const getStatus = (p: number) => {
    if (p < 20) return { label: "LOW", msg: "~1 day left — Refill soon!" };
    if (p < 50) return { label: "HALF", msg: "~3 days left — Plan a refill" };
    return { label: "FULL", msg: "Plenty of gas remaining" };
  };

  const color = getColor(percent);
  const status = getStatus(percent);
  const interpolated = gaugeAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <TopBar />

        {/* Hero Order Card */}
        <Card style={styles.heroCard} onPress={() => router.push("/order")}>
          <View style={styles.heroInner}>
            <View style={styles.heroText}>
              <Text style={styles.tag}>DEPOSIT-FREE</Text>
              <Text style={styles.heroTitle}>Swap your empty cylinder for a full one</Text>
              <View style={styles.heroBtn}>
                <Text style={styles.heroBtnText}>Order Now →</Text>
              </View>
            </View>
            <Text style={styles.flameArt}>🔥</Text>
          </View>
        </Card>

        {/* Cylinder Status */}
        <View style={styles.sectionLabel}>
          <Text style={styles.sectionTitle}>YOUR CYLINDER</Text>
        </View>
        <Card style={styles.cylinderCard}>
          <View style={styles.cylinderInner}>
            <View style={[styles.progressRing, { borderColor: color }]}>
              <View style={styles.progressInner}>
                <Text style={[styles.percent, { color }]}>{Math.round(percent)}%</Text>
                <Text style={styles.fullLabel}>{status.label}</Text>
              </View>
            </View>
            <View style={styles.cylInfo}>
              <Text style={styles.cylTitle}>🔥 6kg Cylinder</Text>
              <Text style={[styles.warn, { color }]}>⚠️ {status.msg}</Text>
              <Text style={styles.insp}>🟢 Inspected {inspectionDate}</Text>
            </View>
          </View>
        </Card>

        {/* Quick Actions */}
        <View style={styles.sectionLabel}>
          <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
        </View>
        <View style={styles.actions}>
          {[
            { icon: "🔄", label: "Swap Refill", color: COLORS.accent, bg: "rgba(20,132,255,0.15)", route: "/order" },
            { icon: "🛍️", label: "Buy New", color: COLORS.danger, bg: "rgba(255,77,77,0.15)", route: "/order" },
            { icon: "🗺️", label: "Find Agent", color: COLORS.success, bg: "rgba(34,197,94,0.15)", route: "/stations" },
            { icon: "⚙️", label: "Accessories", color: COLORS.warn, bg: "rgba(245,158,11,0.15)", route: "/accessories" },
          ].map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.action}
              onPress={() => router.push(action.route as any)}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.bg }]}>
                <Text style={{ fontSize: 18, color: action.color }}>{action.icon}</Text>
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Delivery Guarantee */}
        <Card style={styles.deliveryCard}>
          <View style={styles.deliveryInner}>
            <View style={styles.deliveryIconWrap}>
              <Text style={styles.deliveryIcon}>🚚</Text>
            </View>
            <View style={styles.deliveryText}>
              <Text style={styles.deliveryTitle}>2-Hour Delivery Guarantee</Text>
              <Text style={styles.deliverySub}>Or get 10% off your next refill</Text>
            </View>
            <Text style={styles.bolt}>⚡</Text>
          </View>
        </Card>

        {/* Nearest Station */}
        <View style={styles.sectionLabel}>
          <Text style={styles.sectionTitle}>NEAREST STATION</Text>
          <TouchableOpacity onPress={() => router.push("/stations")}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>
        <Card style={styles.stationCard} onPress={() => router.push("/stations")}>
          <View style={styles.stationInner}>
            <View style={styles.stationAvatar}>
              <Text style={styles.stationAvatarText}>KA</Text>
            </View>
            <View style={styles.stationInfo}>
              <Text style={styles.stationName}>Shell Kampala Road</Text>
              <Text style={styles.stationSub}>Kampala · Open until 10:00 PM</Text>
            </View>
            <View style={styles.stationMeta}>
              <Text style={styles.stationKm}>1.2 km</Text>
              <Text style={styles.stationOpen}>● Open</Text>
            </View>
          </View>
        </Card>

        {/* Contact Card */}
        <Card style={styles.contactCard}>
          <View style={styles.contactHead}>
            <View style={styles.contactLogo}>
              <Text style={{ fontSize: 22 }}>🔥</Text>
            </View>
            <View>
              <Text style={styles.contactTitle}>Gasmobil Uganda</Text>
              <Text style={styles.contactSub}>
                A member of <Text style={{ color: COLORS.accent }}>Lambula Creative Agency</Text>
              </Text>
            </View>
          </View>
          <View style={styles.divider} />
          {[
            { icon: "📞", text: "+256 785 796 333 · 0776 800 386" },
            { icon: "✉️", text: "info@gasmobil.ug" },
            { icon: "📍", text: "Plot 12, Kampala Road, Kampala, Uganda" },
            { icon: "🌐", text: "www.gasmobil.ug" },
          ].map((item, i) => (
            <View key={i} style={styles.contactRow}>
              <Text style={styles.contactIcon}>{item.icon}</Text>
              <Text style={styles.contactText}>{item.text}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <Text style={styles.copyright}>
            © {new Date().getFullYear()} Gasmobil Uganda. All rights reserved.{"\n"}
            Powered by <Text style={{ color: COLORS.accent }}>Lambula Creative Agency</Text>
          </Text>
        </Card>

        <View style={{ height: 100 }} />
      </ScrollView>
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: { paddingBottom: 20 },
  heroCard: {
    backgroundColor: "#0e1828",
    borderColor: "#16223a",
    overflow: "hidden",
  },
  heroInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroText: { maxWidth: "62%" },
  tag: {
    color: COLORS.accent,
    fontSize: 11,
    letterSpacing: 1.4,
    fontWeight: "700",
  },
  heroTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 24,
    marginTop: 8,
    marginBottom: 14,
  },
  heroBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 999,
    paddingVertical: 11,
    paddingHorizontal: 20,
    alignSelf: "flex-start",
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 22,
  },
  heroBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
  flameArt: {
    fontSize: 84,
    textShadowColor: "rgba(20,132,255,0.45)",
    textShadowOffset: { width: 0, height: 8 },
    textShadowRadius: 25,
  },
  sectionLabel: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 11,
    letterSpacing: 1.5,
    color: COLORS.muted,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  viewAll: {
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: "600",
  },
  cylinderCard: {
    backgroundColor: "#1a0e12",
    borderColor: "#3a1a22",
  },
  cylinderInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },
  progressRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  progressInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#120a10",
    alignItems: "center",
    justifyContent: "center",
  },
  percent: {
    fontSize: 20,
    fontWeight: "700",
  },
  fullLabel: {
    fontSize: 9,
    letterSpacing: 1.5,
    color: COLORS.muted,
    marginTop: 4,
  },
  cylInfo: { flex: 1 },
  cylTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  warn: {
    fontSize: 12,
    marginTop: 6,
    marginBottom: 6,
  },
  insp: {
    fontSize: 11,
    color: COLORS.muted,
  },
  actions: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
  },
  action: {
    flex: 1,
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    fontSize: 11,
    color: "#cfd3dc",
    textAlign: "center",
  },
  deliveryCard: {},
  deliveryInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  deliveryIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(20,132,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  deliveryIcon: {
    fontSize: 20,
    color: COLORS.accent,
  },
  deliveryText: { flex: 1 },
  deliveryTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  deliverySub: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 3,
  },
  bolt: {
    fontSize: 18,
    color: COLORS.accent,
  },
  stationCard: {},
  stationInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stationAvatar: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "rgba(34,197,94,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  stationAvatarText: {
    color: "#3ddc84",
    fontWeight: "700",
    fontSize: 14,
  },
  stationInfo: { flex: 1 },
  stationName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  stationSub: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 3,
  },
  stationMeta: { alignItems: "flex-end" },
  stationKm: {
    color: COLORS.accent,
    fontWeight: "700",
    fontSize: 14,
  },
  stationOpen: {
    fontSize: 10,
    color: COLORS.success,
    marginTop: 2,
  },
  contactCard: {
    marginTop: 18,
    marginBottom: 24,
  },
  contactHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  contactLogo: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#0a1830",
    borderWidth: 1,
    borderColor: "#16223a",
    alignItems: "center",
    justifyContent: "center",
  },
  contactTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  contactSub: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 14,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  contactIcon: {
    width: 24,
    textAlign: "center",
    color: COLORS.accent,
    fontSize: 14,
  },
  contactText: {
    fontSize: 12.5,
    color: "#cfd3dc",
  },
  copyright: {
    fontSize: 10.5,
    color: COLORS.muted,
    textAlign: "center",
    lineHeight: 18,
  },
});