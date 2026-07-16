import React from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import TopBar from "../src/components/TopBar";
import BottomNav from "../src/components/BottomNav";
import { useCartStore } from "../src/store/useCartStore";
import { COLORS, ACCESSORIES } from "../src/utils/constants";

export default function AccessoriesScreen() {
  const router = useRouter();
  const { addItem, items, total } = useCartStore();
  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <TopBar title="Accessories" showBack onBack={() => router.back()} />

        <View style={styles.header}>
          <Text style={styles.headerTitle}>Upgrade your setup</Text>
          <Text style={styles.headerSub}>Burners, regulators, hosepipes and more</Text>
        </View>

        <View style={styles.list}>
          {ACCESSORIES.map((product) => (
            <View key={product.id} style={styles.item}>
              <View style={styles.img}>
                <Text style={{ fontSize: 28 }}>🔧</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{product.name}</Text>
                <Text style={styles.desc} numberOfLines={2}>{product.description}</Text>
                <Text style={styles.price}>UGX {product.price.toLocaleString()}</Text>
              </View>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => addItem(product)}
                activeOpacity={0.85}
              >
                <Text style={styles.addText}>+ Add</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {cartCount > 0 && (
          <TouchableOpacity style={styles.cartBtn} onPress={() => router.push("/cart")} activeOpacity={0.85}>
            <Text style={styles.cartBtnText}>View Cart ({cartCount}) · UGX {total.toLocaleString()}</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
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
  item: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, padding: 12 },
  img: { width: 50, height: 50, borderRadius: 10, backgroundColor: "#0a1120", alignItems: "center", justifyContent: "center" },
  info: { flex: 1 },
  name: { color: "#fff", fontSize: 13, fontWeight: "600" },
  desc: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  price: { color: COLORS.accent, fontSize: 12, fontWeight: "700", marginTop: 4 },
  addBtn: { backgroundColor: COLORS.accent, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, alignItems: "center", justifyContent: "center" },
  addText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  cartBtn: { marginHorizontal: 16, marginTop: 14, backgroundColor: COLORS.accent, borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  cartBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
