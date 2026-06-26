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
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";

export default function RegisterScreen() {
  const router = useRouter();
  const { isAuthenticated, register, isLoading: authLoading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

  // ── Validation helpers ───────────────────────────────────────
  const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  const isValidUgandaPhone = (val: string) => {
    const cleaned = val.replace(/\s/g, "");
    return /^\+?256[0-9]{9}$/.test(cleaned) || /^0[0-9]{9}$/.test(cleaned);
  };
  const formatUgandaPhone = (val: string) => {
    const cleaned = val.replace(/\s/g, "");
    if (cleaned.startsWith("0") && cleaned.length === 10) {
      return "+256" + cleaned.slice(1);
    }
    return cleaned;
  };

  const handleRegister = async () => {
    // ── Field presence ───────────────────────────────────────
    if (!name.trim() || !email.trim() || !phone.trim() || !password || !confirmPassword) {
      Alert.alert("Missing fields", "Please fill all fields to create your account.");
      return;
    }

    // ── Name validation ────────────────────────────────────────
    if (name.trim().length < 2) {
      Alert.alert("Invalid name", "Please enter your full name.");
      return;
    }

    // ── Email validation ───────────────────────────────────────
    if (!isValidEmail(email.trim())) {
      Alert.alert("Invalid email", "Please enter a valid email address.");
      return;
    }

    // ── Phone validation (Uganda) ──────────────────────────────
    if (!isValidUgandaPhone(phone.trim())) {
      Alert.alert(
        "Invalid phone",
        "Please enter a valid Uganda phone number (e.g., +256 7XX XXX XXX or 07XX XXX XXX)."
      );
      return;
    }

    // ── Password validation ──────────────────────────────────
    if (password.length < 6) {
      Alert.alert("Weak password", "Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Passwords don't match", "Please make sure both passwords are identical.");
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: formatUgandaPhone(phone.trim()),
        password,
      });
      // AuthContext auto-logs in after register, so just navigate
      router.replace("/(tabs)");
    } catch (error: any) {
      const message = error?.response?.data?.error || error?.message || "Please try again.";
      Alert.alert("Registration failed", message);
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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Hero / Branding ────────────────────────────────── */}
          <View style={styles.hero}>
            <Text style={styles.flame}>🔥</Text>
            <Text style={styles.title}>
              Gasmobil <Text style={styles.accent}>Uganda</Text>
            </Text>
            <Text style={styles.subtitle}>Create your account to get started.</Text>
          </View>

          {/* ── Tab Toggle (Sign In / Sign Up) ───────────────── */}
          <View style={styles.tabToggle}>
            <TouchableOpacity
              style={styles.tabBtn}
              onPress={() => router.push("/login")}
              activeOpacity={0.8}
            >
              <Text style={styles.tabText}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tabBtn, styles.tabBtnActive]} activeOpacity={1}>
              <Text style={[styles.tabText, styles.tabTextActive]}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          {/* ── Form Fields ────────────────────────────────────── */}
          <View style={styles.field}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputWrap}>
              <Text style={styles.inputIcon}>👤</Text>
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                placeholderTextColor="#5a6a8a"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                editable={!isSubmitting}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrap}>
              <Text style={styles.inputIcon}>✉️</Text>
              <TextInput
                style={styles.input}
                placeholder="john@example.com"
                placeholderTextColor="#5a6a8a"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isSubmitting}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.inputWrap}>
              <Text style={styles.inputIcon}>📞</Text>
              <TextInput
                style={styles.input}
                placeholder="+256 7XX XXX XXX"
                placeholderTextColor="#5a6a8a"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
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

          <View style={styles.field}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.inputWrap}>
              <Text style={styles.inputIcon}>🔐</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#5a6a8a"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                editable={!isSubmitting}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, isSubmitting && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.buttonText}>Create Account</Text>
                <Text style={styles.buttonArrow}>→</Text>
              </>
            )}
          </TouchableOpacity>

          {/* ── Footer link ────────────────────────────────────── */}
          <TouchableOpacity
            onPress={() => router.push("/login")}
            style={styles.footerLink}
          >
            <Text style={styles.footerText}>
              Already have an account?{" "}
              <Text style={styles.footerAccent}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

// ── Styles (matching HTML dark theme) ────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#070b14",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    padding: 24,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 40,
  },
  hero: {
    alignItems: "center",
    marginBottom: 24,
  },
  flame: {
    fontSize: 64,
    marginBottom: 6,
    textShadowColor: "rgba(20,132,255,0.45)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 20,
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  accent: {
    color: "#1484FF",
  },
  subtitle: {
    color: "#8A93A6",
    fontSize: 13,
    marginTop: 4,
    textAlign: "center",
  },
  tabToggle: {
    flexDirection: "row",
    backgroundColor: "#0e1521",
    borderWidth: 1,
    borderColor: "#1F2A3D",
    borderRadius: 999,
    padding: 4,
    marginBottom: 24,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
  },
  tabBtnActive: {
    backgroundColor: "#1484FF",
    shadowColor: "#1484FF",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
  },
  tabText: {
    color: "#8A93A6",
    fontWeight: "600",
    fontSize: 13,
  },
  tabTextActive: {
    color: "#fff",
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
  footerLink: {
    marginTop: 24,
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