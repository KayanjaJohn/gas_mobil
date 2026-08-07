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
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>Enable Auto-Refill</Text>
              <Text style={{ color: "#8A93A6", fontSize: 12, marginTop: 4 }}>We'll automatically order a refill when your gas runs low.</Text>
            </View>
            <Switch value={enabled} onValueChange={setEnabled} trackColor={{ false: "#1F2A3D", true: "#1484FF" }} thumbColor="#fff" />
          </View>
        </View>
        <View style={[styles.card, { opacity: enabled ? 1 : 0.5 }]}>
          <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>Refill Size</Text>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
            {["6kg", "12kg", "45kg"].map((s) => (
              <TouchableOpacity key={s} style={styles.pill} onPress={() => Alert.alert("Coming Soon")}>
                <Text style={{ color: "#fff", fontWeight: "600" }}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#070b14" },
  card: { backgroundColor: "#101723", borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: "#1F2A3D" },
  pill: { backgroundColor: "#0f172a", borderWidth: 1, borderColor: "#1F2A3D", borderRadius: 999, paddingVertical: 10, paddingHorizontal: 18 },
});