import React from "react";
import {
  View, Text, StyleSheet, ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import TopBar from "../src/components/TopBar";
import Card from "../src/components/Card";
import BottomNav from "../src/components/BottomNav";
import { COLORS } from "../src/utils/constants";

const STATS = [
  { icon: "🌳", value: "14", label: "Trees equivalent" },
  { icon: "♻️", value: "8", label: "Cylinders recycled" },
  { icon: "⚡", value: "320", label: "kWh clean energy" },
  { icon: "💧", value: "1,200L", label: "Water saved" },
];

export default function GreenScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <TopBar title="Green Impact" showBack onBack={() => router.push("/(tabs)")} />

        <Card style={styles.ecoStat}>
          <Text style={{ fontSize: 42, marginBottom: 8 }}>🌱</Text>
          <Text style={styles.big}>128 kg</Text>
          <Text style={styles.lbl}>CO₂ SAVED THIS YEAR</Text>
        </Card>

        <View style={styles.grid}>
          {STATS.map((s, i) => (
            <Card key={i} style={styles.mini}>
              <Text style={styles.miniIcon}>{s.icon}</Text>
              <Text style={styles.miniValue}>{s.value}</Text>
              <Text style={styles.miniLabel}>{s.label}</Text>
            </Card>
          ))}
        </View>

        <Card style={{ marginTop: 14 }}>
          <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600", marginBottom: 10 }}>🏆 Eco Champion</Text>
          <Text style={{ color: COLORS.muted, fontSize: 12, lineHeight: 18 }}>
            You're in the top 5% of greenest customers in Kampala. Keep refilling instead of buying new!
          </Text>
        </Card>
      </ScrollView>
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  ecoStat: { backgroundColor: "#0e1a14", borderColor: "#1a3a26", alignItems: "center", padding: 24 },
  big: { fontSize: 38, fontWeight: "800", color: "#3ddc84", letterSpacing: -1 },
  lbl: { color: COLORS.muted, fontSize: 12, marginTop: 4, letterSpacing: 0.5 },
  grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, gap: 12, marginTop: 12 },
  mini: { width: "47%", padding: 16 },
  miniIcon: { fontSize: 22, color: "#3ddc84", marginBottom: 6 },
  miniValue: { color: "#fff", fontSize: 18, fontWeight: "700" },
  miniLabel: { color: COLORS.muted, fontSize: 11, marginTop: 4 },
});