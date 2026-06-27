import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, KeyboardAvoidingView, Platform,
  TouchableWithoutFeedback, Keyboard, ActivityIndicator, ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../src/context/AuthContext";
import { isValidEmail, isValidUgandaPhone, isValidName, formatUgandaPhone } from "../src/utils/validators";
import FlameLogo from "../src/components/FlameLogo";
import { COLORS } from "../src/utils/constants";

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !phone.trim() || !password || !confirmPassword) {
      Alert.alert("Missing fields", "Please fill all fields.");
      return;
    }
    if (!isValidName(name.trim())) {
      Alert.alert("Invalid name", "Please enter your full name.");
      return;
    }
    if (!isValidEmail(email.trim())) {
      Alert.alert("Invalid email", "Please enter a valid email address.");
      return;
    }
    if (!isValidUgandaPhone(phone.trim())) {
      Alert.alert("Invalid phone", "Enter a valid Uganda number (e.g. +256 7XX XXX XXX).");
      return;
    }
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
      router.replace("/(tabs)");
    } catch (error: any) {
      const msg = error?.response?.data?.error || error?.message || "Please try again.";
      Alert.alert("Registration failed", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <FlameLogo size={64} />
            <Text style={styles.title}>Gasmobil <Text style={styles.accent}>Uganda</Text></Text>
            <Text style={styles.subtitle}>Create your account to get started.</Text>
          </View>

          <View style={styles.tabToggle}>
            <TouchableOpacity style={styles.tabBtn} onPress={() => router.push("/login")} activeOpacity={0.8}>
              <Text style={styles.tabText}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tabBtn, styles.tabBtnActive]} activeOpacity={1}>
              <Text style={[styles.tabText, styles.tabTextActive]}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          {[
            { label: "Full Name", icon: "👤", value: name, setter: setName, placeholder: "John Doe", capitalize: "words" },
            { label: "Email", icon: "✉️", value: email, setter: setEmail, placeholder: "john@example.com", type: "email-address" },
            { label: "Phone Number", icon: "📞", value: phone, setter: setPhone, placeholder: "+256 7XX XXX XXX", type: "phone-pad" },
            { label: "Password", icon: "🔒", value: password, setter: setPassword, secure: true },
            { label: "Confirm Password", icon: "🔐", value: confirmPassword, setter: setConfirmPassword, secure: true },
          ].map((field, i) => (
            <View style={styles.field} key={i}>
              <Text style={styles.label}>{field.label}</Text>
              <View style={styles.inputWrap}>
                <Text style={styles.inputIcon}>{field.icon}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={field.placeholder}
                  placeholderTextColor="#5a6a8a"
                  value={field.value}
                  onChangeText={field.setter}
                  autoCapitalize={field.capitalize as any || "none"}
                  keyboardType={field.type as any || "default"}
                  secureTextEntry={field.secure || false}
                  editable={!isSubmitting}
                />
              </View>
            </View>
          ))}

          <TouchableOpacity style={[styles.button, isSubmitting && styles.buttonDisabled]} onPress={handleRegister} disabled={isSubmitting} activeOpacity={0.85}>
            {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Account →</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push("/login")} style={styles.footerLink}>
            <Text style={styles.footerText}>Already have an account? <Text style={styles.footerAccent}>Sign In</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 24, paddingTop: Platform.OS === "ios" ? 60 : 40, paddingBottom: 40 },
  hero: { alignItems: "center", marginBottom: 24 },
  title: { color: "#fff", fontSize: 24, fontWeight: "700", letterSpacing: -0.4 },
  accent: { color: COLORS.accent },
  subtitle: { color: COLORS.muted, fontSize: 13, marginTop: 4, textAlign: "center" },
  tabToggle: { flexDirection: "row", backgroundColor: "#0e1521", borderWidth: 1, borderColor: COLORS.border, borderRadius: 999, padding: 4, marginBottom: 24 },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 999, alignItems: "center" },
  tabBtnActive: { backgroundColor: COLORS.accent, shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 14 },
  tabText: { color: COLORS.muted, fontWeight: "600", fontSize: 13 },
  tabTextActive: { color: "#fff" },
  field: { marginBottom: 14 },
  label: { fontSize: 11, color: COLORS.muted, marginBottom: 6, letterSpacing: 0.5, textTransform: "uppercase", fontWeight: "600" },
  inputWrap: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#0e1521", borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  inputIcon: { fontSize: 16 },
  input: { flex: 1, color: COLORS.text, fontSize: 14 },
  button: { alignItems: "center", justifyContent: "center", backgroundColor: COLORS.accent, borderRadius: 999, paddingVertical: 14, marginTop: 8, shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 22 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  footerLink: { marginTop: 24, alignItems: "center" },
  footerText: { color: COLORS.muted, fontSize: 13 },
  footerAccent: { color: COLORS.accent, fontWeight: "700" },
});