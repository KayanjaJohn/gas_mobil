import React from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import TopBar from "../src/components/TopBar";
import BottomNav from "../src/components/BottomNav";
import { useCartStore } from "../src/store/useCartStore";
import { COLORS } from "../src/utils/constants";

export default function CartScreen() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, total, clearCart } = useCartStore();

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <TopBar title="Your Cart" showBack onBack={() => router.push("/(tabs)")} />

        {items.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 50, marginBottom: 10, opacity: 0.4 }}>🛒</Text>
            <Text style={styles.emptyText}>Your cart is empty</Text>
            <TouchableOpacity style={styles.browseBtn} onPress={() => router.push("/accessories")} activeOpacity={0.85}>
              <Text style={styles.browseText}>Browse Accessories</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 16, paddingBottom: 100 }}>
            {items.map((item, i) => (
              <View key={`${item.product.id}-${i}`} style={styles.cartRow}>
                <View style={styles.img}><Text style={{ fontSize: 24 }}>🔧</Text></View>
                <View style={styles.info}>
                  <Text style={styles.infoName}>{item.product.name}</Text>
                  <Text style={styles.infoPrice}>UGX {item.product.price.toLocaleString()}</Text>
                </View>
                <View style={styles.qtyRow}>
                  <TouchableOpacity onPress={() => updateQuantity(item.product.id, item.quantity - 1)} style={styles.qtyBtn}><Text style={styles.qtyText}>−</Text></TouchableOpacity>
                  <Text style={styles.qtyVal}>{item.quantity}</Text>
                  <TouchableOpacity onPress={() => updateQuantity(item.product.id, item.quantity + 1)} style={styles.qtyBtn}><Text style={styles.qtyText}>+</Text></TouchableOpacity>
                </View>
                <TouchableOpacity onPress={() => removeItem(item.product.id)} style={styles.delBtn}><Text style={{ color: COLORS.danger }}>🗑️</Text></TouchableOpacity>
              </View>
            ))}

            <View style={styles.summary}>
              <View style={styles.sline}><Text style={styles.slabel}>Subtotal</Text><Text style={styles.svalue}>UGX {total.toLocaleString()}</Text></View>
              <View style={styles.sline}><Text style={styles.slabel}>Delivery</Text><Text style={[styles.svalue, { color: COLORS.success }]}>Free</Text></View>
              <View style={[styles.sline, styles.totalLine]}><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalValue}>UGX {total.toLocaleString()}</Text></View>
            </View>

            <TouchableOpacity style={styles.checkoutBtn} onPress={() => { clearCart(); router.push("/order-summary"); }} activeOpacity={0.85}>
              <Text style={styles.checkoutText}>Proceed to Checkout</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  empty: { alignItems: "center", paddingTop: 100 },
  emptyText: { color: COLORS.muted, fontSize: 16, marginBottom: 20 },
  browseBtn: { backgroundColor: COLORS.accent, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999 },
  browseText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  cartRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, padding: 12, marginBottom: 8 },
  img: { width: 50, height: 50, borderRadius: 10, backgroundColor: "#0a1120", alignItems: "center", justifyContent: "center" },
  info: { flex: 1 },
  infoName: { color: "#fff", fontSize: 13, fontWeight: "600" },
  infoPrice: { color: COLORS.accent, fontSize: 12, marginTop: 2 },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  qtyBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: "#1a2236", alignItems: "center", justifyContent: "center" },
  qtyText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  qtyVal: { color: "#fff", fontSize: 14, fontWeight: "600", minWidth: 20, textAlign: "center" },
  delBtn: { padding: 8 },
  summary: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, padding: 16, marginTop: 14 },
  sline: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 7 },
  slabel: { color: COLORS.muted, fontSize: 13 },
  svalue: { color: "#fff", fontSize: 13, fontWeight: "500" },
  totalLine: { borderTopWidth: 1, borderTopColor: COLORS.border, marginTop: 8, paddingTop: 14 },
  totalLabel: { color: "#fff", fontSize: 15, fontWeight: "600" },
  totalValue: { color: COLORS.accent, fontSize: 15, fontWeight: "700" },
  checkoutBtn: { backgroundColor: COLORS.accent, borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 14 },
  checkoutText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});