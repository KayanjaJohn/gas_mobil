import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../src/context/AuthContext";

export default function LoginScreen() {
  const router = useRouter();
  const { isAuthenticated, login } = useAuth();
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    router.replace("/(tabs)");
    return null;
  }

  const handleLogin = async () => {
    if (!emailOrPhone || !password) {
      Alert.alert("Missing fields", "Please enter your email or phone and password.");
      return;
    }

    setLoading(true);
    try {
      await login({ emailOrPhone, password });
      router.replace("/(tabs)");
    } catch (error: any) {
      // ── FIX: Extract the actual server error message ──
      const serverMessage =
        error?.response?.data?.error ||      // Our API format
        error?.response?.data?.message ||    // Fallback
        error?.message ||                     // Axios default
        "Login failed. Please try again.";

      console.error("[LOGIN SCREEN] Server error:", serverMessage);
      Alert.alert("Login Failed", serverMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>Sign in to continue ordering gas.</Text>

      <TextInput
        style={styles.input}
        placeholder="Email or Phone"
        placeholderTextColor="#64748B"
        value={emailOrPhone}
        onChangeText={setEmailOrPhone}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#64748B"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}
        activeOpacity={0.85}
      >
        <Text style={styles.buttonText}>
          {loading ? "Signing in..." : "Login"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/register")}>
        <Text style={styles.link}>Create new account</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#070b14",
    padding: 24,
    justifyContent: "center",
  },
  title: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "800",
    marginBottom: 10,
  },
  subtitle: {
    color: "#d1d5db",
    fontSize: 16,
    marginBottom: 32,
  },
  input: {
    backgroundColor: "#0f172a",
    color: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  button: {
    backgroundColor: "#2563eb",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: "#1e3a5f",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  link: {
    color: "#60a5fa",
    textAlign: "center",
    marginTop: 22,
    fontWeight: "600",
  },
});