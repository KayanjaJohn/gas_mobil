import React, { useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, Image, ImageBackground, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => { if (isAuthenticated) router.replace("/(tabs)"); }, [isAuthenticated, router]);

  const validateStep1 = () => {
    if (!name.trim() || !email.trim() || !phone.trim() || !password || !confirmPassword) {
      Alert.alert("Missing fields", "Please complete all personal details."); return false;
    }
    if (password !== confirmPassword) { Alert.alert("Password mismatch", "Passwords don't match."); return false; }
    if (password.length < 8) { Alert.alert("Weak password", "Use at least 8 characters."); return false; }
    return true;
  };
  const handleRegister = async () => {
    if (!address.trim() || !city.trim()) { Alert.alert("Missing address", "Enter your delivery address and city."); return; }
    setLoading(true);
    try {
      await register({ name, email, phone, password, address, city });
      Alert.alert("Welcome to GasMobil", "Your customer account has been created.");
      router.replace("/(tabs)");
    } catch (error: any) {
      Alert.alert("Registration failed", error?.response?.data?.error || error?.message || "Please try again.");
    } finally { setLoading(false); }
  };

  const field = (placeholder: string, value: string, onChangeText: (text: string) => void, options: any = {}) => (
    <View style={styles.field}>
      {options.icon ? <Ionicons name={options.icon} size={18} color="#FFC08F" /> : null}
      <TextInput style={[styles.input, options.multiline && { minHeight: 66, textAlignVertical: "top" }]}
        placeholder={placeholder} placeholderTextColor="#B7C8BF" value={value}
        onChangeText={onChangeText} autoCapitalize={options.autoCapitalize || "none"}
        keyboardType={options.keyboardType || "default"} multiline={!!options.multiline} numberOfLines={options.multiline ? 2 : 1}
      />
    </View>
  );

  return (
    <ImageBackground source={require("../assets/gasmobil-login-bg.jpg")} resizeMode="cover" style={styles.background}>
      <View style={styles.shade} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Image source={require("../assets/gasmobil-icon.png")} style={styles.logo} resizeMode="contain" />
          <Text style={styles.brand}>GasMobil <Text style={{ color: "#F36A21" }}>Uganda</Text></Text>
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>{step === 1 ? "Step 1 of 2 · Personal details" : "Step 2 of 2 · Delivery address"}</Text>
          <View style={styles.stepper}>
            <View style={[styles.dot, step >= 1 && styles.dotActive]} />
            <View style={styles.line} />
            <View style={[styles.dot, step >= 2 && styles.dotActive]} />
          </View>
          {step === 1 ? (
            <>
              {field("Full name", name, setName, { icon: "person-outline", autoCapitalize: "words" })}
              {field("Email address", email, setEmail, { icon: "mail-outline", keyboardType: "email-address" })}
              {field("Phone number", phone, setPhone, { icon: "call-outline", keyboardType: "phone-pad" })}
              <View style={styles.field}>
                <Ionicons name="lock-closed-outline" size={18} color="#FFC08F" />
                <TextInput style={styles.input} placeholder="Password (8 characters minimum)" placeholderTextColor="#B7C8BF"
                  value={password} onChangeText={setPassword} secureTextEntry={!showPassword} autoComplete="new-password" />
                <TouchableOpacity onPress={() => setShowPassword(v => !v)}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#FFC08F" />
                </TouchableOpacity>
              </View>
              <View style={styles.field}>
                <Ionicons name="lock-closed-outline" size={18} color="#FFC08F" />
                <TextInput style={styles.input} placeholder="Confirm password" placeholderTextColor="#B7C8BF"
                  value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showConfirmPassword} autoComplete="new-password" />
                <TouchableOpacity onPress={() => setShowConfirmPassword(v => !v)}>
                  <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#FFC08F" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.button} onPress={() => validateStep1() && setStep(2)}>
                <Text style={styles.buttonText}>Continue →</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {field("Delivery address (street, building, area)", address, setAddress, { icon: "location-outline", multiline: true })}
              {field("City or town", city, setCity, { icon: "business-outline", autoCapitalize: "words" })}
              <TouchableOpacity style={[styles.button, loading && styles.disabled]} onPress={handleRegister} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create account</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep(1)}>
                <Text style={styles.secondaryText}>← Back to personal details</Text>
              </TouchableOpacity>
            </>
          )}
          <View style={styles.bottomRow}>
            <Text style={styles.bottomText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.replace("/login")}><Text style={styles.link}>Sign in</Text></TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: "#061D16" }, shade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(1,17,12,.4)" },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 20 },
  card: { width: "100%", maxWidth: 500, alignSelf: "center", padding: 24, borderRadius: 24, backgroundColor: "rgba(3,25,18,.74)", borderWidth: 1, borderColor: "#ffffff40" },
  logo: { width: 68, height: 68, alignSelf: "center" }, brand: { color: "#FFF8EE", textAlign: "center", fontSize: 22, fontWeight: "900", fontFamily: "sans-serif" },
  title: { color: "#FFF8EE", textAlign: "center", fontSize: 25, fontWeight: "800", fontFamily: "sans-serif", marginTop: 16 },
  subtitle: { color: "#C7D8CF", textAlign: "center", marginTop: 7, marginBottom: 17, fontSize: 13 },
  stepper: { flexDirection: "row", alignItems: "center", marginBottom: 20 }, dot: { width: 11, height: 11, borderRadius: 8, backgroundColor: "#365448" },
  dotActive: { backgroundColor: "#F36A21" }, line: { flex: 1, height: 2, backgroundColor: "#527365", marginHorizontal: 9 },
  field: { minHeight: 54, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 13,
    marginBottom: 13, borderWidth: 1, borderColor: "#ffffff50", borderRadius: 11, backgroundColor: "#02130EBB" },
  input: { flex: 1, color: "#FFF8EE", paddingVertical: 13, fontSize: 14, fontFamily: "sans-serif" },
  button: { minHeight: 53, borderRadius: 11, backgroundColor: "#F36A21", alignItems: "center", justifyContent: "center", marginTop: 7 },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "900", fontFamily: "sans-serif" }, disabled: { opacity: .6 },
  secondaryButton: { alignItems: "center", padding: 12 }, secondaryText: { color: "#FFC08F", fontWeight: "700" },
  bottomRow: { flexDirection: "row", justifyContent: "center", marginTop: 20 }, bottomText: { color: "#D6E2DB", fontSize: 12 },
  link: { color: "#FFC08F", fontWeight: "900", fontSize: 12 },
});
