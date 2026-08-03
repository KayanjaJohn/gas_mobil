import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import TopBar from "../src/components/TopBar";

export default function SettingsScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <TopBar title="Settings" showBack />
      <ScrollView style={{ padding: 16 }}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🌍 Language</Text>
          <TouchableOpacity style={styles.row} onPress={() => Alert.alert("Coming Soon", "More languages on the way.")}>
            <Text style={styles.rowText}>English (UG)</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📍 Location</Text>
          <TouchableOpacity style={styles.row} onPress={() => router.push("/(tabs)/profile")}>
            <Text style={styles.rowText}>Update delivery address</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔔 Notifications</Text>
          <TouchableOpacity style={styles.row} onPress={() => router.push("/(tabs)/notifications")}>
            <Text style={styles.rowText}>Manage notification preferences</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔒 Privacy</Text>
          <TouchableOpacity style={styles.row} onPress={() => Alert.alert("Privacy Policy", "Your data is encrypted and never sold to third parties.")}>
            <Text style={styles.rowText}>Privacy Policy</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.row} onPress={() => Alert.alert("Terms of Service", "Standard terms for gas cylinder delivery services.")}>
            <Text style={styles.rowText}>Terms of Service</Text>
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
  cardTitle: { color: "#fff", fontSize: 15, fontWeight: "700", marginBottom: 12 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#131d33" },
  rowText: { color: "#fff", fontSize: 14 },
  chevron: { color: "#8A93A6", fontSize: 18 },
});