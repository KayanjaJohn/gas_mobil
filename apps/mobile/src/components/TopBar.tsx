import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { COLORS } from "../utils/constants";
import { useNotificationStore } from "../store/useNotificationStore";
import { useSocketNotifications } from "../hooks/useSocketNotifications";

interface Props {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  right?: React.ReactNode;
}

export default function TopBar({ title, showBack = false, onBack, right }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const isHome = pathname === "/(tabs)" || pathname === "/";

  // ── FIX: Use shared Zustand store instead of local fetch loop ──
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);
  const { isConnected } = useSocketNotifications();

  // Fetch once on mount; socket events and notifications screen handle the rest
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {showBack ? (
          <TouchableOpacity onPress={onBack || (() => router.back())} activeOpacity={0.7}>
            <View style={styles.backBtn}>
              <Text style={styles.backIcon}>←</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.brand}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>🔥</Text>
            </View>
            <View>
              <View style={styles.locRow}>
                <Text style={styles.locIcon}>📍</Text>
                <Text style={styles.locText}>Kampala, Uganda</Text>
              </View>
              <Text style={styles.brandTitle}>
                Gas<Text style={styles.accent}>mobil</Text> Uganda
              </Text>
            </View>
          </View>
        )}
      </View>

      {title && <Text style={styles.title}>{title}</Text>}

      {right ? (
        right
      ) : !showBack ? (
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/notifications")}
          activeOpacity={0.7}
        >
          <View style={styles.bell}>
            <Text style={styles.bellIcon}>🔔</Text>
            {unreadCount > 0 && <View style={styles.dot} />}
          </View>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 8,
  },
  left: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  brand: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: "#0a1830", borderWidth: 1, borderColor: "#16223a",
    alignItems: "center", justifyContent: "center",
  },
  logoText: { fontSize: 20 },
  locRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  locIcon: { fontSize: 10 },
  locText: { fontSize: 11, color: COLORS.muted },
  brandTitle: { fontSize: 17, fontWeight: "600", color: "#fff", letterSpacing: -0.2, marginTop: 2 },
  accent: { color: COLORS.accent },
  title: { fontSize: 18, fontWeight: "700", color: "#fff", flex: 1, textAlign: "center" },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#1a2236", alignItems: "center", justifyContent: "center" },
  backIcon: { color: "#fff", fontSize: 18 },
  bell: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: "#121a28", borderWidth: 1, borderColor: COLORS.border,
    alignItems: "center", justifyContent: "center", position: "relative",
  },
  bellIcon: { fontSize: 16 },
  dot: {
    position: "absolute", top: 9, right: 10,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: COLORS.danger, borderWidth: 1, borderColor: "#121a28",
  },
});