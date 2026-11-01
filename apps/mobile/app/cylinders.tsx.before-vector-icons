import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import TopBar from "../src/components/TopBar";

export default function CylindersScreen() {
  return (
    <View style={styles.container}>
      <TopBar title="My Cylinders" showBack />
      <ScrollView contentContainerStyle={{ padding: 16, alignItems: "center", marginTop: 60 }}>
        <Text style={{ fontSize: 48, marginBottom: 12 }}>📦</Text>
        <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>No cylinders registered yet</Text>
        <Text style={{ color: "#8A93A6", fontSize: 13, textAlign: "center", marginTop: 8, lineHeight: 20 }}>
          After your first delivery, your cylinders will appear here for easy re-ordering and tracking.
        </Text>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => Alert.alert("Coming Soon", "QR code cylinder registration launching next update.")}
        >
          <Text style={styles.btnText}>Register Cylinder (Soon)</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#070b14" },
  btn: { backgroundColor: "#1484FF", borderRadius: 14, paddingVertical: 14, paddingHorizontal: 24, marginTop: 20 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});