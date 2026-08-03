import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { COLORS } from "../utils/constants";
import { apiRequest } from "../services/api";

interface Props {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  right?: React.ReactNode;
}

export default function TopBar({ title, showBack = false, onBack, right }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  const isHome = pathname === "/(tabs)" || pathname === "/";

  useEffect(() => {
    fetchUnread();
    const id = setInterval(fetchUnread, 30000);
    return () => clearInterval(id);
  }, []);

  const fetchUnread = async () => {
    try {
      const res = await apiRequest<{ success: boolean; meta?: { unreadCount: number } }>(
        "get", "/notifications?page=1&limit=1"
      );
      if (res.success && res.meta) setUnreadCount(res.meta.unreadCount || 0);
    } catch {
      // silent
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {showBack ? (
          <TouchableOpacity style={styles.backBtn} onPress={onBack || (() => router.back())} activeOpacity={0.7}>
            <Text style={styles.backIcon}>←</Text>
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
                Gasmobil <Text style={styles.accent}>Uganda</Text>
              </Text>
            </View>
          </View>
        )}
        {title && <Text style={styles.title}>{title}</Text>}
      </View>

      {right ? (
        right
      ) : !showBack ? (
        <TouchableOpacity
          style={styles.bell}
          onPress={() => router.push("/(tabs)/notifications")}
          activeOpacity={0.7}
        >
          <Text style={styles.bellIcon}>🔔</Text>
          {unreadCount > 0 && <View style={styles.dot} />}
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