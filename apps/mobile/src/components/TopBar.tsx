import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "@expo/vector-icons/MaterialCommunityIcons";
import { useRouter, usePathname } from "expo-router";
import { COLORS } from "../utils/constants";
import { useNotificationStore } from "../store/useNotificationStore";
import { useSocketNotifications } from "../hooks/useSocketNotifications";

interface Props {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  right?: React.ReactNode;
  locationLabel?: string;
}

export default function TopBar({ title, showBack = false, onBack, right, locationLabel }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);
  const { isConnected } = useSocketNotifications();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {showBack ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={onBack || (() => router.back())}
            activeOpacity={0.75}
            style={styles.backBtn}
          >
            <Icon name="arrow-left" size={22} color={COLORS.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.brand}>
            <View style={styles.logo}>
              <Icon name="fire" size={25} color={COLORS.accent} />
            </View>
            <View>
              <View style={styles.locRow}>
                <Icon name="map-marker" size={13} color={COLORS.accent} />
                <Text style={styles.locText} numberOfLines={1}>{locationLabel || "Current city unavailable"}</Text>
                <View style={[styles.connectionDot, { backgroundColor: isConnected ? "#35B879" : COLORS.muted }]} />
              </View>
              <Text style={styles.brandTitle}>
                <Text style={styles.brandCream}>GAS</Text><Text style={styles.accent}>MOBIL</Text><Text style={styles.brandCream}> Uganda</Text>
              </Text>
            </View>
          </View>
        )}
      </View>

      {title && <Text numberOfLines={1} style={styles.title}>{title}</Text>}

      {right ? right : !showBack ? (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
          onPress={() => router.push("/(tabs)/notifications")}
          activeOpacity={0.75}
          style={styles.bell}
        >
          <Icon name="bell-outline" size={22} color={COLORS.text} />
          {unreadCount > 0 && (
            <View style={styles.dot}>
              {unreadCount > 9 && <Text style={styles.dotText}>9+</Text>}
            </View>
          )}
        </TouchableOpacity>
      ) : <View style={styles.trailingSpacer} />}
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
    minHeight: 66,
  },
  left: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  brand: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: {
    width: 40, height: 40, borderRadius: 13,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    alignItems: "center", justifyContent: "center",
  },
  locRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  locText: { fontSize: 11, color: "#D8E7DE" },
  connectionDot: { width: 5, height: 5, borderRadius: 3, marginLeft: 2 },
  brandTitle: { flexDirection: "row", alignItems: "baseline", fontSize: 17, fontWeight: "800", letterSpacing: -0.2, marginTop: 2 },
  brandCream: { color: "#FFF8EE", fontWeight: "800" },
  accent: { color: COLORS.accent },
  title: { fontSize: 17, fontWeight: "700", color: COLORS.text, flex: 1, textAlign: "center" },
  backBtn: {
    width: 40, height: 40, borderRadius: 13, backgroundColor: COLORS.card,
    borderWidth: 1, borderColor: COLORS.border, alignItems: "center", justifyContent: "center",
  },
  bell: {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    alignItems: "center", justifyContent: "center", position: "relative",
  },
  dot: {
    position: "absolute", top: 3, right: 3, minWidth: 14, height: 14,
    borderRadius: 8, backgroundColor: "#E11D48", borderWidth: 1.5, borderColor: COLORS.card,
    shadowColor: "#E11D48", shadowOpacity: 0.7, shadowRadius: 5, shadowOffset: { width: 0, height: 1 }, elevation: 8,
    alignItems: "center", justifyContent: "center",
  },
  dotText: { color: "#fff", fontSize: 8, fontWeight: "900", paddingHorizontal: 3 },
  trailingSpacer: { width: 40 },
});
