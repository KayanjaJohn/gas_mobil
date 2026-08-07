import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useLocation } from '../src/hooks/useLocation';
import { apiRequest } from '../src/services/api';
import { useAuthStore } from '../src/store/useAuthStore';

const PAYMENT_METHODS = [
  { id: 'momo', label: 'MTN Mobile Money', icon: 'cellphone', color: '#FFCC00' },
  { id: 'airtel', label: 'Airtel Money', icon: 'cellphone', color: '#E4002B' },
  { id: 'wallet', label: 'GasMobil Wallet', icon: 'wallet', color: '#2196F3' },
  { id: 'card', label: 'Credit / Debit Card', icon: 'credit-card', color: '#4CAF50' },
  { id: 'cash', label: 'Cash on Delivery', icon: 'cash', color: '#9E9E9E' },
];

const CYLINDER_SIZES = [
  { id: '6kg', label: '6kg Cylinder', price: 35000 },
  { id: '12kg', label: '12kg Cylinder', price: 65000 },
  { id: '45kg', label: '45kg Cylinder', price: 180000 },
];

const ORDER_TYPES = [
  { id: 'swap', label: 'Swap Refill', desc: 'Exchange empty cylinder for full one' },
  { id: 'new', label: 'Buy New Kit', desc: 'New cylinder + regulator + hose' },
];

