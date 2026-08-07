import React from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import TopBar from "../src/components/TopBar";
import BottomNav from "../src/components/BottomNav";
import { useCartStore } from "../src/store/useCartStore";
import { useProducts } from "../src/hooks/useProducts";
import { COLORS } from "../src/utils/constants";

export default function AccessoriesScreen() {
  const router = useRouter();
  const { addItem } = useCartStore();
  const { accessories, loading, error } = useProducts();
  const cartItems = useCartStore((s) => s.items);
  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const total = useCartStore((s) => s.total);

  const getCartQty = (productId: string) =>
    cartItems.find((i) => i.product.id === productId)?.quantity || 0;

  return (
    <View style={styles.container}>
      <TopBar title="Accessories" showBack />
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Upgrade your setup</Text>
          <Text style={styles.headerSub}>Burners, regulators, hosepipes and more</Text>
        </View>

        {loading && <ActivityIndicator color={COLORS.accent} style={{ marginTop: 40 }} />}
        {error ? (
          <Text style={{ color: COLORS.danger, textAlign: "center", marginTop: 20 }}>
            {error}
          </Text>
        ) : null}

        {!loading && accessories.length === 0 && (
          <View style={{ alignItems: "center", marginTop: 60 }}>
            <Text style={{ fontSize: 40 }}>🔧</Text>
            <Text style={{ color: COLORS.muted, marginTop: 12 }}>
              No accessories available
            </Text>
          </View>
        )}

        <View style={styles.list}>
          {accessories.map((product) => {
            const inCart = getCartQty(product.id);
            const outOfStock = product.stock <= 0;
            return (
              <View
                key={product.id}
                style={[styles.item, outOfStock && styles.itemDisabled]}
              >
                <View style={styles.img}>
                  <Text style={{ fontSize: 24 }}>
                    {outOfStock ? "❌" : "🔧"}
                  </Text>
                </View>
                <View style={styles.info}>
                  <Text style={styles.name}>{product.name}</Text>
                  <Text style={styles.desc}>
                    {product.description || "No description"}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
                    <Text style={styles.price}>
                      UGX {product.price.toLocaleString("en-UG")}
                    </Text>
                    {outOfStock ? (
                      <Text style={styles.naBadge}>N/A</Text>
                    ) : (
                      <Text style={styles.stockBadge}>
                        Stock: {product.stock}
                      </Text>
                    )}
                  </View>
                  {inCart > 0 && (
                    <Text style={styles.inCart}>In cart: {inCart}</Text>
                  )}
                </View>
                <TouchableOpacity
                  style={[styles.addBtn, outOfStock && styles.addBtnDisabled]}
                  onPress={() => !outOfStock && addItem(product)}
                  activeOpacity={0.85}
                  disabled={outOfStock}
                >
                  <Text style={styles.addText}>
                    {outOfStock ? "N/A" : "+ Add"}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {cartCount > 0 && (
        <TouchableOpacity
          style={styles.cartBtn}
          onPress={() => router.push("/cart")}
          activeOpacity={0.85}
        >
          <Text style={styles.cartBtnText}>
            View Cart ({cartCount}) · UGX {total.toLocaleString("en-UG")}
          </Text>
        </TouchableOpacity>
      )}
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: 16, marginTop: 8, marginBottom: 12 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  headerSub: { color: COLORS.muted, fontSize: 12, marginTop: 4 },
  list: { paddingHorizontal: 16, gap: 10 },
  item: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 14, padding: 12,
  },
  itemDisabled: { opacity: 0.6, borderColor: "#3a1a1a" },
  img: {
    width: 50, height: 50, borderRadius: 10, backgroundColor: "#0a1120",
    alignItems: "center", justifyContent: "center",
  },
  info: { flex: 1 },
  name: { color: "#fff", fontSize: 13, fontWeight: "600" },
  desc: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  price: { color: COLORS.accent, fontSize: 12, fontWeight: "700" },
  stockBadge: { color: COLORS.success, fontSize: 10, fontWeight: "600" },
  naBadge: {
    color: COLORS.danger, fontSize: 10, fontWeight: "700",
    backgroundColor: "rgba(255,77,77,0.15)", paddingHorizontal: 6,
    paddingVertical: 2, borderRadius: 4,
  },
  inCart: { color: COLORS.warn, fontSize: 10, marginTop: 2 },
  addBtn: {
    backgroundColor: COLORS.accent, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8,
    alignItems: "center", justifyContent: "center",
  },
  addBtnDisabled: { backgroundColor: "#1a2236" },
  addText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  cartBtn: {
    position: "absolute", bottom: 90, left: 16, right: 16,
    backgroundColor: COLORS.accent, borderRadius: 14,
    paddingVertical: 14, alignItems: "center", zIndex: 50,
  },
  cartBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
