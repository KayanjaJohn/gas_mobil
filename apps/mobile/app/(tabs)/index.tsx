import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../src/context/index";
import { TopBar } from "../../src/components/index";
import { Card } from "../../src/components/index";
import { BottomNav } from "../../src/components/index";
import { COLORS } from "../../src/utils/constants";
import { apiRequest } from "../../src/services/api";
import * as Location from 'expo-location';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';

interface HomeOrder {
  id: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  items?: Array<{
    quantity: number;
    product?: { name?: string; type?: string; weight?: number | string | null };
  }>;
  deliveries?: Array<{ status: string; deliveredAt?: string | null }>;
}

interface CylinderDelivery {
  deliveredAt: string;
  weightKg: number;
}

interface Station {
  id: string;
  name: string;
  address?: string;
  city?: string;
  latitude?: string | number;
  longitude?: string | number;
  isActive: boolean;
  region?: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [percent, setPercent] = useState<number | null>(null);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [cylinderDelivery, setCylinderDelivery] = useState<CylinderDelivery | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [nearestStation, setNearestStation] = useState<Station | null>(null);
  const [loadingStations, setLoadingStations] = useState(true);
  const [customerCity, setCustomerCity] = useState(user?.city || "Finding your city…");

  // Household usage estimate: two one-hour cooking sessions per day.
  // The 0.20 kg/hour burn rate is an editable planning assumption, not a sensor reading.
  const COOKING_HOURS_PER_DAY = 2;
  const ESTIMATED_LPG_KG_PER_HOUR = 0.20;
  const DAILY_LPG_USE_KG = COOKING_HOURS_PER_DAY * ESTIMATED_LPG_KG_PER_HOUR;

  console.log('[Home] Screen rendered | user:', user?.email, '| authenticated:', !!user);

  const calculateCylinderUsage = useCallback((delivery: CylinderDelivery | null) => {
    if (!delivery) {
      setPercent(null);
      setDaysRemaining(null);
      return;
    }
    const deliveredAt = new Date(delivery.deliveredAt).getTime();
    if (!Number.isFinite(deliveredAt) || delivery.weightKg <= 0) {
      setPercent(null);
      setDaysRemaining(null);
      return;
    }
    const elapsedDays = Math.max(0, (Date.now() - deliveredAt) / 86400000);
    const consumedKg = elapsedDays * DAILY_LPG_USE_KG;
    const remainingKg = Math.max(0, delivery.weightKg - consumedKg);
    setPercent(Math.max(0, Math.min(100, (remainingKg / delivery.weightKg) * 100)));
    setDaysRemaining(remainingKg / DAILY_LPG_USE_KG);
  }, [DAILY_LPG_USE_KG]);

  useEffect(() => {
    calculateCylinderUsage(cylinderDelivery);
    if (!cylinderDelivery) return;
    const timer = setInterval(() => calculateCylinderUsage(cylinderDelivery), 60 * 1000);
    return () => clearInterval(timer);
  }, [cylinderDelivery, calculateCylinderUsage]);

  const fetchCylinderDelivery = useCallback(async () => {
    try {
      const response = await apiRequest<HomeOrder[]>("get", "/orders");
      if (!response.success || !response.data) return;
      const completedDeliveries = response.data.flatMap((order) => {
        const cylinderItems = (order.items || []).filter((item) =>
          item.product?.type === "cylinder" ||
          /cylinder|lpg|gas refill/i.test(item.product?.name || "")
        );
        if (cylinderItems.length === 0) return [];
        return (order.deliveries || [])
          .filter((delivery) => delivery.status === "delivered")
          .map((delivery) => ({
            deliveredAt: delivery.deliveredAt || order.updatedAt || order.createdAt,
            order,
            cylinderItems,
          }));
      }).filter((entry) => Number.isFinite(new Date(entry.deliveredAt).getTime()));

      completedDeliveries.sort(
        (a, b) => new Date(b.deliveredAt).getTime() - new Date(a.deliveredAt).getTime()
      );
      const latest = completedDeliveries[0];
      if (!latest) {
        setCylinderDelivery(null);
        return;
      }

      const firstCylinderItem = latest.cylinderItems[0];
      const deliveredWeight = Number(firstCylinderItem?.product?.weight || 0);

      // Existing GasMobil home design defaults to a 6 kg cylinder if older
      // order records do not include product weight in the API response.
      setCylinderDelivery({
        deliveredAt: latest.deliveredAt,
        weightKg: deliveredWeight > 0 ? deliveredWeight : 6,
      });
    } catch (error: any) {
      console.warn("[Home] Could not load latest delivered cylinder:", error?.message || error);
    }
  }, []);

