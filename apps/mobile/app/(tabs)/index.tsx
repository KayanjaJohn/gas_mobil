import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/context/index";
import { TopBar } from "../../src/components/index";
import {Card} from "../../src/components/index";
import {BottomNav} from "../../src/components/index";
import { COLORS } from "../../src/utils/constants";
import { formatDate } from "../../src/utils/formatters";
import { apiRequest } from "../../src/services/api";

interface Station {
  id: string;
  name: string;
  address: string;
  city: string;
  isActive: boolean;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [percent, setPercent] = useState(15);
  const [inspectionDate] = useState(formatDate(new Date()));
  const [stations, setStations] = useState<Station[]>([]);
  const [nearestStation, setNearestStation] = useState<Station | null>(null);
  const [loadingStations, setLoadingStations] = useState(true);

  console.log('[Home] Screen rendered | user:', user?.email, '| authenticated:', !!user);

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

  // Fetch real stations from API
  const fetchStations = useCallback(async () => {
    setLoadingStations(true);
    try {
      const res = await apiRequest<{ success: boolean; data: Station[] }>("get", "/stations");
      if (res.success && res.data) {
        const activeStations = res.data.filter((s: Station) => s.isActive);
        setStations(activeStations);
        // Set first active station as "nearest" (could use GPS in future)
        if (activeStations.length > 0) {
          setNearestStation(activeStations[0]);
        }
      }
    } catch (err: any) {
      console.error("[Home] Failed to fetch stations:", err.message);
    } finally {
      setLoadingStations(false);
    }
  }, []);

  useEffect(() => {
    fetchStations();
  }, [fetchStations]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStations();
    setTimeout(() => setRefreshing(false), 1500);
  }, [fetchStations]);

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

        {/* Nearest Station - REAL DATA */}
        <View style={styles.sectionLabel}>
          <Text style={styles.sectionTitle}>NEAREST STATION</Text>
          <TouchableOpacity onPress={() => router.push("/stations")}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        {loadingStations ? (
          <Card style={styles.stationCard}>
            <View style={styles.stationInner}>
              <Text style={styles.stationName}>Loading stations...</Text>
            </View>
          </Card>
        ) : nearestStation ? (
          <Card style={styles.stationCard} onPress={() => router.push("/stations")}>
            <View style={styles.stationInner}>
              <View style={styles.stationAvatar}>
                <Text style={styles.stationAvatarText}>
                  {nearestStation.name?.substring(0, 2)?.toUpperCase() || "ST"}
                </Text>
              </View>
              <View style={styles.stationInfo}>
                <Text style={styles.stationName}>{nearestStation.name}</Text>
                <Text style={styles.stationSub}>
                  {nearestStation.city || nearestStation.address || "Location available"}
                </Text>
              </View>
              <View style={styles.stationMeta}>
                <Text style={styles.stationOpen}>● Open</Text>
              </View>
            </View>
          </Card>
        ) : (
          <Card style={styles.stationCard} onPress={() => router.push("/stations")}>
            <View style={styles.stationInner}>
              <View style={styles.stationAvatar}>
                <Text style={styles.stationAvatarText}>?</Text>
              </View>
              <View style={styles.stationInfo}>
                <Text style={styles.stationName}>No stations available</Text>
                <Text style={styles.stationSub}>Check back later or contact support</Text>
              </View>
            </View>
          </Card>
        )}

        {/* Contact Card */}
        <Card style={styles.contactCard}>
          <View style={styles.contactHead}>
            <View style={styles.contactLogo}>
              <Text style={{ fontSize: 22 }}>🔥</Text>
            </View>
            <View>
              <Text style={styles.contactTitle}>Need Help?</Text>
              <Text style={styles.contactSub}>Our support team is available 24/7</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.contactBtn} activeOpacity={0.8}>
            <Text style={styles.contactBtnText}>📞 Call Support</Text>
          </TouchableOpacity>
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
  heroCard: { marginHorizontal: 16, marginTop: 12, marginBottom: 14, backgroundColor: COLORS.card, borderRadius: 20, overflow: "hidden" },
  heroInner: { flexDirection: "row", alignItems: "center", padding: 20 },
  heroText: { flex: 1 },
  tag: { color: COLORS.accent, fontSize: 11, fontWeight: "700", letterSpacing: 0.5, marginBottom: 8 },
  heroTitle: { color: "#fff", fontSize: 18, fontWeight: "700", lineHeight: 24, marginBottom: 14 },
  heroBtn: { backgroundColor: COLORS.accent, alignSelf: "flex-start", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  heroBtnText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  flameArt: { fontSize: 56, marginLeft: 10 },
  sectionLabel: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginHorizontal: 16, marginTop: 18, marginBottom: 10 },
  sectionTitle: { fontSize: 13, color: COLORS.text, fontWeight: "600" },
  viewAll: { color: COLORS.accent, fontSize: 12, fontWeight: "600" },
  cylinderCard: { marginHorizontal: 16, marginBottom: 14 },
  cylinderInner: { flexDirection: "row", alignItems: "center", gap: 16, padding: 4 },
  progressRing: { width: 90, height: 90, borderRadius: 45, borderWidth: 5, alignItems: "center", justifyContent: "center" },
  progressInner: { alignItems: "center" },
  percent: { fontSize: 22, fontWeight: "800" },
  fullLabel: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  cylInfo: { flex: 1 },
  cylTitle: { color: "#fff", fontSize: 15, fontWeight: "600" },
  warn: { fontSize: 12, marginTop: 4, fontWeight: "500" },
  insp: { color: COLORS.muted, fontSize: 11, marginTop: 4 },
  actions: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: 16, gap: 10 },
  action: { width: "47%", backgroundColor: COLORS.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: COLORS.border },
  actionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  actionLabel: { color: "#fff", fontSize: 13, fontWeight: "600" },
  deliveryCard: { marginHorizontal: 16, marginBottom: 14 },
  deliveryInner: { flexDirection: "row", alignItems: "center", gap: 14 },
  deliveryIconWrap: { width: 48, height: 48, borderRadius: 14, backgroundColor: "rgba(20,132,255,0.12)", alignItems: "center", justifyContent: "center" },
  deliveryIcon: { fontSize: 22 },
  deliveryText: { flex: 1 },
  deliveryTitle: { color: "#fff", fontSize: 14, fontWeight: "600" },
  deliverySub: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  bolt: { fontSize: 20 },
  stationCard: { marginHorizontal: 16, marginBottom: 14 },
  stationInner: { flexDirection: "row", alignItems: "center", gap: 14 },
  stationAvatar: { width: 48, height: 48, borderRadius: 14, backgroundColor: COLORS.accent, alignItems: "center", justifyContent: "center" },
  stationAvatarText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  stationInfo: { flex: 1 },
  stationName: { color: "#fff", fontSize: 14, fontWeight: "600" },
  stationSub: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  stationMeta: { alignItems: "flex-end" },
  stationKm: { color: COLORS.muted, fontSize: 11 },
  stationOpen: { color: COLORS.success, fontSize: 11, fontWeight: "600", marginTop: 2 },
  contactCard: { marginHorizontal: 16, marginBottom: 14 },
  contactHead: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  contactLogo: { width: 44, height: 44, borderRadius: 12, backgroundColor: "rgba(20,132,255,0.12)", alignItems: "center", justifyContent: "center" },
  contactTitle: { color: "#fff", fontSize: 14, fontWeight: "600" },
  contactSub: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  contactBtn: { backgroundColor: COLORS.accent, borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  contactBtnText: { color: "#fff", fontWeight: "600", fontSize: 13 },
});
