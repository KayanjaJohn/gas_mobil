import React, { useState } from 'react';
import {
  ActivityIndicator, Image, ImageBackground, KeyboardAvoidingView,
  Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';
import { useThemedAlert } from '../hooks/useThemedAlert';

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<any>();
  const { showAlert, alertModal } = useThemedAlert();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.trim()) {
      showAlert("Email required", "Enter the email address on your GasMobil driver account.", "warning");
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', { email: email.trim() });
      showAlert("Check your email", response.data?.message || "If the account exists, reset instructions have been sent.", "success");
    } catch (error: any) {
      showAlert("Recovery unavailable", error?.response?.data?.error || "Please try again later or contact your administrator.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground source={require('../../assets/gasmobil-login-bg.jpg')} resizeMode="cover" style={styles.background}>
      <View style={styles.shade} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Image source={require('../../assets/gasmobil-icon.png')} style={styles.logo} resizeMode="contain" />
            <Text style={styles.brand}>GasMobil <Text style={{ color: '#F36A21' }}>Driver</Text></Text>
            <Text style={styles.title}>Reset your password</Text>
            <Text style={styles.subtitle}>Enter your account email and we'll send a secure reset link if the account exists.</Text>
            <View style={styles.field}>
              <Ionicons name="mail-outline" size={19} color="#FFC08F" />
              <TextInput style={styles.input} placeholder="Account email" placeholderTextColor="#B7C8BF"
                value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
            </View>
            <TouchableOpacity style={styles.button} onPress={submit} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send reset link</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
              <Text style={styles.backText}>← Back to sign in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      {alertModal}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: '#061D16' }, shade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(1,17,12,.38)' },
  scroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 18 },
  card: { width: '100%', maxWidth: 460, alignSelf: 'center', padding: 26, borderRadius: 24,
    backgroundColor: 'rgba(3,25,18,.74)', borderWidth: 1, borderColor: '#ffffff40' },
  logo: { width: 78, height: 78, alignSelf: 'center' },
  brand: { color: '#FFF8EE', textAlign: 'center', fontSize: 22, fontWeight: '900', fontFamily: 'sans-serif' },
  title: { color: '#FFF8EE', textAlign: 'center', fontSize: 25, fontWeight: '800', fontFamily: 'sans-serif', marginTop: 20 },
  subtitle: { color: '#C7D8CF', textAlign: 'center', lineHeight: 20, marginTop: 8, marginBottom: 22 },
  field: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#ffffff50',
    borderRadius: 12, paddingHorizontal: 14, backgroundColor: '#02130EBB' },
  input: { flex: 1, paddingVertical: 16, color: '#FFF8EE', fontSize: 15, fontFamily: 'sans-serif' },
  button: { minHeight: 54, backgroundColor: '#138A43', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  buttonText: { color: '#fff', fontWeight: '900', fontSize: 16, fontFamily: 'sans-serif' },
  back: { alignItems: 'center', padding: 15, marginTop: 6 }, backText: { color: '#FFC08F', fontWeight: '700' },
});
