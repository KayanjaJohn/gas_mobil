import Icon from "@expo/vector-icons/MaterialCommunityIcons";
import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import TopBar from "../src/components/TopBar";
import BottomNav from "../src/components/BottomNav";
import { COLORS } from "../src/utils/constants";

export default function GreenScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TopBar title="Green Impact" showBack onBack={() => router.push("/(tabs)")} />

        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Icon name="leaf" size={30} color="#0A3D2E" />
          </View>
          <Text style={styles.eyebrow}>GASMOBIL · SUSTAINABILITY</Text>
          <Text style={styles.heroTitle}>Every refill is a step towards a greener home.</Text>
          <Text style={styles.heroCopy}>
            Reusing your gas cylinder helps reduce unnecessary cylinder replacement. Your verified impact summary will appear here as eligible order data becomes available.
          </Text>
          <View style={styles.pendingPill}>
            <Icon name="chart-timeline-variant" size={15} color="#0A3D2E" />
            <Text style={styles.pendingText}>Impact calculation in progress</Text>
          </View>
        </View>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Your impact</Text>
          <Text style={styles.sectionCaption}>Verified customer activity</Text>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricIcon}><Icon name="molecule-co2" size={22} color="#F36A21" /></View>
          <View style={styles.metricCopy}>
            <Text style={styles.metricTitle}>Carbon emissions avoided</Text>
            <Text style={styles.metricValue}>Not calculated yet</Text>
            <Text style={styles.metricNote}>We won't display an estimated saving until it can be calculated from your actual refill history.</Text>
          </View>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricIcon}><Icon name="recycle" size={22} color="#F36A21" /></View>
          <View style={styles.metricCopy}>
            <Text style={styles.metricTitle}>Cylinder reuse</Text>
            <Text style={styles.metricValue}>Tracking your refills</Text>
            <Text style={styles.metricNote}>Eligible completed swap orders will contribute to this measure.</Text>
          </View>
        </View>

        <View style={styles.championCard}>
          <View style={styles.championIcon}><Icon name="trophy-outline" size={23} color="#F36A21" /></View>
          <View style={styles.championCopy}>
            <Text style={styles.championTitle}>Eco Champion</Text>
            <Text style={styles.championText}>
              Keep choosing cylinder refills. Once verified customer impact data is available, you'll be able to see your progress and any available Eco Champion recognition here.
            </Text>
          </View>
        </View>
        <View style={styles.footerNote}>
          <Icon name="information-outline" size={16} color="#A8B0A9" />
          <Text style={styles.footerText}>GasMobil will show measured impact only. No made-up carbon totals, rankings or environmental statistics.</Text>
        </View>
      </ScrollView>
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A3D2E" },
  content: { paddingBottom: 112 },
  hero: { marginHorizontal: 16, marginTop: 12, padding: 22, borderRadius: 22, backgroundColor: "#FFF8EE", borderWidth: 1, borderColor: "#D8CDBB" },
  heroIcon: { width: 54, height: 54, borderRadius: 18, backgroundColor: "#E4EFE5", alignItems: "center", justifyContent: "center", marginBottom: 17 },
  eyebrow: { color: "#68786F", fontSize: 10, fontWeight: "900", letterSpacing: 1.4 },
  heroTitle: { color: "#0A3D2E", fontSize: 25, lineHeight: 31, fontWeight: "900", marginTop: 8 },
  heroCopy: { color: "#52685B", fontSize: 13, lineHeight: 20, marginTop: 10 },
  pendingPill: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: "#E4EFE5", borderRadius: 20, paddingHorizontal: 11, paddingVertical: 8, marginTop: 16 },
  pendingText: { color: "#0A3D2E", fontSize: 11, fontWeight: "800" },
  sectionHeading: { marginHorizontal: 18, marginTop: 24, marginBottom: 12 },
  sectionTitle: { color: "#FFF8EE", fontSize: 18, fontWeight: "900" },
  sectionCaption: { color: "#C0D1C5", fontSize: 11, marginTop: 3 },
  metricCard: { flexDirection: "row", alignItems: "flex-start", gap: 13, marginHorizontal: 16, marginBottom: 10, padding: 16, borderRadius: 17, backgroundColor: "#164B39", borderWidth: 1, borderColor: "#32634F" },
  metricIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: "#FFF8EE", alignItems: "center", justifyContent: "center" },
  metricCopy: { flex: 1 },
  metricTitle: { color: "#D9E8DC", fontSize: 12, fontWeight: "700" },
  metricValue: { color: "#FFF8EE", fontSize: 17, fontWeight: "900", marginTop: 5 },
  metricNote: { color: "#C0D1C5", fontSize: 11, lineHeight: 16, marginTop: 5 },
  championCard: { flexDirection: "row", gap: 13, marginHorizontal: 16, marginTop: 8, padding: 17, borderRadius: 17, backgroundColor: "#FFF8EE" },
  championIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: "#FCE9D9", alignItems: "center", justifyContent: "center" },
  championCopy: { flex: 1 },
  championTitle: { color: "#0A3D2E", fontSize: 15, fontWeight: "900" },
  championText: { color: "#52685B", fontSize: 12, lineHeight: 18, marginTop: 5 },
  footerNote: { flexDirection: "row", gap: 8, alignItems: "flex-start", marginHorizontal: 20, marginTop: 15 },
  footerText: { flex: 1, color: "#C0D1C5", fontSize: 10, lineHeight: 15 },
});
