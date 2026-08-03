import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import TopBar from "../src/components/TopBar";
import { useAuth } from "../src/context/AuthContext";

export default function CylindersScreen() {
  const { user } = useAuth();
  return (
    <View style={styles.container}>
      <TopBar title="My Cylinders" showBack />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={styles.emptyCard}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>📦</Text>
          <Text style={styles.emptyTitle}>No cylinders registered yet</Text>
          <Text style={styles.emptySub}>
            After your first delivery, your cylinders will appear here for easy re-ordering and tracking.
          </Text>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => Alert.alert("Coming Soon", "Cylinder registration via QR code scan coming in the next update.")}
          >
            <Text style={styles.btnText}>Register Cylinder (Soon)</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#070b14" },
  emptyCard: { backgroundColor: "#101723", borderRadius: 16, padding: 32, alignItems: "center", borderWidth: 1, borderColor: "#1F2A3D", marginTop: 40 },
  emptyTitle: { color: "#fff", fontSize: 16, fontWeight: "700", marginTop: 8 },
  emptySub: { color: "#8A93A6", fontSize: 13, textAlign: "center", marginTop: 8, lineHeight: 20 },
  btn: { backgroundColor: "#1484FF", borderRadius: 14, paddingVertical: 14, paddingHorizontal: 24, marginTop: 20 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});