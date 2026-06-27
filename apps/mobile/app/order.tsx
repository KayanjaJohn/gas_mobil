import React from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import TopBar from "../src/components/TopBar";
import Card from "../src/components/Card";
import BottomNav from "../src/components/BottomNav";
import { useOrderStore } from "../src/store/useOrderStore";
import { COLORS, PRICES } from "../src/utils/constants";

const SIZES = ["6kg", "12kg", "45kg"] as const;

export default function OrderScreen() {
  const router = useRouter();
  const { orderType, size, setOrderType, setSize } = useOrderStore();

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <TopBar title="Order Gas" showBack onBack={() => router.push("/(tabs)")} />

        {/* Stepper */}
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
        <View style={styles.sizes}>
          {SIZES.map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.sizeCard, size === s && styles.sizeCardActive]}
              onPress={() => setSize(s)}
              activeOpacity={0.8}
            >
              {s === "6kg" && (
                <View style={styles.popBadge}>
                  <Text style={styles.popText}>POPULAR</Text>
                </View>
              )}
              <View>
                <Text style={styles.sizeTitle}>{s}</Text>
                <Text style={styles.sizeSub}>{orderType === "swap" ? "Refill" : "Full Kit"}</Text>
              </View>
              <Text style={styles.sizePrice}>
                UGX {(PRICES as any)[orderType][s].toLocaleString()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.continueBtn}
          onPress={() => router.push("/order-loc")}
          activeOpacity={0.85}
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
  stepper: { flexDirection: "row", gap: 6, marginHorizontal: 16, marginBottom: 16, marginTop: 8 },
  step: { flex: 1, height: 3, borderRadius: 2, backgroundColor: "#1E2A44" },
  stepActive: { backgroundColor: COLORS.accent },
  label: { fontSize: 13, color: COLORS.text, marginHorizontal: 16, marginTop: 18, marginBottom: 10, fontWeight: "600" },
  chooseRow: { flexDirection: "row", gap: 10, paddingHorizontal: 16 },
  chooseCard: { flex: 1, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, padding: 14 },
  chooseCardActive: { borderColor: COLORS.accent, backgroundColor: "rgba(20,132,255,0.08)" },
  chooseIcon: { fontSize: 18, color: COLORS.accent, marginBottom: 6 },
  chooseTitle: { color: "#fff", fontSize: 14, fontWeight: "600" },
  chooseDesc: { color: COLORS.muted, fontSize: 11, marginTop: 4 },
  sizes: { paddingHorizontal: 16, gap: 10 },
  sizeCard: { position: "relative", backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, padding: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sizeCardActive: { borderColor: COLORS.accent, backgroundColor: "rgba(20,132,255,0.08)" },
  popBadge: { position: "absolute", top: -8, right: 14, backgroundColor: COLORS.accent, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  popText: { color: "#fff", fontSize: 9, fontWeight: "700" },
  sizeTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  sizeSub: { color: COLORS.muted, fontSize: 12 },
  sizePrice: { color: COLORS.accent, fontWeight: "700", fontSize: 14 },
  continueBtn: { marginHorizontal: 16, marginTop: 18, marginBottom: 100, backgroundColor: COLORS.accent, borderRadius: 999, paddingVertical: 14, alignItems: "center", shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 22 },
  continueText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});