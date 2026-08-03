import React from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import TopBar from "../src/components/TopBar";
import BottomNav from "../src/components/BottomNav";
import { useOrderStore } from "../src/store/useOrderStore";
import { useProducts } from "../src/hooks/useProducts";
import { COLORS } from "../src/utils/constants";

export default function OrderScreen() {
  const router = useRouter();
  const { orderType, size, setOrderType, setSize } = useOrderStore();
  const { cylinders, loading } = useProducts();

  const sizeMap = new Map<string, typeof cylinders>();
  cylinders.forEach((p) => {
    const s = p.size || "Unknown";
    if (!sizeMap.has(s)) sizeMap.set(s, []);
    sizeMap.get(s)!.push(p);
  });

  const sizes = Array.from(sizeMap.keys()).sort();

  const cheapestPrice = (s: string) => {
    const list = sizeMap.get(s) || [];
    if (list.length === 0) return null;
    return Math.min(...list.map((p) => p.price));
  };

  const totalStock = (s: string) => {
    return (sizeMap.get(s) || []).reduce((sum, p) => sum + p.stock, 0);
  };

  return (
    <View style={styles.container}>
      <TopBar title="Order Gas" showBack onBack={() => router.push("/(tabs)")} />

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.stepper}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.step, i === 0 && styles.stepActive]} />
          ))}
        </View>

        <Text style={styles.label}>What do you need?</Text>
        <View style={styles.chooseRow}>
          {[
            { key: "swap" as const, icon: "🔄", title: "Swap Refill", desc: "Exchange empty for full" },
            { key: "buy" as const, icon: "🛍️", title: "Buy Full Kit", desc: "First-time purchase" },
          ].map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.chooseCard, orderType === opt.key && styles.chooseCardActive]}
              onPress={() => setOrderType(opt.key)}
              activeOpacity={0.8}
            >
              <Text style={styles.chooseIcon}>{opt.icon}</Text>
              <Text style={styles.chooseTitle}>{opt.title}</Text>
              <Text style={styles.chooseDesc}>{opt.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Select size</Text>
        {loading && <ActivityIndicator color={COLORS.accent} style={{ marginTop: 20 }} />}

        <View style={styles.sizes}>
          {sizes.map((s) => {
            const price = cheapestPrice(s);
            const stock = totalStock(s);
            const outOfStock = stock <= 0;
            return (
              <TouchableOpacity
                key={s}
                style={[
                  styles.sizeCard,
                  size === s && styles.sizeCardActive,
                  outOfStock && styles.sizeCardDisabled,
                ]}
                onPress={() => !outOfStock && setSize(s)}
                activeOpacity={0.8}
                disabled={outOfStock}
              >
                {s === "6kg" && !outOfStock && (
                  <View style={styles.popBadge}>
                    <Text style={styles.popText}>POPULAR</Text>
                  </View>
                )}
                <View>
                  <Text style={[styles.sizeTitle, outOfStock && { color: COLORS.muted }]}>
                    {s}
                  </Text>
                  <Text style={styles.sizeSub}>
                    {orderType === "swap" ? "Refill" : "Full Kit"}
                  </Text>
                  {outOfStock && (
                    <Text style={{ color: COLORS.danger, fontSize: 11, marginTop: 2 }}>
                      N/A — Out of stock
                    </Text>
                  )}
                </View>
                <Text style={[styles.sizePrice, outOfStock && { color: COLORS.muted }]}>
                  {price !== null ? `UGX ${price.toLocaleString("en-UG")}` : "—"}
                </Text>
              </TouchableOpacity>
            );
          })}

          {!loading && sizes.length === 0 && (
            <View style={{ alignItems: "center", marginTop: 40 }}>
              <Text style={{ fontSize: 40 }}>⛽</Text>
              <Text style={{ color: COLORS.muted, marginTop: 12 }}>
                No cylinders available
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.continueBtn,
            (!size || totalStock(size) <= 0) && { opacity: 0.4 },
          ]}
          onPress={() => router.push("/order-loc")}
          activeOpacity={0.85}
          disabled={!size || totalStock(size) <= 0}
        >
          <Text style={styles.continueText}>Continue →</Text>
        </TouchableOpacity>
      </ScrollView>

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  stepper: {
    flexDirection: "row", gap: 6, marginHorizontal: 16,
    marginBottom: 16, marginTop: 8,
  },
  step: { flex: 1, height: 3, borderRadius: 2, backgroundColor: "#1E2A44" },
  stepActive: { backgroundColor: COLORS.accent },
  label: {
    fontSize: 13, color: COLORS.text, marginHorizontal: 16,
    marginTop: 18, marginBottom: 10, fontWeight: "600",
  },
  chooseRow: { flexDirection: "row", gap: 10, paddingHorizontal: 16 },
  chooseCard: {
    flex: 1, backgroundColor: COLORS.card, borderWidth: 1,
    borderColor: COLORS.border, borderRadius: 14, padding: 14,
  },
  chooseCardActive: {
    borderColor: COLORS.accent,
    backgroundColor: "rgba(20,132,255,0.08)",
  },
  chooseIcon: { fontSize: 18, color: COLORS.accent, marginBottom: 6 },
  chooseTitle: { color: "#fff", fontSize: 14, fontWeight: "600" },
  chooseDesc: { color: COLORS.muted, fontSize: 11, marginTop: 4 },
  sizes: { paddingHorizontal: 16, gap: 10 },
  sizeCard: {
    position: "relative", backgroundColor: COLORS.card,
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 14,
    padding: 16, flexDirection: "row", justifyContent: "space-between",
    alignItems: "center",
  },
  sizeCardActive: {
    borderColor: COLORS.accent,
    backgroundColor: "rgba(20,132,255,0.08)",
  },
  sizeCardDisabled: { opacity: 0.5, borderColor: "#3a1a1a" },
  popBadge: {
    position: "absolute", top: -8, right: 14,
    backgroundColor: COLORS.accent, paddingHorizontal: 8,
    paddingVertical: 3, borderRadius: 6,
  },
  popText: { color: "#fff", fontSize: 9, fontWeight: "700" },
  sizeTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  sizeSub: { color: COLORS.muted, fontSize: 12 },
  sizePrice: { color: COLORS.accent, fontWeight: "700", fontSize: 14 },
  continueBtn: {
    marginHorizontal: 16, marginTop: 18, marginBottom: 100,
    backgroundColor: COLORS.accent, borderRadius: 999,
    paddingVertical: 14, alignItems: "center",
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35, shadowRadius: 22,
  },
  continueText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