export default function OrderScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { location, loading: locLoading, error: locError, getCurrentLocation, clearLocation } = useLocation();

  const [orderType, setOrderType] = useState('swap');
  const [cylinderSize, setCylinderSize] = useState('12kg');
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('momo');
  const [notes, setNotes] = useState('');
  const [placing, setPlacing] = useState(false);

  const selectedSize = CYLINDER_SIZES.find((s) => s.id === cylinderSize);
  const totalAmount = (selectedSize?.price || 0) * quantity;

  // ── CRITICAL: Fetch location on screen focus ──
  const handleGetLocation = useCallback(async () => {
    const gps = await getCurrentLocation({ showAlerts: true });
    if (!gps) {
      Alert.alert(
        'Location Required',
        'We need your exact GPS location to deliver gas safely. Please enable location services and try again.',
        [
          { text: 'Retry', onPress: handleGetLocation },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  }, [getCurrentLocation]);

  const handlePlaceOrder = async () => {
    // ── BLOCK 1: Must have real GPS coordinates ──
    if (!location) {
      Alert.alert(
        'Location Missing',
        'Please tap "Use My Location" to capture your delivery address before placing the order.',
        [{ text: 'Get Location', onPress: handleGetLocation }]
      );
      return;
    }

    // ── BLOCK 2: Validate within Uganda ──
    if (location.latitude < -1.5 || location.latitude > 4.5 || location.longitude < 29.5 || location.longitude > 35.0) {
      Alert.alert('Invalid Location', 'Your location appears to be outside Uganda. Please check your GPS and try again.');
      return;
    }

    setPlacing(true);
    try {
      const payload = {
        items: [
          {
            productId: cylinderSize,
            quantity,
            type: orderType,
          },
        ],
        deliveryAddress: location.address,
        deliveryCity: location.city,
        deliveryLatitude: location.latitude,
        deliveryLongitude: location.longitude,
        accuracy: location.accuracy,
        paymentMethod,
        notes: notes || `${ORDER_TYPES.find((t) => t.id === orderType)?.label} — ${cylinderSize}`,
      };

      console.log('[Order] Payload:', JSON.stringify(payload, null, 2));

      const res = await apiRequest('post', '/orders', payload);

      if (res.success) {
        Alert.alert(
          'Order Placed!',
          `Order #${res.data.id.slice(0, 8).toUpperCase()} placed successfully.\n\nDelivering to: ${location.address}`,
          [
            {
              text: 'Track Order',
              onPress: () => router.push(`/tracking/${res.data.id}` as any),
            },
            { text: 'OK', style: 'cancel' },
          ]
        );
        clearLocation();
        setNotes('');
      } else {
        Alert.alert('Order Failed', res.error || 'Something went wrong. Please try again.');
      }
    } catch (err: any) {
      console.error('[Order] Place order error:', err);
      const msg = err.response?.data?.error || err.message || 'Network error. Please check your connection and try again.';
      Alert.alert('Order Failed', msg);
    } finally {
      setPlacing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={styles.headerTitle}>Place Order</Text>

        {/* ── LOCATION SECTION (CRITICAL) ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Location</Text>

          {!location ? (
            <TouchableOpacity
              style={[styles.locationCard, locError && styles.locationCardError]}
              onPress={handleGetLocation}
              disabled={locLoading}
            >
              {locLoading ? (
                <ActivityIndicator size="small" color="#2196F3" />
              ) : (
                <>
                  <Icon name="map-marker" size={28} color={locError ? '#F44336' : '#2196F3'} />
                  <Text style={[styles.locationText, locError && styles.locationTextError]}>
                    {locError || 'Tap to use your current location'}
                  </Text>
                  <Icon name="chevron-right" size={20} color="#999" />
                </>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.locationCardActive}>
              <View style={styles.locationHeader}>
                <Icon name="map-marker-check" size={24} color="#4CAF50" />
                <Text style={styles.locationActiveTitle}>Location Confirmed</Text>
                <TouchableOpacity onPress={handleGetLocation} style={styles.refreshBtn}>
                  <Icon name="refresh" size={16} color="#2196F3" />
                </TouchableOpacity>
              </View>
              <Text style={styles.locationAddress}>{location.address}</Text>
              <Text style={styles.locationCoords}>
                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                {location.accuracy ? ` (±${Math.round(location.accuracy)}m)` : ''}
              </Text>
            </View>
          )}
        </View>

        {/* Order Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Type</Text>
          <View style={styles.typeRow}>
            {ORDER_TYPES.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[styles.typeCard, orderType === type.id && styles.typeCardActive]}
                onPress={() => setOrderType(type.id)}
              >
                <Icon
                  name={type.id === 'swap' ? 'swap-horizontal' : 'package-variant'}
                  size={24}
                  color={orderType === type.id ? '#fff' : '#666'}
                />
                <Text style={[styles.typeLabel, orderType === type.id && styles.typeLabelActive]}>
                  {type.label}
                </Text>
                <Text style={[styles.typeDesc, orderType === type.id && styles.typeDescActive]}>
                  {type.desc}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Cylinder Size */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cylinder Size</Text>
          <View style={styles.sizeRow}>
            {CYLINDER_SIZES.map((size) => (
              <TouchableOpacity
                key={size.id}
                style={[styles.sizeCard, cylinderSize === size.id && styles.sizeCardActive]}
                onPress={() => setCylinderSize(size.id)}
              >
                <Text style={[styles.sizeLabel, cylinderSize === size.id && styles.sizeLabelActive]}>
                  {size.label}
                </Text>
                <Text style={[styles.sizePrice, cylinderSize === size.id && styles.sizePriceActive]}>
                  UGX {size.price.toLocaleString()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quantity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quantity</Text>
          <View style={styles.qtyRow}>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => setQuantity((q) => Math.max(1, q - 1))}
            >
              <Icon name="minus" size={20} color="#333" />
            </TouchableOpacity>
            <Text style={styles.qtyText}>{quantity}</Text>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => setQuantity((q) => Math.min(5, q + 1))}
            >
              <Icon name="plus" size={20} color="#333" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          {PAYMENT_METHODS.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[styles.payCard, paymentMethod === method.id && styles.payCardActive]}
              onPress={() => setPaymentMethod(method.id)}
            >
              <View style={[styles.payIcon, { backgroundColor: method.color + '15' }]}>
                <Icon name={method.icon} size={22} color={method.color} />
              </View>
              <Text style={[styles.payLabel, paymentMethod === method.id && styles.payLabelActive]}>
                {method.label}
              </Text>
              {paymentMethod === method.id && (
                <Icon name="check-circle" size={22} color="#4CAF50" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Notes (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="E.g., Gate code, landmark, preferred delivery time..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        {/* Total & Place Order */}
        <View style={styles.footer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalAmount}>UGX {totalAmount.toLocaleString()}</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.placeBtn,
              (!location || placing) && styles.placeBtnDisabled,
            ]}
            onPress={handlePlaceOrder}
            disabled={!location || placing}
          >
            {placing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Icon name="check-circle" size={20} color="#fff" style={styles.placeIcon} />
                <Text style={styles.placeText}>
                  {location ? 'Place Order' : 'Get Location First'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  scroll: { padding: 16, paddingBottom: 40 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#1a1a1a', marginBottom: 20 },

  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 12 },

  // Location
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    gap: 12,
  },
  locationCardError: { borderColor: '#F44336', borderStyle: 'solid' },
  locationCardActive: {
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  locationText: { flex: 1, fontSize: 14, color: '#666', fontWeight: '500' },
  locationTextError: { color: '#F44336' },
  locationHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  locationActiveTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: '#2E7D32' },
  refreshBtn: { padding: 4 },
  locationAddress: { fontSize: 15, fontWeight: '600', color: '#1a1a1a', marginBottom: 4 },
  locationCoords: { fontSize: 12, color: '#666' },

  // Order Type
  typeRow: { flexDirection: 'row', gap: 12 },
  typeCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  typeCardActive: { backgroundColor: '#2196F3', borderColor: '#2196F3' },
  typeLabel: { fontSize: 14, fontWeight: '700', color: '#333', marginTop: 8 },
  typeLabelActive: { color: '#fff' },
  typeDesc: { fontSize: 11, color: '#999', marginTop: 4, textAlign: 'center' },
  typeDescActive: { color: '#E3F2FD' },

  // Size
  sizeRow: { flexDirection: 'row', gap: 10 },
  sizeCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  sizeCardActive: { borderColor: '#2196F3', backgroundColor: '#E3F2FD' },
  sizeLabel: { fontSize: 13, fontWeight: '600', color: '#333' },
  sizeLabelActive: { color: '#1565C0' },
  sizePrice: { fontSize: 12, color: '#666', marginTop: 4 },
  sizePriceActive: { color: '#2196F3', fontWeight: '700' },

  // Quantity
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  qtyBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  qtyText: { fontSize: 20, fontWeight: '700', color: '#333', minWidth: 30, textAlign: 'center' },

  // Payment
  payCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  payCardActive: { borderColor: '#2196F3', backgroundColor: '#E3F2FD' },
  payIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  payLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: '#333' },
  payLabelActive: { color: '#1565C0' },

  // Notes
  notesInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // Footer
  footer: { marginTop: 8, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#e0e0e0' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  totalLabel: { fontSize: 16, color: '#666' },
  totalAmount: { fontSize: 24, fontWeight: '800', color: '#1a1a1a' },
  placeBtn: {
    backgroundColor: '#2196F3',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  placeBtnDisabled: { backgroundColor: '#ccc' },
  placeIcon: { marginRight: 4 },
  placeText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});