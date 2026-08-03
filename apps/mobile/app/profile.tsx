import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import TopBar from "../src/components/TopBar";
import BottomNav from "../src/components/BottomNav";
import { useAuth } from "../src/context/AuthContext";
import { apiRequest } from "../src/services/api";
import { COLORS } from "../src/utils/constants";

const ROLE_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  customer: { label: "Consumer Mode", color: "#1484FF", bg: "rgba(20,132,255,0.15)" },
  driver:   { label: "Driver Mode",   color: "#22c55e", bg: "rgba(34,197,94,0.15)" },
  agent:    { label: "Agent Mode",    color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
  admin:    { label: "Admin Mode",    color: "#ff4d4d", bg: "rgba(255,77,77,0.15)" },
};

const MENU_ITEMS = [
  { icon: "📦", title: "My Cylinders",    sub: "View & register your cylinders", route: "/cylinders" as const },
  { icon: "💳", title: "Payment Methods", sub: "Wallet, M-Pesa, Airtel",       route: "/payments" as const },
  { icon: "🔔", title: "Notifications",   sub: "Order updates & alerts",       route: "/(tabs)/notifications" as const },
  { icon: "⚡", title: "Auto-Refill",     sub: "Never run out of gas",         route: "/auto-refill" as const },
  { icon: "❓", title: "Help & Support",  sub: "FAQs, call us, report issue",  route: "/help" as const },
  { icon: "🔧", title: "Settings",        sub: "Language, location, privacy",  route: "/settings" as const },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, updateUser } = useAuth();

  const [walletBalance, setWalletBalance] = useState(0);
  const [walletLoading, setWalletLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    address: (user as any)?.address || "",
    city: (user as any)?.city || "",
  });

  const initials = (user?.name || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const role = ROLE_STYLES[user?.role || "customer"] || ROLE_STYLES.customer;

  useEffect(() => {
    fetchWallet();
  }, []);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        phone: user.phone || "",
        address: (user as any)?.address || "",
        city: (user as any)?.city || "",
      });
    }
  }, [user]);

  const fetchWallet = async () => {
    try {
      const res = await apiRequest<{ success: boolean; data?: { balance: number } }>("get", "/wallet");
      if (res.success && res.data) setWalletBalance(Number(res.data.balance) || 0);
    } catch (err) {
      console.error("[Profile] Wallet fetch error:", err);
    } finally {
      setWalletLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.phone) {
      Alert.alert("Missing fields", "Name and phone are required.");
      return;
    }
    setLoading(true);
    try {
      await updateUser({
        name: form.name,
        phone: form.phone,
        address: form.address,
        city: form.city,
      });
      Alert.alert("Success", "Profile updated successfully");
      setEditing(false);
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: async () => {
          await logout();
          router.replace("/login");
        }},
    ]);
  };

  return (
    <View style={styles.container}>
      <TopBar showBack onBack={() => router.push("/(tabs)")} />

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Avatar + Role */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatar, { backgroundColor: role.bg }]}>
            <Text style={[styles.avatarText, { color: role.color }]}>{initials}</Text>
          </View>
          <Text style={styles.name}>{user?.name || "Guest"}</Text>
          <Text style={styles.email}>{user?.email || ""}</Text>
          <View style={[styles.roleBadge, { backgroundColor: role.bg }]}>
            <Text style={[styles.roleText, { color: role.color }]}>{role.label}</Text>
          </View>
        </View>

        {/* Wallet Card */}
        <View style={styles.wallet}>
          <Text style={styles.walletLabel}>GASMOBIL WALLET</Text>
          <Text style={styles.walletBal}>
            UGX {walletBalance.toLocaleString("en-UG")}
          </Text>
          <TouchableOpacity
            style={styles.topupBtn}
            activeOpacity={0.8}
            onPress={() => Alert.alert("Coming Soon", "Wallet top-up will be available shortly.")}
          >
            <Text style={styles.topupText}>Top Up</Text>
          </TouchableOpacity>
        </View>

        {/* Personal Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Personal Information</Text>
            <TouchableOpacity onPress={() => editing ? setEditing(false) : setEditing(true)}>
              <Text style={styles.editLink}>{editing ? "Cancel" : "Edit"}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Full Name</Text>
            {editing ? (
              <TextInput
                style={styles.input}
                value={form.name}
                onChangeText={(t) => setForm({ ...form, name: t })}
                placeholderTextColor={COLORS.muted}
              />
            ) : (
              <Text style={styles.value}>{user?.name || "—"}</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{user?.email || "—"}</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Phone</Text>
            {editing ? (
              <TextInput
                style={styles.input}
                value={form.phone}
                onChangeText={(t) => setForm({ ...form, phone: t })}
                keyboardType="phone-pad"
                placeholderTextColor={COLORS.muted}
              />
            ) : (
              <Text style={styles.value}>{user?.phone || "—"}</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Address</Text>
            {editing ? (
              <TextInput
                style={[styles.input, { minHeight: 60, textAlignVertical: "top" }]}
                value={form.address}
                onChangeText={(t) => setForm({ ...form, address: t })}
                placeholder="Street, building, landmark..."
                placeholderTextColor={COLORS.muted}
                multiline
              />
            ) : (
              <Text style={styles.value}>{(user as any)?.address || "Not set"}</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>City</Text>
            {editing ? (
              <TextInput
                style={styles.input}
                value={form.city}
                onChangeText={(t) => setForm({ ...form, city: t })}
                placeholder="Kampala, Jinja, etc."
                placeholderTextColor={COLORS.muted}
              />
            ) : (
              <Text style={styles.value}>{(user as any)?.city || "Not set"}</Text>
            )}
          </View>

          {editing && (
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
            </TouchableOpacity>
          )}
        </View>

        {/* Menu */}
        <View style={styles.menuCard}>
          {MENU_ITEMS.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.menuItem, i === MENU_ITEMS.length - 1 && { borderBottomWidth: 0 }]}
              activeOpacity={0.7}
              onPress={() => router.push(item.route as any)}
            >
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSub}>{item.sub}</Text>
              </View>
              <Text style={styles.chev}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={styles.logoutText}>🚪  Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  avatarSection: { alignItems: "center", paddingVertical: 28 },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  avatarText: { fontSize: 28, fontWeight: "800" },
  name: { color: "#fff", fontSize: 20, fontWeight: "700", letterSpacing: -0.3 },
  email: { color: COLORS.muted, fontSize: 13, marginTop: 4 },
  roleBadge: { marginTop: 10, paddingHorizontal: 14, paddingVertical: 5, borderRadius: 999 },
  roleText: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },

  wallet: {
    marginHorizontal: 16, marginBottom: 14,
    backgroundColor: "#0e1d3f", borderWidth: 1, borderColor: "#1c2c4a",
    borderRadius: 18, padding: 20,
  },
  walletLabel: { color: COLORS.accent, fontSize: 11, fontWeight: "700", letterSpacing: 1.5 },
  walletBal: { color: "#fff", fontSize: 32, fontWeight: "800", marginVertical: 8 },
  topupBtn: { backgroundColor: COLORS.accent, borderRadius: 999, paddingVertical: 10, paddingHorizontal: 20, alignSelf: "flex-start" },
  topupText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  card: {
    marginHorizontal: 16, marginBottom: 14,
    backgroundColor: COLORS.card, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  cardTitle: { color: "#fff", fontSize: 15, fontWeight: "700" },
  editLink: { color: COLORS.accent, fontSize: 13, fontWeight: "600" },
  field: { marginBottom: 14 },
  label: { color: COLORS.muted, fontSize: 11, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  value: { color: "#fff", fontSize: 14 },
  input: {
    backgroundColor: "#0f172a", borderRadius: 10, padding: 12,
    color: "#fff", fontSize: 14, borderWidth: 1, borderColor: COLORS.border,
  },
  saveBtn: { backgroundColor: COLORS.accent, borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 4 },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  menuCard: {
    marginHorizontal: 16, marginBottom: 14,
    backgroundColor: COLORS.card, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 4,
  },
  menuItem: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 14, paddingHorizontal: 12,
    borderBottomWidth: 1, borderBottomColor: "#131d33",
  },
  menuIcon: { fontSize: 18, width: 32, textAlign: "center" },
  menuTitle: { color: "#fff", fontSize: 14, fontWeight: "600" },
  menuSub: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  chev: { color: COLORS.muted, fontSize: 18 },

  logoutBtn: {
    marginHorizontal: 16, marginTop: 4, marginBottom: 40,
    backgroundColor: "rgba(239,68,68,0.08)",
    borderWidth: 1, borderColor: "rgba(239,68,68,0.3)",
    borderRadius: 14, paddingVertical: 16, alignItems: "center",
  },
  logoutText: { color: "#ff6b6b", fontWeight: "700", fontSize: 14 },
});