import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../services/api';

export default function CheckoutScreen() {
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Kampala');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'wallet' | 'momo'>('cash');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<any>();

  const placeOrder = async () => {
    if (!address.trim()) {
      Alert.alert('Error', 'Please enter delivery address');
      return;
    }

    setLoading(true);
    try {
      // TODO: Get cart items from storage
      const cartItems = []; // Replace with actual cart data

      await api.post('/orders', {
        items: cartItems,
        deliveryAddress: address,
        deliveryCity: city,
        paymentMethod,
        notes
      });

      Alert.alert('Success', 'Order placed successfully!', [
        { text: 'OK', onPress: () => navigation.navigate('Orders') }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Checkout</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Delivery Address</Text>
        <TextInput
          style={styles.input}
          placeholder="Street address, building, house number"
          value={address}
          onChangeText={setAddress}
          multiline
        />
        <TextInput
          style={styles.input}
          placeholder="City"
          value={city}
          onChangeText={setCity}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Method</Text>
        {(['cash', 'wallet', 'momo'] as const).map((method) => (
          <TouchableOpacity
            key={method}
            style={[styles.paymentOption, paymentMethod === method && styles.paymentOptionActive]}
            onPress={() => setPaymentMethod(method)}
          >
            <Icon
              name={method === 'cash' ? 'cash' : method === 'wallet' ? 'wallet' : 'cellphone'}
              size={24}
              color={paymentMethod === method ? '#7380ec' : '#999'}
            />
            <Text style={[styles.paymentText, paymentMethod === method && styles.paymentTextActive]}>
              {method === 'cash' ? 'Cash on Delivery' : method === 'wallet' ? 'Wallet' : 'Mobile Money'}
            </Text>
            {paymentMethod === method && <Icon name="check-circle" size={20} color="#7380ec" />}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Additional Notes</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          placeholder="Any special instructions..."
          value={notes}
          onChangeText={setNotes}
          multiline
        />
      </View>

      <TouchableOpacity
        style={[styles.placeButton, loading && styles.placeButtonDisabled]}
        onPress={placeOrder}
        disabled={loading}
      >
        <Text style={styles.placeButtonText}>
          {loading ? 'Placing Order...' : 'Place Order'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: 'bold', padding: 16, color: '#333' },
  section: { backgroundColor: '#fff', margin: 12, padding: 16, borderRadius: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 15 },
  notesInput: { height: 80, textAlignVertical: 'top' },
  paymentOption: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', marginBottom: 8 },
  paymentOptionActive: { borderColor: '#7380ec', backgroundColor: '#f0f2ff' },
  paymentText: { flex: 1, marginLeft: 12, fontSize: 15, color: '#333' },
  paymentTextActive: { fontWeight: '600' },
  placeButton: { backgroundColor: '#7380ec', margin: 12, padding: 16, borderRadius: 12, alignItems: 'center' },
  placeButtonDisabled: { opacity: 0.7 },
  placeButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
