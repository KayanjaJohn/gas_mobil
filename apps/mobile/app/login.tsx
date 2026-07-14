import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, KeyboardAvoidingView, Platform,
  TouchableWithoutFeedback, Keyboard, ActivityIndicator,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../src/context/AuthContext";
import { isValidEmail, isValidUgandaPhone } from "../src/utils/validators";
import FlameLogo from "../src/components/FlameLogo";
import { COLORS } from "../src/utils/constants";

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading: authLoading } = useAuth();
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!emailOrPhone.trim() || !password.trim()) {
      Alert.alert("Missing fields", "Please enter your email or phone and password.");
      return;
    }
    const val = emailOrPhone.trim();
    const isEmail = isValidEmail(val);
    const isPhone = isValidUgandaPhone(val);
    if (!isEmail && !isPhone) {
      Alert.alert("Invalid input", "Please enter a valid email or Uganda phone number.");
      return;
    }

    console.log('[Login] Submitting login for:', val);
    setIsSubmitting(true);
    try {
      await login({ emailOrPhone: val, password });
      console.log('[Login] Success, navigating to tabs');
      router.replace("/(tabs)");
    } catch (error: any) {
      const msg = error?.response?.data?.error || error?.message || "Please try again.";
      console.error('[Login] Failed:', msg);
      Alert.alert("Login failed", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <FlameLogo size={72} />
            <Text style={styles.title}>
              Gasmobil <Text style={styles.accent}>Uganda</Text>
            </Text>
            <Text style={styles.subtitle}>Smart Gas Cylinder delivery, in 2 hours.</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email or Phone</Text>
            <View style={styles.inputWrap}>
              <Text style={styles.inputIcon}>📞</Text>
              <TextInput
                style={styles.input}
                placeholder="+256 7XX XXX XXX"
                placeholderTextColor="#5a6a8a"
                value={emailOrPhone}
                onChangeText={setEmailOrPhone}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!isSubmitting}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrap}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#5a6a8a"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!isSubmitting}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, isSubmitting && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign In →</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialBtn} activeOpacity={0.8}>
              <Text style={styles.socialText}>🌐 Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialBtn} activeOpacity={0.8}>
              <Text style={styles.socialText}>🍎 Apple</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => router.push("/register")} style={styles.footerLink}>
            <Text style={styles.footerText}>
              Don’t have an account? <Text style={styles.footerAccent}>Create one</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 24, justifyContent: "center", flexGrow: 1 },
  hero: { alignItems: "center", marginBottom: 36 },
  title: { color: "#fff", fontSize: 26, fontWeight: "700", letterSpacing: -0.4 },
  accent: { color: COLORS.accent },
  subtitle: { color: COLORS.muted, fontSize: 13, marginTop: 6, textAlign: "center" },
  field: { marginBottom: 14 },
  label: { fontSize: 11, color: COLORS.muted, marginBottom: 6, letterSpacing: 0.5, textTransform: "uppercase", fontWeight: "600" },
  inputWrap: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#0e1521", borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  inputIcon: { fontSize: 16 },
  input: { flex: 1, color: COLORS.text, fontSize: 14 },
  button: { alignItems: "center", justifyContent: "center", backgroundColor: COLORS.accent, borderRadius: 999, paddingVertical: 14, marginTop: 8, shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 22 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  divider: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { color: COLORS.muted, fontSize: 11 },
  socialRow: { flexDirection: "row", gap: 10 },
  socialBtn: { flex: 1, backgroundColor: "#0e1521", borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, paddingVertical: 12, alignItems: "center" },
  socialText: { color: COLORS.text, fontSize: 13, fontWeight: "500" },
  footerLink: { marginTop: 28, alignItems: "center" },
  footerText: { color: COLORS.muted, fontSize: 13 },
  footerAccent: { color: COLORS.accent, fontWeight: "700" },
});