import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import TopBar from "../src/components/TopBar";
import BottomNav from "../src/components/BottomNav";
import { useOrderStore } from "../src/store/useOrderStore";
import { useAuth } from "../src/context/AuthContext";
import { COLORS } from "../src/utils/constants";
import { apiRequest } from "../src/services/api";

interface Station {
  id: string;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  distance?: number;
}

export default function OrderLocScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { deliveryAddress, setDeliveryAddress, setNotes, notes, setLocation } = useOrderStore();

  const [address, setAddress] = useState(deliveryAddress || user?.address || "");
  const [city, setCity] = useState(user?.city || "");
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [loadingStations, setLoadingStations] = useState(false);
  const [mode, setMode] = useState<"auto" | "manual">("auto");
  const [detecting, setDetecting] = useState(false);

  // Fetch stations on mount
  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    setLoadingStations(true);
    try {
      const res = await apiRequest<{ success: boolean; data: Station[] }>("get", "/stations");
      if (res.success && res.data) {
        setStations(res.data.filter((s) => s.latitude && s.longitude));
      }
    } catch (err) {
      console.error("[OrderLoc] Failed to fetch stations", err);
    } finally {
      setLoadingStations(false);
    }
  };

  // Auto-detect nearest station
  const detectNearest = async () => {
    if (!address || !city) {
      Alert.alert("Address required", "Please enter your delivery address and city first.");
      return;
    }
    setDetecting(true);
    try {
      // Try to get device location
      const { Location } = await import("expo-location");
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Location permission is needed to find the nearest station.");
        setMode("manual");
        setDetecting(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;
      setLocation(latitude, longitude);

      // Calculate distances
      const withDist = stations.map((s) => ({
        ...s,
        distance: haversine(latitude, longitude, s.latitude, s.longitude),
      }));
      withDist.sort((a, b) => (a.distance || 999) - (b.distance || 999));

      if (withDist.length > 0) {
        setSelectedStation(withDist[0]);
        Alert.alert(
          "Nearest Station Found",
          `${withDist[0].name} (${(withDist[0].distance || 0).toFixed(1)} km away)`
        );
      }
    } catch (err: any) {
      console.error("[OrderLoc] Auto-detect failed:", err);
      Alert.alert("Auto-detect failed", "Please select a station manually.");
      setMode("manual");
    } finally {
      setDetecting(false);
    }
  };

  const haversine = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const handleContinue = () => {
    if (!address) {
      Alert.alert("Address required", "Please enter a delivery address.");
      return;
    }
    setDeliveryAddress(`${address}${city ? ", " + city : ""}`);
    router.push("/order-summary");
  };

  return (
    <View style={styles.container}>
      <TopBar title="Delivery Location" onBack={() => router.back()} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Stepper */}
        <View style={styles.stepper}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.step, i <= 1 && styles.stepActive]} />
          ))}
        </View>

        {/* Address Inputs */}
        <Text style={styles.label}>Delivery address</Text>
        <TextInput
          style={styles.textarea}
          placeholder="Street, building, landmark..."
          placeholderTextColor={COLORS.muted}
          value={address}
          onChangeText={setAddress}
          multiline
          numberOfLines={3}
        />

        <Text style={styles.label}>City</Text>
        <TextInput
          style={styles.input}
          placeholder="Kampala, Jinja, etc."
          placeholderTextColor={COLORS.muted}
          value={city}
          onChangeText={setCity}
        />

        {/* Station Selection Mode */}
        <Text style={styles.label}>Select Station</Text>
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === "auto" && styles.modeBtnActive]}
            onPress={() => { setMode("auto"); detectNearest(); }}
            activeOpacity={0.8}
          >
            <Text style={[styles.modeText, mode === "auto" && styles.modeTextActive]}>
              📍 Auto-detect
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === "manual" && styles.modeBtnActive]}
            onPress={() => setMode("manual")}
            activeOpacity={0.8}
          >
            <Text style={[styles.modeText, mode === "manual" && styles.modeTextActive]}>
              🏪 Manual Select
            </Text>
          </TouchableOpacity>
        </View>

        {detecting && (
          <View style={{ padding: 20, alignItems: "center" }}>
            <ActivityIndicator color={COLORS.accent} />
            <Text style={{ color: COLORS.muted, marginTop: 8 }}>Finding nearest station...</Text>
          </View>
        )}

        {mode === "manual" && (
          <>
            {loadingStations ? (
              <ActivityIndicator style={{ margin: 20 }} color={COLORS.accent} />
            ) : (
              stations.map((station) => (
                <TouchableOpacity
                  key={station.id}
                  style={[
                    styles.stationCard,
                    selectedStation?.id === station.id && styles.stationCardActive,
                  ]}
                  onPress={() => setSelectedStation(station)}
                  activeOpacity={0.8}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stationName}>{station.name}</Text>
                    <Text style={styles.stationAddr}>{station.address}, {station.city}</Text>
                    {station.distance !== undefined && (
                      <Text style={styles.stationDist}>{station.distance.toFixed(1)} km away</Text>
                    )}
                  </View>
                  <View style={styles.radio}>
                    {selectedStation?.id === station.id && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
              ))
            )}
          </>
        )}

        {mode === "auto" && selectedStation && !detecting && (
          <View style={[styles.stationCard, styles.stationCardActive]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.stationName}>{selectedStation.name}</Text>
              <Text style={styles.stationAddr}>{selectedStation.address}, {selectedStation.city}</Text>
              <Text style={styles.stationDist}>Selected automatically (nearest)</Text>
            </View>
            <View style={styles.radio}>
              <View style={styles.radioInner} />
            </View>
          </View>
        )}

        {/* Notes */}
        <Text style={styles.label}>Delivery notes (optional)</Text>
        <TextInput
          style={styles.textarea}
          placeholder="Gate code, floor number, landmarks..."
          placeholderTextColor={COLORS.muted}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={2}
        />

        {/* Buttons */}
        <View style={styles.row2}>
          <TouchableOpacity style={styles.ghostBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Text style={styles.ghostText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.continueBtn} onPress={handleContinue} activeOpacity={0.85}>
            <Text style={styles.continueText}>Continue →</Text>
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
  label: { fontSize: 13, color: COLORS.text, marginHorizontal: 16, marginTop: 18, marginBottom: 10, fontWeight: "600" },
  input: { marginHorizontal: 16, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, padding: 14, color: COLORS.text, fontSize: 14 },
  textarea: { marginHorizontal: 16, marginTop: 4, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, padding: 14, color: COLORS.text, fontSize: 14, minHeight: 84, textAlignVertical: "top" },
  modeRow: { flexDirection: "row", gap: 10, marginHorizontal: 16, marginBottom: 12 },
  modeBtn: { flex: 1, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, paddingVertical: 12, alignItems: "center" },
  modeBtnActive: { borderColor: COLORS.accent, backgroundColor: "rgba(20,132,255,0.08)" },
  modeText: { color: COLORS.muted, fontWeight: "600", fontSize: 13 },
  modeTextActive: { color: COLORS.accent },
  stationCard: { marginHorizontal: 16, marginBottom: 10, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center" },
  stationCardActive: { borderColor: COLORS.accent, backgroundColor: "rgba(20,132,255,0.08)" },
  stationName: { color: "#fff", fontSize: 14, fontWeight: "600" },
  stationAddr: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  stationDist: { color: COLORS.accent, fontSize: 11, marginTop: 2, fontWeight: "500" },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.border, alignItems: "center", justifyContent: "center", marginLeft: 10 },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.accent },
  row2: { flexDirection: "row", gap: 10, marginHorizontal: 16, marginTop: 16, marginBottom: 100 },
  ghostBtn: { flex: 1, backgroundColor: "transparent", borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  ghostText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  continueBtn: { flex: 1.4, backgroundColor: COLORS.accent, borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  continueText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});