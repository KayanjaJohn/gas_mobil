import React from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import TopBar from "../src/components/TopBar";
import Card from "../src/components/Card";
import BottomNav from "../src/components/BottomNav";
import { useOrderStore } from "../src/store/useOrderStore";
import { useCartStore } from "../src/store/useCartStore";
import { COLORS, PRICES } from "../src/utils/constants";

const PAY_METHODS = [
  { key: "wallet", icon: "💳", title: "Gasmobil Wallet", sub: "Balance: UGX 0" },
  { key: "momo", icon: "📱", title: "Mobile Money", sub: "M-Pesa / Airtel" },
  { key: "cod", icon: "⏰", title: "Pay Later", sub: "For verified businesses" },
];

export default function OrderSummaryScreen() {
  const router = useRouter();
  const { orderType, size, paymentMethod, setPaymentMethod, reset } = useOrderStore();
  const { items: cartItems, total: cartTotal, clearCart } = useCartStore();

  const cylinderPrice = (PRICES as any)[orderType][size];
  const total = cylinderPrice + cartTotal;

  const placeOrder = () => {
    console.log('[Order] Placing order | type:', orderType, '| size:', size, '| total:', total, '| payment:', paymentMethod);
    Alert.alert("Order Placed!", "Your gas order has been placed successfully.", [
      { text: "Track Now", onPress: () => { reset(); clearCart(); console.log('[Order] Navigating to tracking'); router.push("/tracking"); } },
      { text: "OK", onPress: () => { reset(); clearCart(); console.log('[Order] Navigating home'); router.push("/(tabs)"); } },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <TopBar title="Order Gas" showBack onBack={() => router.back()} />

        <View style={styles.stepper}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.step, styles.stepActive]} />
          ))}
        </View>

        <Card style={styles.summary}>
          <Text style={styles.summaryTitle}>Order Summary</Text>
          <View style={styles.sline}><Text style={styles.slabel}>Type</Text><Text style={styles.svalue}>{orderType === "swap" ? "Swap Refill" : "Buy Full Kit"}</Text></View>
          <View style={styles.sline}><Text style={styles.slabel}>Size</Text><Text style={styles.svalue}>{size}</Text></View>
          <View style={styles.sline}><Text style={styles.slabel}>Delivery</Text><Text style={[styles.svalue, { color: COLORS.success }]}>Within 2 hours</Text></View>
          <View style={styles.sline}><Text style={styles.slabel}>Cylinder ({size})</Text><Text style={styles.svalue}>UGX {cylinderPrice.toLocaleString()}</Text></View>
          {cartTotal > 0 && (
            <View style={styles.sline}><Text style={styles.slabel}>Accessories</Text><Text style={styles.svalue}>UGX {cartTotal.toLocaleString()}</Text></View>
          )}
          <View style={[styles.sline, styles.totalLine]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>UGX {total.toLocaleString()}</Text>
          </View>
        </Card>

        <TouchableOpacity style={styles.addCard} onPress={() => router.push("/accessories")} activeOpacity={0.8}>
          <View style={styles.addIcon}><Text style={{ fontSize: 18 }}>🔥</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.addTitle}>Need a burner, regulator or hosepipe?</Text>
            <Text style={styles.addSub}>Browse accessories to add to this order</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.label}>Pay with</Text>
        <View style={{ paddingHorizontal: 16, gap: 10 }}>
          {PAY_METHODS.map((m) => (
            <TouchableOpacity
              key={m.key}
              style={[styles.payOpt, paymentMethod === m.key && styles.payOptActive]}
              onPress={() => setPaymentMethod(m.key)}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 18, width: 28 }}>{m.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.payTitle}>{m.title}</Text>
                <Text style={styles.paySub}>{m.sub}</Text>
              </View>
              <Text style={{ color: COLORS.muted }}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.row2}>
          <TouchableOpacity style={styles.ghostBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Text style={styles.ghostText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.placeBtn} onPress={placeOrder} activeOpacity={0.85}>
            <Text style={styles.placeText}>Place Order</Text>
          </TouchableOpacity>
        </View>
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
  summary: { marginBottom: 14 },
  summaryTitle: { color: "#fff", fontSize: 14, fontWeight: "600", marginBottom: 12 },
  sline: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 7 },
  slabel: { color: COLORS.muted, fontSize: 13 },
  svalue: { color: "#fff", fontSize: 13, fontWeight: "500" },
  totalLine: { borderTopWidth: 1, borderTopColor: COLORS.border, marginTop: 8, paddingTop: 14 },
  totalLabel: { color: "#fff", fontSize: 15, fontWeight: "600" },
  totalValue: { color: COLORS.accent, fontSize: 15, fontWeight: "700" },
  addCard: { marginHorizontal: 16, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, padding: 14, flexDirection: "row", gap: 12, alignItems: "center", marginBottom: 6 },
  addIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: "rgba(245,158,11,0.12)", alignItems: "center", justifyContent: "center" },
  addTitle: { color: "#fff", fontSize: 13, fontWeight: "600" },
  addSub: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  label: { fontSize: 13, color: COLORS.text, marginHorizontal: 16, marginTop: 18, marginBottom: 10, fontWeight: "600" },
  payOpt: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  payOptActive: { borderColor: COLORS.accent },
  payTitle: { color: "#fff", fontSize: 14, fontWeight: "600" },
  paySub: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  row2: { flexDirection: "row", gap: 10, marginHorizontal: 16, marginTop: 16, marginBottom: 100 },
  ghostBtn: { flex: 1, backgroundColor: "transparent", borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  ghostText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  placeBtn: { flex: 1.4, backgroundColor: COLORS.accent, borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  placeText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});