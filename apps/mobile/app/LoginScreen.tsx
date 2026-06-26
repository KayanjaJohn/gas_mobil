import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";

export default function LoginScreen() {
  const router = useRouter();
  const { isAuthenticated, login, isLoading: authLoading } = useAuth();
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Redirect if already authenticated ────────────────────────
  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, router]);

  // Show loading while auth state is hydrating
  if (authLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#1484FF" />
      </View>
    );
  }

  const handleLogin = async () => {
    // ── Validation ─────────────────────────────────────────────
    if (!emailOrPhone.trim() || !password.trim()) {
      Alert.alert("Missing fields", "Please enter your email or phone and password.");
      return;
    }

    // Basic email/phone format check
    const isEmail = emailOrPhone.includes("@");
    const isPhone = /^\+?[0-9]{9,15}$/.test(emailOrPhone.replace(/\s/g, ""));
    if (!isEmail && !isPhone) {
      Alert.alert("Invalid input", "Please enter a valid email or phone number.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ emailOrPhone: emailOrPhone.trim(), password });
      router.replace("/(tabs)");
    } catch (error: any) {
      const message = error?.response?.data?.error || error?.message || "Please try again.";
      Alert.alert("Login failed", message);
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
        <View style={styles.inner}>
          {/* ── Hero / Branding (matches HTML design) ──────────── */}
          <View style={styles.hero}>
            <Text style={styles.flame}>🔥</Text>
            <Text style={styles.title}>
              Gasmobil <Text style={styles.accent}>Uganda</Text>
            </Text>
            <Text style={styles.subtitle}>Smart Gas Cylinder delivery, in 2 hours.</Text>
          </View>

          {/* ── Form ───────────────────────────────────────────── */}
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
                autoCorrect={false}
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
              <>
                <Text style={styles.buttonText}>Sign In</Text>
                <Text style={styles.buttonArrow}>→</Text>
              </>
            )}
          </TouchableOpacity>

          {/* ── Divider ────────────────────────────────────────── */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* ── Social Login (placeholder) ───────────────────── */}
          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialBtn} activeOpacity={0.8}>
              <Text style={styles.socialText}>🌐 Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialBtn} activeOpacity={0.8}>
              <Text style={styles.socialText}>🍎 Apple</Text>
            </TouchableOpacity>
          </View>

          {/* ── Footer link ────────────────────────────────────── */}
          <TouchableOpacity
            onPress={() => router.push("/register")}
            style={styles.footerLink}
          >
            <Text style={styles.footerText}>
              Don’t have an account?{" "}
              <Text style={styles.footerAccent}>Create one</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

// ── Styles (matching the HTML dark theme) ────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#070b14",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  inner: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  hero: {
    alignItems: "center",
    marginBottom: 36,
  },
  flame: {
    fontSize: 72,
    marginBottom: 8,
    textShadowColor: "rgba(20,132,255,0.45)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 20,
  },
  title: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  accent: {
    color: "#1484FF",
  },
  subtitle: {
    color: "#8A93A6",
    fontSize: 13,
    marginTop: 6,
    textAlign: "center",
  },
  field: {
    marginBottom: 14,
  },
  label: {
    fontSize: 11,
    color: "#8A93A6",
    marginBottom: 6,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#0e1521",
    borderWidth: 1,
    borderColor: "#1F2A3D",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputIcon: {
    fontSize: 16,
    color: "#5a6a8a",
  },
  input: {
    flex: 1,
    color: "#E6EAF2",
    fontSize: 14,
    fontFamily: "Inter",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#1484FF",
    borderRadius: 999,
    paddingVertical: 14,
    marginTop: 8,
    shadowColor: "#1484FF",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 22,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  buttonArrow: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#1F2A3D",
  },
  dividerText: {
    color: "#8A93A6",
    fontSize: 11,
  },
  socialRow: {
    flexDirection: "row",
    gap: 10,
  },
  socialBtn: {
    flex: 1,
    backgroundColor: "#0e1521",
    borderWidth: 1,
    borderColor: "#1F2A3D",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  socialText: {
    color: "#E6EAF2",
    fontSize: 13,
    fontWeight: "500",
  },
  footerLink: {
    marginTop: 28,
    alignItems: "center",
  },
  footerText: {
    color: "#8A93A6",
    fontSize: 13,
  },
  footerAccent: {
    color: "#1484FF",
    fontWeight: "700",
  },
});