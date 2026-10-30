import { View, Text, StyleSheet, ScrollView } from "react-native";
import Icon from "@expo/vector-icons/MaterialCommunityIcons";
import TopBar from "../src/components/TopBar";

const METHODS = [
  {
    name: "Cash on Delivery",
    sub: "Pay your driver when your gas arrives",
    active: true,
    icon: "cash-check",
  },
];

export default function PaymentsScreen() {
  return (
    <View style={styles.container}>
      <TopBar title="Payment Methods" showBack />
      <ScrollView style={{ padding: 16 }}>
        {METHODS.map((m, i) => (
          <View key={i} style={[styles.card, m.active && styles.cardActive]}>
            <Icon name={m.icon as any} size={26} color="#F36A21" style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#123D30", fontSize: 14, fontWeight: "600" }}>{m.name}</Text>
              <Text style={{ color: "#66776F", fontSize: 12, marginTop: 2 }}>{m.sub}</Text>
            </View>
            {m.active && <View style={styles.badge}><Text style={styles.badgeText}>DEFAULT</Text></View>}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF8EE" },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: "#E9E2D7" },
  cardActive: { borderColor: "#F36A21", backgroundColor: "#FFF3E8" },
  badge: { backgroundColor: "#FFF3E8", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { color: "#F36A21", fontSize: 10, fontWeight: "700" },
});