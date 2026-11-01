import React, { useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, Image, ImageBackground, KeyboardAvoidingView,
  Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../src/context/AuthContext";

export default function LoginScreen() {
  const router = useRouter();
  const { isAuthenticated, login } = useAuth();
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) router.replace("/(tabs)");
  }, [isAuthenticated, router]);

  const handleLogin = async () => {
    if (!emailOrPhone.trim() || !password) {
      Alert.alert("Missing details", "Enter your email or phone number and password.");
      return;
    }
    setLoading(true);
    try {
      await login({ emailOrPhone: emailOrPhone.trim(), password });
      router.replace("/(tabs)");
    } catch (error: any) {
      Alert.alert("Sign in failed", error?.response?.data?.error || error?.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground source={require("../assets/gasmobil-login-bg.jpg")} resizeMode="cover" style={styles.background}>
      <View style={styles.shade} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Image source={require("../assets/gasmobil-icon.png")} style={styles.logo} resizeMode="contain" />
            <Text style={styles.brand}>GasMobil <Text style={styles.brandAccent}>Uganda</Text></Text>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to order gas and track your delivery.</Text>

            <View style={styles.field}>
              <Ionicons name="mail-outline" size={19} color="#FFC08F" />
              <TextInput style={styles.input} placeholder="Email or Phone" placeholderTextColor="#B7C8BF"
                value={emailOrPhone} onChangeText={setEmailOrPhone} autoCapitalize="none"
                keyboardType="email-address" autoComplete="username" />
            </View>

            <View style={styles.field}>
              <Ionicons name="lock-closed-outline" size={19} color="#FFC08F" />
              <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#B7C8BF"
                value={password} onChangeText={setPassword} secureTextEntry={!showPassword}
                autoComplete="current-password" />
              <TouchableOpacity onPress={() => setShowPassword((value) => !value)} accessibilityRole="button"
                accessibilityLabel={showPassword ? "Hide password" : "Show password"}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={21} color="#FFC08F" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.forgot} onPress={() => router.push("/forgot-password")}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, loading && styles.disabled]} onPress={handleLogin} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
            </TouchableOpacity>

            <View style={styles.bottomRow}>
              <Text style={styles.bottomText}>New to GasMobil? </Text>
              <TouchableOpacity onPress={() => router.push("/register")}>
                <Text style={styles.link}>Create account</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.footer}>Reliable LPG delivery in Uganda • Cash on delivery</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: "#061D16" },
  shade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(1,17,12,.38)" },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 18, alignItems: "center" },
  card: { width: "100%", maxWidth: 460, alignSelf: "center", padding: 26, borderRadius: 24,
    backgroundColor: "rgba(3,25,18,.74)", borderWidth: 1, borderColor: "rgba(255,248,238,.25)" },
  logo: { width: 78, height: 78, alignSelf: "center", marginBottom: 5 },
  brand: { color: "#FFF8EE", textAlign: "center", fontSize: 23, fontWeight: "900", fontFamily: "sans-serif" },
  brandAccent: { color: "#F36A21" },
  title: { color: "#FFF8EE", textAlign: "center", fontSize: 27, fontWeight: "800", fontFamily: "sans-serif", marginTop: 17 },
  subtitle: { color: "#C7D8CF", textAlign: "center", fontSize: 14, marginTop: 7, marginBottom: 22, lineHeight: 20 },
  field: { flexDirection: "row", alignItems: "center", gap: 11, minHeight: 56, paddingHorizontal: 14,
    marginBottom: 14, borderWidth: 1, borderColor: "rgba(255,248,238,.34)", borderRadius: 12,
    backgroundColor: "rgba(2,19,14,.74)" },
  input: { flex: 1, color: "#FFF8EE", fontSize: 15, paddingVertical: 14, fontFamily: "sans-serif" },
  forgot: { alignSelf: "flex-end", paddingVertical: 5, marginTop: -3 },
  forgotText: { color: "#FFC08F", fontSize: 13, fontWeight: "700" },
  button: { minHeight: 54, borderRadius: 12, backgroundColor: "#F36A21", alignItems: "center",
    justifyContent: "center", marginTop: 14 },
  disabled: { opacity: .65 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "900" },
  bottomRow: { flexDirection: "row", justifyContent: "center", marginTop: 22 },
  bottomText: { color: "#D6E2DB", fontSize: 13 },
  link: { color: "#FFC08F", fontWeight: "800", fontSize: 13 },
  footer: { color: "#91A99C", textAlign: "center", marginTop: 20, fontSize: 10 },
});
