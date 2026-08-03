import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../services/api";

interface TopBarProps {
  title?: string;
  showBack?: boolean;
  showBell?: boolean;
}

export default function TopBar({ title, showBack = true, showBell = true }: TopBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  /* Fetch unread count on mount and when screen focuses */
  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchUnread = async () => {
    try {
      const res = await apiRequest<{
        success: boolean;
        meta?: { unreadCount: number };
      }>("get", "/notifications?page=1&limit=1");
      if (res.success && res.meta) {
        setUnreadCount(res.meta.unreadCount || 0);
      }
    } catch (e) {
      // silently fail — don't block UI
    }
  };

  const isHome = pathname === "/(tabs)" || pathname === "/";

  return (
    <View style={styles.bar}>
      <View style={styles.side}>
        {showBack && !isHome && (
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
        )}
        {title ? (
          <Text style={styles.title}>{title}</Text>
        ) : (
          <View style={styles.brand}>
            <View style={styles.flameLogo}>
              <Text style={{ fontSize: 20 }}>🔥</Text>
            </View>
            <View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Text style={{ fontSize: 11, color: "#8A93A6" }}>📍 Kampala, Uganda</Text>
              </View>
              <Text style={{ fontSize: 17, fontWeight: "700", color: "#fff", marginTop: 1 }}>
                Gasmobil <Text style={{ color: "#1484FF" }}>Uganda</Text>
              </Text>
            </View>
          </View>
        )}
      </View>

      {showBell && (
        <TouchableOpacity
          style={styles.bell}
          onPress={() => router.push("/(tabs)/notifications")}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 16, color: "#fff" }}>🔔</Text>
          {unreadCount > 0 && <View style={styles.dot} />}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 18, paddingTop: 18, paddingBottom: 8,
    backgroundColor: "transparent",
  },
  side: { flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "#1a2236", alignItems: "center", justifyContent: "center",
  },
  backIcon: { color: "#fff", fontSize: 24, fontWeight: "300", lineHeight: 26 },
  title: { color: "#fff", fontSize: 18, fontWeight: "700" },
  brand: { flexDirection: "row", alignItems: "center", gap: 10 },
  flameLogo: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: "#0d2647", borderWidth: 1, borderColor: "#16223a",
    alignItems: "center", justifyContent: "center",
  },
  bell: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: "#121a28", borderWidth: 1, borderColor: "#1F2A3D",
    alignItems: "center", justifyContent: "center",
    position: "relative",
  },
  dot: {
    position: "absolute", top: 9, right: 10,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: "#ff4d4d", borderWidth: 1, borderColor: "#121a28",
  },
});