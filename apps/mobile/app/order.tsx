import Icon from "@expo/vector-icons/MaterialCommunityIcons";
import type { Order, Product } from "../src/types";
import React, { useState, useCallback, useEffect } from 'react';
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

import { useLocation } from '../src/hooks/useLocation';
import { apiRequest } from '../src/services/api';

import { useAuth } from '../src/context/AuthContext';
import { COLORS } from '../src/utils/constants';

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash on Delivery', icon: 'cash', color: '#F36A21' },
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
  const { user } = useAuth();
  const { location, loading: locLoading, error: locError, getCurrentLocation, clearLocation } = useLocation();

  const [orderType, setOrderType] = useState('swap');
  const [cylinderSize, setCylinderSize] = useState('12kg');
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [placing, setPlacing] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    let active = true;
    apiRequest<Product[]>("get", "/products")
      .then((res) => {
        if (active && res.success && Array.isArray(res.data)) setProducts(res.data);
      })
      .catch((err) => console.error("[Order] Product fetch failed:", err))
    return () => { active = false; };
  }, []);

  const requestedKg = Number.parseFloat(cylinderSize);
  const cylinderProduct = products.find((p) => {
    if (p.type !== "cylinder" || !p.isAvailable || p.stock < quantity) return false;
    const exactSize = String(p.size ?? "").replace(/\\s/g, "").toLowerCase()
      === cylinderSize.replace(/\\s/g, "").toLowerCase();
    const exactWeight = Number(p.weight) === requestedKg;
    const exactName = new RegExp(`\\\\b${requestedKg}\\\\s*kg\\\\b`, "i").test(p.name);
    return exactSize || exactWeight || exactName;
  });

  const selectedSize = CYLINDER_SIZES.find((s) => s.id === cylinderSize);
  const totalAmount = (selectedSize?.price || 0) * quantity;

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
    if (!location) {
      Alert.alert(
        'Location Missing',
        'Please tap "Use My Location" to capture your delivery address before placing the order.',
        [{ text: 'Get Location', onPress: handleGetLocation }]
      );
      return;
    }

    if (location.latitude < -1.5 || location.latitude > 4.5 || location.longitude < 29.5 || location.longitude > 35.0) {
      Alert.alert('Invalid Location', 'Your location appears to be outside Uganda. Please check your GPS and try again.');
      return;
    }

    if (!location.address?.trim() ||
        !Number.isFinite(location.latitude) || !Number.isFinite(location.longitude)) {
      Alert.alert("Delivery details required", "Please capture a valid delivery address and GPS location.");
      return;
    }
    if (!cylinderProduct) {
      Alert.alert("Cylinder unavailable", `No available ${cylinderSize} cylinder matches your selection.`);
      return;
    }

    setPlacing(true);
    try {
      const payload = {
        items: [
          {
            productId: cylinderProduct.id,
            quantity,
            type: orderType,
          },
        ],
        deliveryAddress: location.address,
        deliveryCity: location.city,
        deliveryLatitude: location.latitude,
        deliveryLongitude: location.longitude,
        accuracy: location.accuracy,
        paymentMethod: "cash",
        notes: notes || `${ORDER_TYPES.find((t) => t.id === orderType)?.label} — ${cylinderSize}`,
      };

      console.log('[Order] Payload:', JSON.stringify(payload, null, 2));

      const res = await apiRequest<Order>('post', '/orders', payload);

      if (res.success && res.data) {
        const placedOrderId = res.data.id;
        Alert.alert(
          'Order Placed!',
          `Order #${placedOrderId.slice(0, 8).toUpperCase()} placed successfully.\n\nDelivering to: ${location.address}`,
          [
            {
              text: 'Track Order',
              onPress: () => router.push(`/tracking/${placedOrderId}` as any),
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
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={styles.headerTitle}>Place Order</Text>
        <Text style={styles.headerSub}>Order gas for delivery to your location</Text>

        {/* ── LOCATION SECTION ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}><Icon name="map-marker-outline" size={19} color={COLORS.accent} />  Delivery Location</Text>

          {!location ? (
            <TouchableOpacity
              style={[styles.locationCard, locError ? styles.locationCardError : null]}
              onPress={handleGetLocation}
              activeOpacity={0.8}
            >
              {locLoading ? (
                <ActivityIndicator color={COLORS.accent} />
              ) : (
                <>
                  <Icon name="map-marker" size={24} color={locError ? COLORS.danger : COLORS.accent} />
                  <Text style={[styles.locationText, locError ? styles.locationTextError : null]}>
                    {locError || 'Tap to use your current location'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.locationCardActive}>
              <View style={styles.locationHeader}>
                <Icon name="check-circle" size={20} color={COLORS.success} />
                <Text style={styles.locationActiveTitle}>Location Confirmed</Text>
                <TouchableOpacity onPress={handleGetLocation} style={styles.refreshBtn}>
                  <Icon name="refresh" size={18} color={COLORS.success} />
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
          <Text style={styles.sectionTitle}><Icon name="fire" size={19} color={COLORS.accent} />  Order Type</Text>
          <View style={styles.typeRow}>
            {ORDER_TYPES.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[styles.typeCard, orderType === type.id && styles.typeCardActive]}
                onPress={() => setOrderType(type.id)}
                activeOpacity={0.8}
              >
                <Icon
                  name={type.id === 'swap' ? 'swap-horizontal' : 'package-variant'}
                  size={28}
                  color={orderType === type.id ? '#fff' : COLORS.muted}
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
          <Text style={styles.sectionTitle}><Icon name="propane-tank" size={19} color={COLORS.accent} />  Cylinder Size</Text>
          <View style={styles.sizeRow}>
            {CYLINDER_SIZES.map((size) => (
              <TouchableOpacity
                key={size.id}
                style={[styles.sizeCard, cylinderSize === size.id && styles.sizeCardActive]}
                onPress={() => setCylinderSize(size.id)}
                activeOpacity={0.8}
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
          <Text style={styles.sectionTitle}><Icon name="counter" size={19} color={COLORS.accent} />  Quantity</Text>
          <View style={styles.qtyRow}>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity((q) => Math.max(1, q - 1))}>
              <Icon name="minus" size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.qtyText}>{quantity}</Text>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity((q) => Math.min(5, q + 1))}>
              <Icon name="plus" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}><Icon name="cash" size={19} color={COLORS.accent} />  Payment Method</Text>
          {PAYMENT_METHODS.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[styles.payCard, paymentMethod === method.id && styles.payCardActive]}
              onPress={() => setPaymentMethod(method.id)}
              activeOpacity={0.8}
            >
              <View style={[styles.payIcon, { backgroundColor: method.color }]}>
                <Icon name={method.icon as any} size={20} color="#fff" />
              </View>
              <Text style={[styles.payLabel, paymentMethod === method.id && styles.payLabelActive]}>
                {method.label}
              </Text>
              {paymentMethod === method.id && (
                <Icon name="check-circle" size={22} color={COLORS.accent} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}><Icon name="note-text-outline" size={19} color={COLORS.accent} />  Delivery Notes (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            multiline
            numberOfLines={3}
            placeholder="E.g., Gate code, landmark, delivery instructions..."
            placeholderTextColor={COLORS.muted}
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

          {placing ? (
            <ActivityIndicator size="large" color={COLORS.accent} />
          ) : (
            <TouchableOpacity
              style={[styles.placeBtn, !location && styles.placeBtnDisabled]}
              onPress={handlePlaceOrder}
              activeOpacity={0.85}
              disabled={!location}
            >
              <Icon name="truck-delivery" size={20} color="#fff" style={styles.placeIcon} />
              <Text style={styles.placeText}>
                {location ? 'Place Order' : 'Get Location First'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 16, paddingBottom: 40 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#FFF8EE', marginBottom: 6 },
  headerSub: { fontSize: 14, color: COLORS.muted, marginBottom: 20 },

  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#FFF8EE', marginBottom: 12 },

  // Location
  locationCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.card, borderRadius: 16, padding: 16,
    borderWidth: 2, borderColor: COLORS.border, borderStyle: 'dashed', gap: 12,
  },
  locationCardError: { borderColor: COLORS.danger, borderStyle: 'solid' },
  locationCardActive: {
    backgroundColor: COLORS.card, borderRadius: 16, padding: 16,
    borderWidth: 2, borderColor: COLORS.success,
  },
  locationText: { flex: 1, fontSize: 14, color: COLORS.muted, fontWeight: '500' },
  locationTextError: { color: COLORS.danger },
  locationHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  locationActiveTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.success },
  refreshBtn: { padding: 4 },
  locationAddress: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  locationCoords: { fontSize: 12, color: COLORS.muted },

  // Order Type
  typeRow: { flexDirection: 'row', gap: 12 },
  typeCard: {
    flex: 1, backgroundColor: COLORS.card, borderRadius: 16, padding: 16,
    alignItems: 'center', borderWidth: 2, borderColor: COLORS.border,
  },
  typeCardActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  typeLabel: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginTop: 8 },
  typeLabelActive: { color: '#fff' },
  typeDesc: { fontSize: 11, color: COLORS.muted, marginTop: 4, textAlign: 'center' },
  typeDescActive: { color: 'rgba(255,255,255,0.8)' },

  // Size
  sizeRow: { flexDirection: 'row', gap: 10 },
  sizeCard: {
    flex: 1, backgroundColor: COLORS.card, borderRadius: 12, padding: 14,
    alignItems: 'center', borderWidth: 2, borderColor: COLORS.border,
  },
  sizeCardActive: { borderColor: COLORS.accent, backgroundColor: 'rgba(243,106,33,0.10)' },
  sizeLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  sizeLabelActive: { color: COLORS.accent },
  sizePrice: { fontSize: 12, color: COLORS.muted, marginTop: 4 },
  sizePriceActive: { color: COLORS.accent, fontWeight: '700' },

  // Quantity
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  qtyBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.card, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  qtyText: { fontSize: 20, fontWeight: '700', color: '#fff', minWidth: 30, textAlign: 'center' },

  // Payment
  payCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.card, borderRadius: 12, padding: 14,
    marginBottom: 8, borderWidth: 2, borderColor: COLORS.border,
  },
  payCardActive: { borderColor: COLORS.accent, backgroundColor: 'rgba(243,106,33,0.08)' },
  payIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  payLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.text },
  payLabelActive: { color: COLORS.accent },

  // Notes
  notesInput: {
    backgroundColor: COLORS.card, borderRadius: 12, padding: 14,
    fontSize: 14, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border,
    minHeight: 80, textAlignVertical: 'top',
  },

  // Footer
  footer: { marginTop: 8, paddingTop: 16, borderTopWidth: 1, borderTopColor: COLORS.border },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  totalLabel: { fontSize: 16, color: COLORS.muted },
  totalAmount: { fontSize: 24, fontWeight: '800', color: '#FFF8EE' },
  placeBtn: {
    backgroundColor: COLORS.accent, borderRadius: 16, paddingVertical: 16,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  placeBtnDisabled: { backgroundColor: '#1a2236' },
  placeIcon: { marginRight: 4 },
  placeText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
