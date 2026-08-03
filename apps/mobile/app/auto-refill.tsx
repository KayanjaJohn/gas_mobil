import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from "react-native";
import { useState } from "react";
import TopBar from "../src/components/TopBar";

export default function AutoRefillScreen() {
  const [enabled, setEnabled] = useState(false);
  return (
    <View style={styles.container}>
      <TopBar title="Auto-Refill" showBack />
      <ScrollView style={{ padding: 16 }}>
        <View style={styles.card}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View>
              <Text style={styles.title}>Enable Auto-Refill</Text>
              <Text style={styles.sub}>We'll automatically order a refill when your gas runs low.</Text>
            </View>
            <Switch
              value={enabled}
              onValueChange={setEnabled}
              trackColor={{ false: "#1F2A3D", true: "#1484FF" }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <View style={[styles.card, { opacity: enabled ? 1 : 0.5 }]}>
          <Text style={styles.title}>Refill Size</Text>
          <Text style={styles.sub}>Which cylinder size should we auto-order?</Text>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
            {["6kg", "12kg", "45kg"].map((s) => (
              <TouchableOpacity key={s} style={styles.sizePill} onPress={() => Alert.alert("Coming Soon", "Auto-refill configuration is launching next week.")}>
                <Text style={{ color: "#fff", fontWeight: "600" }}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.card, { opacity: enabled ? 1 : 0.5 }]}>
          <Text style={styles.title}>Trigger Level</Text>
          <Text style={styles.sub}>Order when remaining gas drops below:</Text>
          <TouchableOpacity style={styles.row} onPress={() => Alert.alert("Coming Soon", "Auto-refill is launching soon.")}>
            <Text style={styles.rowText}>20% remaining</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#070b14" },
  card: { backgroundColor: "#101723", borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: "#1F2A3D" },
  title: { color: "#fff", fontSize: 15, fontWeight: "700" },
  sub: { color: "#8A93A6", fontSize: 12, marginTop: 4, lineHeight: 18 },
  sizePill: { backgroundColor: "#0f172a", borderWidth: 1, borderColor: "#1F2A3D", borderRadius: 999, paddingVertical: 10, paddingHorizontal: 18 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingVertical: 10 },
  rowText: { color: "#fff", fontSize: 14 },
  chevron: { color: "#8A93A6", fontSize: 18 },
});