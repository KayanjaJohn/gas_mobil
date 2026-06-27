import React from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import TopBar from "../src/components/TopBar";
import BottomNav from "../src/components/BottomNav";
import { useAuth } from "../src/context/AuthContext";
import { COLORS } from "../src/utils/constants";

const MENU_ITEMS = [
  { icon: "📱", title: "My Cylinders", sub: "Scan & register" },
  { icon: "💳", title: "Payment Methods", sub: "Gasmobil Wallet, M-Pesa" },
  { icon: "🔔", title: "Notifications", sub: "Enabled" },
  { icon: "🔄", title: "Auto-Refill", sub: "Configure" },
  { icon: "❓", title: "Help & Support", sub: "FAQs, Contact" },
  { icon: "⚙️", title: "Settings", sub: "Language, Location" },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: logout },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <TopBar title="Profile" showBack onBack={() => router.push("/(tabs)")} />

        <View style={styles.profileCard}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{user?.name?.slice(0, 2).toUpperCase() || "KA"}</Text></View>
          <View>
            <Text style={styles.profileName}>{user?.email || "kayanjajohn@gasmobil.ug"}</Text>
            <View style={styles.modeRow}><View style={styles.modeDot} /><Text style={styles.modeText}>Consumer Mode</Text></View>
          </View>
        </View>

        <View style={styles.wallet}>
          <Text style={styles.walletLabel}>GASMOBIL WALLET</Text>
          <Text style={styles.walletBal}>UGX 0</Text>
          <TouchableOpacity style={styles.topupBtn} activeOpacity={0.85}><Text style={styles.topupText}>Top Up</Text></TouchableOpacity>
        </View>

        <View style={styles.menu}>
          {MENU_ITEMS.map((item, i) => (
            <TouchableOpacity key={i} style={styles.menuItem} activeOpacity={0.7}>
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSub}>{item.sub}</Text>
              </View>
              <Text style={styles.chev}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Text style={styles.logoutText}>🚪 Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  profileCard: { marginHorizontal: 16, marginTop: 8, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: "rgba(20,132,255,0.18)", alignItems: "center", justifyContent: "center" },
  avatarText: { color: COLORS.accent, fontWeight: "700", fontSize: 16 },
  profileName: { color: "#fff", fontSize: 14, fontWeight: "600" },
  modeRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 3 },
  modeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.accent },
  modeText: { color: COLORS.accent, fontSize: 12 },
  wallet: { margin: 16, backgroundColor: "#0a1530", borderWidth: 1, borderColor: "#1c2c4a", borderRadius: 18, padding: 20 },
  walletLabel: { fontSize: 11, color: COLORS.accent, letterSpacing: 1.5, fontWeight: "700" },
  walletBal: { color: "#fff", fontSize: 32, fontWeight: "700", marginTop: 6, marginBottom: 14 },
  topupBtn: { backgroundColor: COLORS.accent, borderRadius: 999, paddingVertical: 10, paddingHorizontal: 20, alignSelf: "flex-start" },
  topupText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  menu: { marginTop: 6 },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 14, marginHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#131d33" },
  menuIcon: { width: 24, textAlign: "center", fontSize: 18 },
  menuTitle: { color: "#fff", fontSize: 14, fontWeight: "600" },
  menuSub: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  chev: { color: COLORS.muted, fontSize: 18 },
  logoutBtn: { marginHorizontal: 16, marginTop: 18, marginBottom: 100, backgroundColor: "transparent", borderWidth: 1, borderColor: "#6b1a1a", borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  logoutText: { color: "#ff6b6b", fontWeight: "700", fontSize: 14 },
});