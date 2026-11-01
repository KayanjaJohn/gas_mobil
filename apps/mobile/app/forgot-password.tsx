import React, { useState } from "react";
import { ActivityIndicator, Alert, Image, ImageBackground, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import api from "../src/services/api";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (!email.trim()) { Alert.alert("Email required", "Enter the email address on your GasMobil account."); return; }
    setLoading(true);
    try {
      const response = await api.post("/auth/forgot-password", { email: email.trim() });
      setSent(true);
      Alert.alert("Check your email", response.data?.message || "If the account exists, reset instructions have been sent.");
    } catch (error: any) {
      Alert.alert("Recovery unavailable", error?.response?.data?.error || "Please try again later or contact GasMobil support.");
    } finally { setLoading(false); }
  };

  return (
    <ImageBackground source={require("../assets/gasmobil-login-bg.jpg")} resizeMode="cover" style={styles.background}>
      <View style={styles.shade} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Image source={require("../assets/gasmobil-icon.png")} style={styles.logo} resizeMode="contain" />
            <Text style={styles.brand}>GasMobil <Text style={{ color: "#F36A21" }}>Uganda</Text></Text>
            <Text style={styles.title}>Reset your password</Text>
            <Text style={styles.subtitle}>Enter your account email and we'll send a secure reset link if the account exists.</Text>
            {sent && <Text style={styles.success}>Request submitted. Check your inbox and spam folder.</Text>}
            <View style={styles.field}>
              <Ionicons name="mail-outline" size={19} color="#FFC08F" />
              <TextInput style={styles.input} placeholder="Account email" placeholderTextColor="#B7C8BF"
                value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
            </View>
            <TouchableOpacity style={styles.button} onPress={submit} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send reset link</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.back} onPress={() => router.replace("/login")}>
              <Text style={styles.backText}>← Back to sign in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: "#061D16" }, shade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(1,17,12,.38)" },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 22 },
  card: { width: "100%", maxWidth: 460, alignSelf: "center", padding: 26, borderRadius: 24, backgroundColor: "rgba(3,25,18,.9)", borderWidth: 1, borderColor: "#ffffff40" },
  logo: { width: 78, height: 78, alignSelf: "center" }, brand: { color: "#FFF8EE", textAlign: "center", fontSize: 22, fontWeight: "900" },
  title: { color: "#FFF8EE", textAlign: "center", fontSize: 25, fontWeight: "800", marginTop: 20 },
  subtitle: { color: "#C7D8CF", textAlign: "center", lineHeight: 20, marginTop: 8, marginBottom: 22 },
  success: { color: "#A7F3D0", textAlign: "center", marginBottom: 12 },
  field: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderColor: "#ffffff50", borderRadius: 12, paddingHorizontal: 14, backgroundColor: "#02130EBB" },
  input: { flex: 1, paddingVertical: 16, color: "#FFF8EE", fontSize: 15 },
  button: { minHeight: 54, backgroundColor: "#F36A21", borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 18 },
  buttonText: { color: "#fff", fontWeight: "900", fontSize: 16 }, back: { alignItems: "center", padding: 15, marginTop: 6 },
  backText: { color: "#FFC08F", fontWeight: "700" },
});
