import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import TopBar from "../src/components/TopBar";

const METHODS = [
  { name: "Gasmobil Wallet", subtitle: "Balance: UGX 0", active: true, icon: "💳" },
  { name: "M-Pesa", subtitle: "Mobile Money", active: false, icon: "📱" },
  { name: "Airtel Money", subtitle: "Mobile Money", active: false, icon: "📱" },
  { name: "Cash on Delivery", subtitle: "Pay when you receive", active: false, icon: "💵" },
];

export default function PaymentsScreen() {
  return (
    <View style={styles.container}>
      <TopBar title="Payment Methods" showBack />
      <ScrollView style={{ padding: 16 }}>
        {METHODS.map((m, i) => (
          <View key={i} style={[styles.card, m.active && styles.cardActive]}>
            <Text style={{ fontSize: 24, marginRight: 12 }}>{m.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{m.name}</Text>
              <Text style={styles.sub}>{m.subtitle}</Text>
            </View>
            {m.active && <View style={styles.badge}><Text style={styles.badgeText}>DEFAULT</Text></View>}
          </View>
        ))}
        <TouchableOpacity style={styles.addBtn} onPress={() => Alert.alert("Coming Soon", "Adding new payment methods will be available shortly.")}>
          <Text style={styles.addText}>+ Add Payment Method</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#070b14" },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: "#101723", borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: "#1F2A3D" },
  cardActive: { borderColor: "#1484FF", backgroundColor: "rgba(20,132,255,0.06)" },
  name: { color: "#fff", fontSize: 14, fontWeight: "600" },
  sub: { color: "#8A93A6", fontSize: 12, marginTop: 2 },
  badge: { backgroundColor: "rgba(20,132,255,0.15)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { color: "#1484FF", fontSize: 10, fontWeight: "700" },
  addBtn: { marginTop: 10, paddingVertical: 14, alignItems: "center" },
  addText: { color: "#1484FF", fontWeight: "600", fontSize: 14 },
});