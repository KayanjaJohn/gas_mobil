import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView, Image, ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useThemedAlert } from '../hooks/useThemedAlert';

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const { login } = useAuth();
  const { showAlert, alertModal } = useThemedAlert();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!emailOrPhone.trim() || !password) {
      showAlert("Sign-in details required", "Enter your email or phone number and password.", "warning");
      return;
    }
    setLoading(true);
    const result = await login(emailOrPhone.trim(), password);
    setLoading(false);
    if (!result.success) {
      showAlert("Sign in failed", result.error || "Please check your credentials and try again.", "error");
    }
  };

  return (
    <ImageBackground source={require('../../assets/gasmobil-login-bg.jpg')} resizeMode="cover" style={styles.background}>
      <View style={styles.shade} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Image source={require('../../assets/icon.png')} style={styles.logo} resizeMode="contain" />
            <Text style={styles.brand}>GasMobil <Text style={styles.brandAccent}>Driver</Text></Text>
            <Text style={styles.title}>Driver sign in</Text>
            <Text style={styles.subtitle}>Access assigned deliveries and update order progress.</Text>

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
              <TouchableOpacity onPress={() => setShowPassword(v => !v)} accessibilityRole="button"
                accessibilityLabel={showPassword ? "Hide password" : "Show password"}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={21} color="#FFC08F" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.forgot} onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
            </TouchableOpacity>
            <Text style={styles.footer}>For registered GasMobil delivery drivers only</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      {alertModal}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: '#061D16' },
  shade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(1,17,12,.38)' },
  scroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 18 },
  card: { width: '100%', maxWidth: 460, alignSelf: 'center', padding: 26, borderRadius: 24,
    backgroundColor: 'rgba(3,25,18,.74)', borderWidth: 1, borderColor: '#ffffff40' },
  logo: { width: 78, height: 78, alignSelf: 'center', marginBottom: 5 },
  brand: { color: '#FFF8EE', textAlign: 'center', fontSize: 23, fontWeight: '900', fontFamily: 'sans-serif' },
  brandAccent: { color: '#F36A21' },
  title: { color: '#FFF8EE', textAlign: 'center', fontSize: 27, fontWeight: '800', fontFamily: 'sans-serif', marginTop: 17 },
  subtitle: { color: '#C7D8CF', textAlign: 'center', fontSize: 14, marginTop: 7, marginBottom: 22, lineHeight: 20 },
  field: { flexDirection: 'row', alignItems: 'center', gap: 11, minHeight: 56, paddingHorizontal: 14,
    marginBottom: 14, borderWidth: 1, borderColor: '#ffffff50', borderRadius: 12, backgroundColor: '#02130EBB' },
  input: { flex: 1, color: '#FFF8EE', fontSize: 15, paddingVertical: 14, fontFamily: 'sans-serif' },
  forgot: { alignSelf: 'flex-end', paddingVertical: 5, marginTop: -3 },
  forgotText: { color: '#FFC08F', fontSize: 13, fontWeight: '700' },
  button: { minHeight: 54, borderRadius: 12, backgroundColor: '#138A43', alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '900', fontFamily: 'sans-serif' },
  footer: { color: '#91A99C', textAlign: 'center', marginTop: 20, fontSize: 11 },
});
