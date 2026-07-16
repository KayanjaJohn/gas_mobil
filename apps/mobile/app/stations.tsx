import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import TopBar from "../src/components/TopBar";
import BottomNav from "../src/components/BottomNav";
import { STATIONS, COLORS } from "../src/utils/constants";

const REGIONS = ["All", "Central", "Western", "Eastern", "Northern"];

export default function StationsScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("All");

  const filtered = STATIONS.filter((s) => {
    const matchesRegion = region === "All" || s.region === region;
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.city.toLowerCase().includes(search.toLowerCase());
    return matchesRegion && matchesSearch;
  });

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <TopBar title="Partner Stations" showBack onBack={() => router.push("/(tabs)")} />

        <View style={styles.netsum}>
          <Text style={styles.netsumLabel}>🔥 NETWORK SUMMARY</Text>
          <View style={styles.netsumNums}>
            <View><Text style={styles.netsumBig}>62</Text><Text style={styles.netsumSmall}>Partner Stations</Text></View>
            <View><Text style={styles.netsumBig}>5,215</Text><Text style={styles.netsumSmall}>Cylinders Sold (30d)</Text></View>
          </View>
        </View>

        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
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

        <Text style={styles.count}>Showing {filtered.length} of {STATIONS.length} stations</Text>

        <View style={{ paddingHorizontal: 16, paddingBottom: 100, gap: 10 }}>
          {filtered.map((station) => (
            <View key={station.id} style={styles.station}>
              <View style={[styles.avatar, { backgroundColor: station.isActive ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)" }]}>
                <Text style={[styles.avatarText, { color: station.isActive ? "#3ddc84" : "#ff6b6b" }]}>{station.name.slice(0, 2).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={styles.stationName}>{station.name}</Text>
                  <View style={[styles.pill, { backgroundColor: station.isActive ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)" }]}>
                    <Text style={[styles.pillText, { color: station.isActive ? "#34d399" : "#ff6b6b" }]}>{station.isActive ? "OPEN" : "CLOSED"}</Text>
                  </View>
                </View>
                <Text style={styles.stationSub}>{station.city} • {station.region} Region</Text>
                <Text style={styles.stationSold}>109 sold (30d)</Text>
              </View>
              <TouchableOpacity style={styles.sendBtn} activeOpacity={0.7}><Text>📍</Text></TouchableOpacity>
            </View>
          ))}
        </View>
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
  netsumBig: { color: "#fff", fontSize: 24, fontWeight: "700" },
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
  stationName: { color: "#fff", fontSize: 14, fontWeight: "600" },
  stationSub: { color: COLORS.muted, fontSize: 11, marginTop: 3 },
  stationSold: { color: COLORS.accent, fontSize: 11, marginTop: 3 },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  pillText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  sendBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(20,132,255,0.12)", alignItems: "center", justifyContent: "center" },
});