  // Haversine distance (meters)
  const toRadians = (deg: number) => (deg * Math.PI) / 180;
  const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const φ1 = toRadians(lat1);
    const φ2 = toRadians(lat2);
    const Δφ = toRadians(lat2 - lat1);
    const Δλ = toRadians(lon2 - lon1);

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // meters
  };

  // Resolve the customer's real city and find the nearest active station.
  const fetchStations = useCallback(async () => {
    setLoadingStations(true);
    try {
      const [stationResponse, permission] = await Promise.all([
        apiRequest<Station[]>("get", "/stations"),
        Location.requestForegroundPermissionsAsync(),
      ]);
      let eligibleStations = stationResponse.success && stationResponse.data
        ? stationResponse.data.filter((station: Station) => station.isActive)
        : [];

      let currentLatitude: number | null = null;
      let currentLongitude: number | null = null;
      let detectedCity = user?.city || "";
      if (permission.status === "granted") {
        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          currentLatitude = location.coords.latitude;
          currentLongitude = location.coords.longitude;

          const places = await Location.reverseGeocodeAsync({
            latitude: currentLatitude,
            longitude: currentLongitude,
          });
          const place = places[0];
          const actualCity = place?.city || place?.district || place?.subregion || place?.region;
          detectedCity = actualCity ? actualCity.trim() : (user?.city || "");
          setCustomerCity(detectedCity || "Current city unavailable");
        } catch (locationError: any) {
          console.warn("[Home] Could not resolve current city:", locationError?.message || locationError);
          setCustomerCity("Current city unavailable");
        }
      } else {
        setCustomerCity("Enable location to show your city");
      }

      // Re-query with the freshly detected GPS and city. The API applies the
      // same-region OR within-50-km rule before returning customer stations.
      const stationQuery: string[] = [];
      if (currentLatitude !== null && currentLongitude !== null) {
        stationQuery.push(`latitude=${currentLatitude}`, `longitude=${currentLongitude}`);
      }
      if (detectedCity) stationQuery.push(`city=${encodeURIComponent(detectedCity)}`);
      if (stationQuery.length > 0) {
        const scopedResponse = await apiRequest<Station[]>("get", `/stations?${stationQuery.join("&")}`);
        if (scopedResponse.success && Array.isArray(scopedResponse.data)) {
          eligibleStations = scopedResponse.data.filter((station) => station.isActive);
        }
      }
      setStations(eligibleStations);

      if (eligibleStations.length === 0) {
        setNearestStation(null);
        return;
      }

      if (currentLatitude !== null && currentLongitude !== null) {
        let best: Station | null = null;
        let bestDistance = Number.POSITIVE_INFINITY;
        for (const station of eligibleStations) {
          const latitude = Number(station.latitude ?? (station as any).lat);
          const longitude = Number(station.longitude ?? (station as any).lng);
          if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;
          const distance = haversineDistance(
            currentLatitude, currentLongitude, latitude, longitude
          );
          if (distance < bestDistance) {
            bestDistance = distance;
            best = station;
          }
        }
        setNearestStation(best || eligibleStations[0]);
      } else if (detectedCity) {
        // No GPS but a saved/reverse-geocoded city exists. The API has already
        // constrained this list to that city’s region.
        setNearestStation(eligibleStations[0]);
      } else {
        // Do not auto-assign a customer to an arbitrary distant station.
        // They can choose a regional station from the Stations screen.
        setNearestStation(null);
      }
    } catch (error: any) {
      console.error("[Home] Failed to load stations/location:", error?.message || error);
      setCustomerCity(user?.city || "Current city unavailable");
    } finally {
      setLoadingStations(false);
    }
  }, [user?.city]);

  // Refresh the customer's city, nearest station and delivered-cylinder
  // estimate whenever Home becomes visible again.
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        void fetchStations();
        void fetchCylinderDelivery();
      } else {
        setStations([]);
        setNearestStation(null);
        setCylinderDelivery(null);
        setCustomerCity("Location unavailable");
        setLoadingStations(false);
      }
      return undefined;
    }, [user?.id, fetchStations, fetchCylinderDelivery])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (user) await Promise.all([fetchStations(), fetchCylinderDelivery()]);
    } finally {
      setRefreshing(false);
    }
  }, [fetchStations, fetchCylinderDelivery, user]);

  const getColor = (value: number | null) => {
    if (value === null) return COLORS.muted;
    return value <= 15 ? COLORS.danger : value <= 40 ? COLORS.warn : COLORS.success;
  };
  const getStatus = (value: number | null) => {
    if (value === null) return { label: "AWAITING", msg: "Your usage meter starts when a delivery is confirmed." };
    if (value <= 15) return { label: "LOW", msg: "Refill soon — your estimated gas is running low." };
    if (value <= 40) return { label: "MODERATE", msg: "Plan your next refill." };
    return { label: "FULL", msg: "Your delivered cylinder is being tracked." };
  };

  const color = getColor(percent);
  const status = getStatus(percent);
  const headerLocation = /unavailable|enable location/i.test(customerCity)
    ? customerCity
    : `${customerCity}, Uganda`;

  const daysLeftText = daysRemaining === null
    ? "Estimate starts after delivery"
    : daysRemaining <= 0
      ? "Estimated gas exhausted — arrange a refill"
      : `About ${Math.ceil(daysRemaining)} days left (2 × 1-hour sessions/day)`;

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <TopBar locationLabel={headerLocation} />

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
            <Icon name="fire" size={64} color={COLORS.accent} style={styles.flameArt} />
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
                <Text style={[styles.percent, { color }]}>{percent === null ? "—" : `${Math.round(percent)}%`}</Text>
                <Text style={styles.fullLabel}>{status.label}</Text>
              </View>
            </View>
            <View style={styles.cylInfo}>
              <Text style={styles.cylTitle}><Icon name="propane-tank" size={18} color={COLORS.accent} />  {cylinderDelivery?.weightKg ?? 6}kg Cylinder</Text>
              <Text style={[styles.warn, { color }]}>{status.msg}</Text>
              <Text style={styles.insp}>{daysLeftText}</Text>
              <Text style={styles.insp}>Planning estimate: 0.20 kg/hour; actual use varies by burner and flame level.</Text>
              {cylinderDelivery && (
                <Text style={styles.insp}>
                  Delivered {new Date(cylinderDelivery.deliveredAt).toLocaleDateString()}
                </Text>
              )}
            </View>
          </View>
        </Card>

        {/* Quick Actions */}
        <View style={styles.sectionLabel}>
          <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
        </View>
        <View style={styles.actions}>
          {[
            { icon: "swap-horizontal", label: "Swap Refill", color: COLORS.accent, bg: "rgba(243,106,33,0.12)", route: "/order" },
            { icon: "shopping-outline", label: "Buy New", color: COLORS.danger, bg: "rgba(243,106,33,0.12)", route: "/order" },
            { icon: "map-marker-radius-outline", label: "Find Agent", color: COLORS.success, bg: "rgba(11,61,46,0.10)", route: "/stations" },
            { icon: "tools", label: "Accessories", color: COLORS.warn, bg: "rgba(243,106,33,0.12)", route: "/accessories" },
          ].map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.action}
              onPress={() => router.push(action.route as any)}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.bg }]}>
                <Icon name={action.icon as any} size={18} color="#FFFFFF" />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Delivery Guarantee */}
        <Card style={styles.deliveryCard}>
          <View style={styles.deliveryInner}>
            <View style={styles.deliveryIconWrap}>
              <Icon name="truck-fast-outline" size={26} color={COLORS.accent} />
            </View>
            <View style={styles.deliveryText}>
              <Text style={styles.deliveryTitle}>2-Hour Delivery Guarantee</Text>
              <Text style={styles.deliverySub}>Or get 10% off your next refill</Text>
            </View>
            <Icon name="lightning-bolt" size={22} color={COLORS.accent} />
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
              <Icon name="fire" size={22} color={COLORS.accent} />
            </View>
            <View>
              <Text style={styles.contactTitle}>GasMobil Uganda</Text>
              <Text style={styles.contactSub}>
                A member of <Text style={{ color: COLORS.accent }}>Lambula Creative Agency</Text>
              </Text>
            </View>
          </View>
          <View style={styles.divider} />
          {[
            { icon: "phone-outline", text: "+256 785 796 333 · 0776 800 386" },
            { icon: "email-outline", text: "info@gas-mobil.com" },
            { icon: "map-marker-outline", text: "Plot 12, Kampala Road, Kampala, Uganda" },
            { icon: "web", text: "www.gas-mobil.com" },
          ].map((item, i) => (
            <View key={i} style={styles.contactRow}>
              <Icon name={item.icon as any} size={18} color={COLORS.accent} />
              <Text style={styles.contactText}>{item.text}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <Text style={styles.copyright}>
            © {new Date().getFullYear()} GasMobil Uganda. All rights reserved.{"\n"}
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
  heroCard: { backgroundColor: COLORS.card, borderColor: COLORS.border, overflow: "hidden" },
  heroInner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  heroText: { maxWidth: "62%" },
  tag: { color: COLORS.accent, fontSize: 11, letterSpacing: 1.4, fontWeight: "700" },
  heroTitle: { color: COLORS.text, fontSize: 20, fontWeight: "700", lineHeight: 27, marginTop: 8, marginBottom: 14 },
  heroBtn: { backgroundColor: COLORS.accent, borderRadius: 999, paddingVertical: 11, paddingHorizontal: 20, alignSelf: "flex-start", shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 20 },
  heroBtnText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  flameArt: { fontSize: 76, textShadowColor: "rgba(243,106,33,0.35)", textShadowOffset: { width: 0, height: 8 }, textShadowRadius: 20 },
  sectionLabel: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 22, paddingTop: 18, paddingBottom: 8 },
  sectionTitle: { fontSize: 11, letterSpacing: 1.5, color: COLORS.muted, fontWeight: "600", textTransform: "uppercase" },
  viewAll: { fontSize: 12, color: COLORS.accent, fontWeight: "600" },
  cylinderCard: { backgroundColor: COLORS.card, borderColor: COLORS.border },
  cylinderInner: { flexDirection: "row", alignItems: "center", gap: 18 },
  progressRing: { width: 96, height: 96, borderRadius: 48, borderWidth: 6, alignItems: "center", justifyContent: "center" },
  progressInner: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.card2, alignItems: "center", justifyContent: "center" },
  percent: { fontSize: 20, fontWeight: "700" },
  fullLabel: { fontSize: 9, letterSpacing: 1.5, color: COLORS.text, marginTop: 4 },
  cylInfo: { flex: 1 },
  cylTitle: { color: COLORS.text, fontSize: 15, fontWeight: "700" },
  warn: { fontSize: 12, marginTop: 6, marginBottom: 6 },
  insp: { fontSize: 11, color: COLORS.muted },
  actions: { flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 18 },
  action: { flex: 1, alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 8, paddingHorizontal: 3, minHeight: 76, borderRadius: 12, backgroundColor: COLORS.accent, borderWidth: 0, borderColor: COLORS.accent },
  actionIcon: { width: 30, height: 30, borderRadius: 9, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" },
  actionLabel: { fontSize: 10, color: "#FFFFFF", fontWeight: "700", textAlign: "center" },
  deliveryCard: {},
  deliveryInner: { flexDirection: "row", alignItems: "center", gap: 14 },
  deliveryIconWrap: { width: 46, height: 46, borderRadius: 23, backgroundColor: "rgba(11,61,46,0.09)", alignItems: "center", justifyContent: "center" },
  deliveryIcon: { fontSize: 20, color: COLORS.accent },
  deliveryText: { flex: 1 },
  deliveryTitle: { color: COLORS.text, fontSize: 14, fontWeight: "700" },
  deliverySub: { color: COLORS.muted, fontSize: 11, marginTop: 3 },
  bolt: { fontSize: 18, color: COLORS.accent },
  stationCard: {},
  stationInner: { flexDirection: "row", alignItems: "center", gap: 12 },
  stationAvatar: { width: 46, height: 46, borderRadius: 14, backgroundColor: COLORS.card2, alignItems: "center", justifyContent: "center" },
  stationAvatarText: { color: COLORS.green, fontWeight: "700", fontSize: 14 },
  stationInfo: { flex: 1 },
  stationName: { color: COLORS.text, fontSize: 14, fontWeight: "700" },
  stationSub: { color: COLORS.muted, fontSize: 11, marginTop: 3 },
  stationMeta: { alignItems: "flex-end" },
  stationOpen: { fontSize: 10, color: COLORS.success, marginTop: 2 },
  contactCard: { marginTop: 18, marginBottom: 24 },
  contactHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  contactLogo: { width: 46, height: 46, borderRadius: 14, backgroundColor: COLORS.card2, borderWidth: 1, borderColor: COLORS.border, alignItems: "center", justifyContent: "center" },
  contactTitle: { color: COLORS.text, fontSize: 15, fontWeight: "700" },
  contactSub: { fontSize: 11, color: COLORS.muted, marginTop: 2 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 14 },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  contactIcon: { width: 24, textAlign: "center", color: COLORS.accent, fontSize: 14 },
  contactText: { fontSize: 12.5, color: COLORS.text },
  copyright: { fontSize: 10.5, color: COLORS.muted, textAlign: "center", lineHeight: 18 },
});
