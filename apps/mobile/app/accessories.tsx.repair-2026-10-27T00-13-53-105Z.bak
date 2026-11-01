import React from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Image,
} from "react-native";
import { useRouter } from "expo-router";
import TopBar from "../src/components/TopBar";
import BottomNav from "../src/components/BottomNav";
import { useCartStore } from "../src/store/useCartStore";
import { useProducts } from "../src/hooks/useProducts";
import { COLORS } from "../src/utils/constants";

const API_BASE = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function AccessoriesScreen() {
  const router = useRouter();
  const { addItem } = useCartStore();
  const { accessories, loading, error } = useProducts();
  const cartItems = useCartStore((s) => s.items);
  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const total = useCartStore((s) => s.total);

  const getCartQty = (productId: string) =>
    cartItems.find((i) => i.product.id === productId)?.quantity || 0;

  const getImageUrl = (imageUrl: string | null) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${API_BASE}${imageUrl}`;
  };

  return (
    <View style={styles.container}>
      <TopBar showBack onBack={() => router.back()} />

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🔧 Accessories</Text>
          <Text style={styles.headerSub}>Burners, regulators, hosepipes and more</Text>
        </View>

        {loading && <ActivityIndicator style={{ marginTop: 20 }} color={COLORS.accent} />}
        {error ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {!loading && accessories.length === 0 && (
          <View style={styles.center}>
            <Text style={styles.emptyIcon}>🔧</Text>
            <Text style={styles.emptyTitle}>No accessories available</Text>
          </View>
        )}

        <View style={styles.list}>
          {accessories.map((product) => {
            const inCart = getCartQty(product.id);
            const outOfStock = product.stock <= 0;
            const imgUrl = getImageUrl(product.imageUrl);

            return (
              <View
                key={product.id}
                style={[styles.item, outOfStock && styles.itemDisabled]}
              >
                {/* ── FIX: Show actual product image ── */}
                <View style={styles.imgWrap}>
                  {imgUrl ? (
                    <Image
                      source={{ uri: imgUrl }}
                      style={styles.img}
                      resizeMode="cover"
                      onError={(e) => {
                        console.warn('[Accessories] Image load error:', imgUrl, e.nativeEvent.error);
                      }}
                    />
                  ) : (
                    <View style={styles.imgFallback}>
                      <Text style={{ fontSize: 20 }}>{outOfStock ? "❌" : "🔧"}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.info}>
                  <Text style={styles.name}>{product.name}</Text>
                  <Text style={styles.desc}>{product.description || "No description"}</Text>
                  <Text style={styles.price}>UGX {product.price.toLocaleString("en-UG")}</Text>
                  {outOfStock ? (
                    <Text style={styles.naBadge}>Out of stock</Text>
                  ) : (
                    <Text style={styles.stockBadge}>Stock: {product.stock}</Text>
                  )}
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
                  <Text style={styles.addText}>{outOfStock ? "N/A" : "+ Add"}</Text>
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
  center: { alignItems: "center", marginTop: 40 },
  errorText: { color: COLORS.danger, fontSize: 14 },
  emptyIcon: { fontSize: 48, marginBottom: 8 },
  emptyTitle: { color: "#fff", fontSize: 16, fontWeight: "600" },
  list: { paddingHorizontal: 16, gap: 10 },
  item: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 14, padding: 12,
  },
  itemDisabled: { opacity: 0.6, borderColor: "#3a1a1a" },
  imgWrap: {
    width: 56, height: 56, borderRadius: 12, overflow: "hidden",
    backgroundColor: "#0a1120",
  },
  img: { width: 56, height: 56 },
  imgFallback: {
    width: 56, height: 56, alignItems: "center", justifyContent: "center",
  },
  info: { flex: 1 },
  name: { color: "#fff", fontSize: 13, fontWeight: "600" },
  desc: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  price: { color: COLORS.accent, fontSize: 12, fontWeight: "700", marginTop: 4 },
  stockBadge: { color: COLORS.success, fontSize: 10, fontWeight: "600", marginTop: 2 },
  naBadge: {
    color: COLORS.danger, fontSize: 10, fontWeight: "700",
    backgroundColor: "rgba(255,77,77,0.15)", paddingHorizontal: 6,
    paddingVertical: 2, borderRadius: 4, marginTop: 2, alignSelf: "flex-start",
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