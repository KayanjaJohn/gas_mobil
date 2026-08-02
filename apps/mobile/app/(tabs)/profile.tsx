import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Alert, Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import { apiRequest } from "../../src/services/api";
import TopBar from "../../src/components/TopBar";
import BottomNav from "../../src/components/BottomNav";
import { COLORS } from "../../src/utils/constants";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, updateUser } = useAuth();

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    address: user?.address || "",
    city: user?.city || "",
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateUser(form);
      Alert.alert("Success", "Profile updated successfully");
      setEditing(false);
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.error || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: logout },
    ]);
  };

  return (
    <View style={styles.container}>
      <TopBar title="My Profile" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.name || "?").charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{user?.name || "Guest"}</Text>
          <Text style={styles.email}>{user?.email || ""}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{(user?.role || "customer").toUpperCase()}</Text>
          </View>
        </View>

        {/* Info Cards */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Personal Information</Text>

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
        </View>

        {/* Address Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Delivery Address</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Address</Text>
            {editing ? (
              <TextInput
                style={styles.input}
                value={form.address}
                onChangeText={(t) => setForm({ ...form, address: t })}
                placeholder="Street, building, landmark..."
                placeholderTextColor={COLORS.muted}
                multiline
              />
            ) : (
              <Text style={styles.value}>{user?.address || "Not set"}</Text>
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
              <Text style={styles.value}>{user?.city || "Not set"}</Text>
            )}
          </View>
        </View>

        {/* Actions */}
        <View style={{ marginHorizontal: 16, marginTop: 8 }}>
          {editing ? (
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity style={styles.ghostBtn} onPress={() => setEditing(false)} activeOpacity={0.8}>
                <Text style={styles.ghostText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryBtn, loading && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Save Changes</Text>}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setEditing(true)} activeOpacity={0.8}>
              <Text style={styles.primaryText}>Edit Profile</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push("/(tabs)/orders")} activeOpacity={0.8}>
            <Text style={styles.secondaryText}>📦 My Orders</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
            <Text style={styles.logoutText}>🚪 Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  avatarSection: { alignItems: "center", paddingVertical: 32 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.accent, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  avatarText: { color: "#fff", fontSize: 32, fontWeight: "700" },
  name: { color: "#fff", fontSize: 20, fontWeight: "700" },
  email: { color: COLORS.muted, fontSize: 13, marginTop: 4 },
  roleBadge: { marginTop: 8, backgroundColor: "rgba(20,132,255,0.15)", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },
  roleText: { color: COLORS.accent, fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  card: { marginHorizontal: 16, marginBottom: 14, backgroundColor: COLORS.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  cardTitle: { color: "#fff", fontSize: 15, fontWeight: "700", marginBottom: 14 },
  field: { marginBottom: 14 },
  label: { color: COLORS.muted, fontSize: 12, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  value: { color: "#fff", fontSize: 14 },
  input: { backgroundColor: "#0f172a", borderRadius: 10, padding: 12, color: "#fff", fontSize: 14, borderWidth: 1, borderColor: COLORS.border },
  primaryBtn: { backgroundColor: COLORS.accent, borderRadius: 14, paddingVertical: 14, alignItems: "center", marginBottom: 10 },
  primaryText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  ghostBtn: { flex: 1, backgroundColor: "transparent", borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  ghostText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  secondaryBtn: { backgroundColor: COLORS.card, borderRadius: 14, paddingVertical: 14, alignItems: "center", marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  secondaryText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  logoutBtn: { backgroundColor: "rgba(239,68,68,0.1)", borderRadius: 14, paddingVertical: 14, alignItems: "center", borderWidth: 1, borderColor: "rgba(239,68,68,0.3)" },
  logoutText: { color: "#ef4444", fontWeight: "600", fontSize: 14 },
});