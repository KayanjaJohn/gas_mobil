import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../src/context/AuthContext";

export default function RegisterScreen() {
  const router = useRouter();
  const { isAuthenticated, register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  if (isAuthenticated) {
    router.replace("/(tabs)");
    return null;
  }

  const validateStep1 = () => {
    if (!name || !email || !phone || !password || !confirmPassword) {
      Alert.alert("Missing fields", "Please fill all fields.");
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert("Password mismatch", "Passwords don't match.");
      return false;
    }
    if (password.length < 6) {
      Alert.alert("Weak password", "Password must be at least 6 characters.");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!address || !city) {
      Alert.alert("Missing address", "Please enter your delivery address and city.");
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateStep2()) return;
    setLoading(true);
    try {
      await register({
        name, email, phone, password,
        address, city,
      });
      Alert.alert("Success", "Account created! You are now logged in.");
      router.replace("/(tabs)");
    } catch (error: any) {
      Alert.alert("Registration failed", error?.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={{ padding: 24, paddingTop: 48 }}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>
          {step === 1 ? "Step 1 of 2: Personal details" : "Step 2 of 2: Delivery address"}
        </Text>

        {/* Stepper */}
        <View style={styles.stepper}>
          <View style={[styles.stepDot, step >= 1 && styles.stepActive]} />
          <View style={styles.stepLine} />
          <View style={[styles.stepDot, step >= 2 && styles.stepActive]} />
        </View>

        {step === 1 ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="Full name"
              placeholderTextColor="#8A93A6"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor="#8A93A6"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Phone number"
              placeholderTextColor="#8A93A6"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#8A93A6"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm password"
              placeholderTextColor="#8A93A6"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
            <TouchableOpacity
              style={styles.button}
              onPress={() => validateStep1() && setStep(2)}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Continue →</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="Delivery address (street, building, area)"
              placeholderTextColor="#8A93A6"
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={2}
            />
            <TextInput
              style={styles.input}
              placeholder="City"
              placeholderTextColor="#8A93A6"
              value={city}
              onChangeText={setCity}
              autoCapitalize="words"
            />

            <TouchableOpacity
              style={[styles.button, loading && { opacity: 0.6 }]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Sign Up</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setStep(1)}
              activeOpacity={0.8}
            >
              <Text style={styles.backText}>← Back to personal details</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity onPress={() => router.push("/login")}>
          <Text style={styles.link}>Already have an account? Login</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#070b14" },
  title: { color: "#fff", fontSize: 32, fontWeight: "800", marginBottom: 8 },
  subtitle: { color: "#8A93A6", fontSize: 14, marginBottom: 24 },
  stepper: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
  stepDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#1e293b", borderWidth: 2, borderColor: "#1e293b" },
  stepActive: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  stepLine: { flex: 1, height: 2, backgroundColor: "#1e293b", marginHorizontal: 8 },
  input: {
    backgroundColor: "#0f172a",
    color: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#1e293b",
    fontSize: 14,
  },
  button: {
    backgroundColor: "#2563eb",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  backBtn: { marginTop: 14, alignItems: "center" },
  backText: { color: "#8A93A6", fontSize: 14 },
  link: { color: "#60a5fa", textAlign: "center", marginTop: 24, fontWeight: "600" },
});