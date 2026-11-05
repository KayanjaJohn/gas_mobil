import Icon from "@expo/vector-icons/MaterialCommunityIcons";
import React, { useEffect, useState } from "react";
import { Linking } from "react-native";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import TopBar from "../src/components/TopBar";
import BottomNav from "../src/components/BottomNav";
import { COLORS } from "../src/utils/constants";
import { apiRequest } from "../src/services/api";

interface Station {
  id: string;
  name: string;
  address: string;
  city: string;
  region?: string;
  isActive: boolean;
  latitude: number;
  longitude: number;
}


// Station records currently expose city and address, but the API entity does not
// persist a separate region field. Use the real location text first, then Uganda
// coordinates as a fallback so all station filters work with existing records.
function inferStationRegion(station: Station): string {
  const location = `${station.name || ""} ${station.city || ""} ${station.address || ""}`.toLowerCase();
  const terms: Record<string, string[]> = {
    south: ["rakai", "kyotera", "lyantonde", "ssembabule", "kalangala"],
    north: ["gulu", "lira", "arua", "kitgum", "pader", "agago", "amuru", "nwoya", "omoro", "otuke", "alebtong", "kole", "dokolo", "apac", "nebbi", "zombo", "moyo", "obongi", "adjumani", "yumbe", "koboko", "maracha", "lamwo", "karenga", "kaabong", "kotido", "moroto", "napak", "nakapiripirit", "abim"],
    east: ["jinja", "iganga", "kamuli", "mbale", "tororo", "busia", "bugiri", "mayuge", "namutumba", "buyende", "pallisa", "budaka", "bududa", "sironko", "bulambuli", "kapchorwa", "kumi", "katakwi", "amuria", "kaberamaido", "serere", "ngora", "bukedea", "butaleja", "manafa"],
    west: ["mbarara", "hoima", "masindi", "kigumba", "kiryandongo", "buliisa", "fort portal", "kabale", "kasese", "bushenyi", "ibanda", "ntungamo", "rukungiri", "kanungu", "kisoro", "bundibugyo", "kabarole", "kagadi", "kibaale", "mitooma", "rubirizi", "sheema", "buhweju", "kiruhura", "kamwenge", "kikuube"],
    central: ["kampala", "kalerwe", "wakiso", "mukono", "mpigi", "mityana", "mubende", "luwero", "nakaseke", "nakasongola", "kayunga", "buikwe", "gomba", "butambala", "kassanda", "kira", "entebbe"],
  };
  for (const candidate of ["south", "north", "east", "west", "central"]) {
    if (terms[candidate].some((term) => location.includes(term))) return candidate;
  }

  // Non-central admin selections are authoritative. "central" is the
  // legacy DB default, however, so GPS must be allowed to correct that
  // default for older Northern, Eastern, Western and Southern stations.
  const explicit = String(station.region || "").trim().toLowerCase();
  if (explicit.includes("north")) return "north";
  if (explicit.includes("east")) return "east";
  if (explicit.includes("west")) return "west";
  if (explicit.includes("south")) return "south";

  const latitude = Number(station.latitude);
  const longitude = Number(station.longitude);
  if (
    Number.isFinite(latitude) && Number.isFinite(longitude) &&
    latitude >= -1.5 && latitude <= 4.5 &&
    longitude >= 29.5 && longitude <= 35
  ) {
    if (latitude >= 2.5) return "north";
    if (longitude >= 33) return "east";
    if (longitude <= 30.5) return "west";
    if (latitude <= -0.2) return "south";
    return "central";
  }
  if (explicit.includes("central")) return "central";
  return "other";
}
function openStationLocation(station: Station) {
  const latitude = Number(station.latitude);
  const longitude = Number(station.longitude);
  const hasCoordinates =
    Number.isFinite(latitude) && Number.isFinite(longitude) &&
    latitude >= -90 && latitude <= 90 &&
    longitude >= -180 && longitude <= 180 &&
    (latitude !== 0 || longitude !== 0);

  const query = hasCoordinates
    ? `${latitude},${longitude}`
    : [station.name, station.address, station.city].filter(Boolean).join(", ");
  if (!query) return;
  void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`);
}

const REGIONS = ["All", "Central", "North", "East", "West", "South"];

export default function StationsScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("All");
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    setLoading(true);
    setLoadError("");
    try {
      // Load the complete active station directory. Regional tabs are an
      // optional customer filter, not a GPS-based restriction.
      const res = await apiRequest<Station[]>("get", "/stations");
      if (res.success && res.data) {
        setStations(res.data);
        setRegion("All");
      } else {
        setStations([]);
        setLoadError(res.error || "No stations are currently available.");
      }
    } catch (err: any) {
      console.error("[Stations] Fetch error:", err.message);
      setLoadError("Unable to load stations. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  const filtered = stations.filter((station) => {
    const matchesRegion = region === "All" || inferStationRegion(station) === region.toLowerCase();
    const query = search.trim().toLowerCase();
    const matchesSearch = !query ||
      station.name?.toLowerCase().includes(query) ||
      station.city?.toLowerCase().includes(query) ||
      station.address?.toLowerCase().includes(query);
    return matchesRegion && matchesSearch;
  });

  const activeCount = stations.filter(s => s.isActive).length;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <TopBar title="Partner Stations" showBack onBack={() => router.push("/(tabs)")} />

        <View style={styles.netsum}>
          <Text style={styles.netsumLabel}>NETWORK SUMMARY</Text>
          <View style={styles.netsumNums}>
            <View><Text style={styles.netsumBig}>{activeCount}</Text><Text style={styles.netsumSmall}>Active Stations</Text></View>
            <View><Text style={styles.netsumBig}>{stations.length}</Text><Text style={styles.netsumSmall}>Total Stations</Text></View>
          </View>
        </View>

        <View style={styles.searchWrap}>
          <Icon name="magnify" size={21} color={COLORS.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search station or city…"
            placeholderTextColor="#5a6a8a"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs} contentContainerStyle={styles.tabsContent}>
          {REGIONS.map((r) => (
            <TouchableOpacity key={r} style={[styles.tab, region === r && styles.tabActive]} onPress={() => setRegion(r)} activeOpacity={0.8}>
              <Text style={[styles.tabText, region === r && styles.tabTextActive]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loadError ? <TouchableOpacity onPress={fetchStations}><Text style={{ color: "#B91C1C", padding: 16 }}>{loadError} Tap to retry.</Text></TouchableOpacity> : null}
        {loading ? (
          <ActivityIndicator color={COLORS.accent} style={{ marginTop: 40 }} />
        ) : (
          <>
            <Text style={styles.count}>Showing {filtered.length} of {stations.length} stations</Text>
            <View style={{ paddingHorizontal: 16, paddingBottom: 100, gap: 10 }}>
              {filtered.map((station) => (
                <View key={station.id} style={styles.station}>
                  <View style={[styles.avatar, { backgroundColor: station.isActive ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)" }]}>
                    <Text style={[styles.avatarText, { color: station.isActive ? "#0B3D2E" : "#991B1B" }]}>{station.name?.slice(0, 2)?.toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text style={styles.stationName}>{station.name}</Text>
                      <View style={[styles.pill, { backgroundColor: station.isActive ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)" }]}>
                        <Text style={[styles.pillText, { color: station.isActive ? "#0B3D2E" : "#991B1B" }]}>{station.isActive ? "OPEN" : "CLOSED"}</Text>
                      </View>
                    </View>
                    <Text style={styles.stationSub}>{station.city || station.address}</Text>
                    <Text style={styles.stationSold}>{inferStationRegion(station) === "other" ? "Uganda" : `${inferStationRegion(station).replace(/^./, (c) => c.toUpperCase())} Region`}</Text>
                  </View>
                  <View style={{ alignItems: "center", gap: 6 }}>
                    <TouchableOpacity style={styles.sendBtn} activeOpacity={0.7} onPress={() => openStationLocation(station)} accessibilityRole="button" accessibilityLabel={`Open ${station.name} on map`}><Icon name="map-marker-outline" size={20} color={COLORS.accent} /></TouchableOpacity>
                    <TouchableOpacity
                      style={styles.selectStationBtn}
                      activeOpacity={0.8}
                      onPress={() => router.push({ pathname: "/order", params: { stationId: station.id, stationName: station.name } } as any)}
                    >
                      <Text style={styles.selectStationText}>Select</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              {filtered.length === 0 && (
                <View style={{ alignItems: "center", paddingVertical: 40 }}>
                  <Text style={{ color: COLORS.muted }}>No stations found</Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  netsum: { margin: 16, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, padding: 16 },
  netsumLabel: { fontSize: 11, color: COLORS.accent, letterSpacing: 1.5, fontWeight: "700", marginBottom: 12 },
  netsumNums: { flexDirection: "row", gap: 14 },
  netsumBig: { color: COLORS.text, fontSize: 24, fontWeight: "700" },
  netsumSmall: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  searchWrap: { marginHorizontal: 16, marginBottom: 12, flexDirection: "row", alignItems: "center", backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 14 },
  searchIcon: { fontSize: 14, color: COLORS.muted, marginRight: 10 },
  searchInput: { flex: 1, color: COLORS.text, fontSize: 13, paddingVertical: 12 },
  tabs: { marginBottom: 10 },
  tabsContent: { paddingHorizontal: 16, gap: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
  tabActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  tabText: { color: COLORS.muted, fontSize: 12, fontWeight: "600" },
  tabTextActive: { color: "#fff" },
  count: { color: COLORS.muted, fontSize: 12, marginHorizontal: 16, marginBottom: 10 },
  station: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, padding: 12 },
  avatar: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  avatarText: { fontWeight: "700", fontSize: 14 },
  stationName: { color: COLORS.text, fontSize: 14, fontWeight: "600" },
  stationSub: { color: COLORS.muted, fontSize: 11, marginTop: 3 },
  stationSold: { color: COLORS.accent, fontSize: 11, marginTop: 3 },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  pillText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  sendBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(20,132,255,0.12)", alignItems: "center", justifyContent: "center" },
  selectStationBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: COLORS.accent },
  selectStationText: { color: "#FFFFFF", fontSize: 10, fontWeight: "800" },
});
