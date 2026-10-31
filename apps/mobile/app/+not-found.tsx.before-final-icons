import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { COLORS } from "../src/utils/constants";

export default function NotFoundScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={{ fontSize: 64, marginBottom: 16 }}>🔥</Text>
      <Text style={styles.title}>Page Not Found</Text>
      <Text style={styles.subtitle}>The screen you're looking for doesn't exist.</Text>
      <TouchableOpacity style={styles.btn} onPress={() => router.replace("/(tabs)")} activeOpacity={0.85}>
        <Text style={styles.btnText}>Go Home →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { color: "#fff", fontSize: 24, fontWeight: "700", marginBottom: 8 },
  subtitle: { color: COLORS.muted, fontSize: 14, marginBottom: 24, textAlign: "center" },
  btn: { backgroundColor: COLORS.accent, borderRadius: 999, paddingVertical: 12, paddingHorizontal: 24 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});