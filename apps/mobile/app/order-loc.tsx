import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import TopBar from "../src/components/TopBar";
import BottomNav from "../src/components/BottomNav";
import { useOrderStore } from "../src/store/useOrderStore";
import { COLORS } from "../src/utils/constants";

export default function OrderLocScreen() {
  const router = useRouter();
  const { deliveryAddress, setDeliveryAddress, setNotes, notes } = useOrderStore();
  const [address, setAddress] = useState(deliveryAddress);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <TopBar title="Order Gas" showBack onBack={() => router.back()} />

        <View style={styles.stepper}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.step, i <= 1 && styles.stepActive]} />
          ))}
        </View>

        <View style={{ paddingHorizontal: 16 }}>
          <Text style={styles.sectionTitle}>Delivery location</Text>
          <Text style={styles.sectionSub}>Drop a pin to mark your delivery spot</Text>
        </View>

        {/* Map Placeholder */}
        <View style={styles.map}>
          <View style={styles.pin}>
            <Text style={{ color: "#fff", fontSize: 20 }}>📍</Text>
          </View>
          <Text style={styles.mapHint}>Drag pin on map</Text>
        </View>

        <View style={{ paddingHorizontal: 16, marginTop: 18 }}>
          <Text style={styles.sectionTitle}>Delivery address</Text>
          <Text style={styles.sectionSub}>Add building, street, landmark or instructions</Text>
        </View>

        <TextInput
          style={styles.textarea}
          placeholder="Kampala"
          placeholderTextColor="#5a6a8a"
          multiline
          numberOfLines={3}
          value={address}
          onChangeText={setAddress}
        />

        <TextInput
          style={[styles.textarea, { marginTop: 10, minHeight: 60 }]}
          placeholder="Notes (optional)"
          placeholderTextColor="#5a6a8a"
          multiline
          value={notes}
          onChangeText={setNotes}
        />

        <View style={styles.row2}>
          <TouchableOpacity style={styles.ghostBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Text style={styles.ghostText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.continueBtn}
            onPress={() => {
              setDeliveryAddress(address);
              router.push("/order-summary");
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.continueText}>Continue</Text>
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
  sectionTitle: { color: COLORS.text, fontSize: 15, fontWeight: "600" },
  sectionSub: { color: COLORS.muted, fontSize: 12, marginTop: 4 },
  map: { height: 200, borderRadius: 14, backgroundColor: "#0a1530", borderWidth: 1, borderColor: COLORS.border, marginHorizontal: 16, marginTop: 12, alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" },
  pin: { width: 46, height: 46, borderRadius: 23, backgroundColor: COLORS.accent, alignItems: "center", justifyContent: "center", shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 12 },
  mapHint: { position: "absolute", bottom: 10, color: COLORS.muted, fontSize: 11 },
  textarea: { marginHorizontal: 16, marginTop: 12, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, padding: 14, color: COLORS.text, fontSize: 14, minHeight: 84, textAlignVertical: "top" },
  row2: { flexDirection: "row", gap: 10, marginHorizontal: 16, marginTop: 16, marginBottom: 100 },
  ghostBtn: { flex: 1, backgroundColor: "transparent", borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  ghostText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  continueBtn: { flex: 1.4, backgroundColor: COLORS.accent, borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  continueText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});