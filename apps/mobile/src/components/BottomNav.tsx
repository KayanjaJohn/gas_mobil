import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "@expo/vector-icons/MaterialCommunityIcons";
import { usePathname, useRouter } from "expo-router";
import { COLORS } from "../utils/constants";

const TABS = [
  { key: "home", label: "Home", icon: "home-variant-outline", route: "/(tabs)" },
  { key: "cart", label: "Cart", icon: "cart-outline", route: "/cart" },
  { key: "tracking", label: "Track", icon: "map-marker-path", route: "/tracking" },
  { key: "green", label: "Green", icon: "leaf", route: "/green" },
  { key: "profile", label: "Profile", icon: "account-outline", route: "/profile" },
];

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (route: string) => {
    if (route === "/(tabs)") return pathname === "/" || pathname === "/(tabs)";
    if (route === "/tracking") return pathname.startsWith("/tracking");
    return pathname === route || pathname.startsWith(`${route}/`);
  };

  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const active = isActive(tab.route);
        return (
          <TouchableOpacity
            key={tab.key}
            accessibilityRole="button"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: active }}
            style={styles.item}
            onPress={() => router.push(tab.route as any)}
            activeOpacity={0.75}
          >
            <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
              <Icon
                name={tab.icon as any}
                size={22}
                color={active ? COLORS.accent : "#FFF8EE"}
              />
            </View>
            <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 10,
    paddingBottom: 25,
    backgroundColor: COLORS.green,
    borderTopWidth: 1,
    borderTopColor: "#245747",
    zIndex: 60,
    elevation: 12,
  },
  item: {
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingVertical: 2,
    paddingHorizontal: 4,
    flex: 1,
  },
  iconWrap: {
    width: 38,
    height: 30,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapActive: { backgroundColor: "rgba(243,106,33,0.20)", borderRadius: 12 },
  label: { fontSize: 11, color: "#FFF8EE", fontWeight: "500" },
  labelActive: { color: COLORS.accent, fontWeight: "800" },
});
