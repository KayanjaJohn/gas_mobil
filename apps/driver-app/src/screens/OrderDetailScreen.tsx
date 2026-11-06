import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, ActivityIndicator,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../services/api';
import DriverLiveMap from '../components/DriverLiveMap';
import { useThemedAlert } from '../hooks/useThemedAlert';
import { Order } from '../types';
import { useDriverLocation } from '../hooks/useDriverLocation';


function formatDeliveryAddress(address?: string, city?: string) {
  const cityName = String(city || "").trim();
  const district = String(address || "").split(",").map((part) => part.trim())
    .find((part) => part && !part.includes("+") && part.toLowerCase() !== cityName.toLowerCase()) || "";
  return [cityName, district ? (district.toLowerCase().endsWith("district") ? district : district + " District") : "", "Uganda"]
    .filter(Boolean).join(", ") || "Customer address unavailable";
}

export default function OrderDetailScreen() {
  const { showAlert, alertModal } = useThemedAlert();
  const route = useRoute<any>();
  const { orderId } = route.params;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { startTracking, stopTracking, currentLocation } = useDriverLocation(order?.id || null);

  const destination = useMemo(() => {
    const latitude = Number(order?.deliveryLatitude);
    const longitude = Number(order?.deliveryLongitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) ||
      latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180 ||
      (latitude === 0 && longitude === 0)) return null;
    return { latitude, longitude };
  }, [order?.deliveryLatitude, order?.deliveryLongitude]);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await api.get(`/orders/${orderId}`);
      setOrder(res.data.data);
    } catch (error) {
      showAlert('Could not load order', 'Failed to load order details.', 'error');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  // GPS begins as soon as pickup is confirmed and continues until delivery,
  // so the customer can follow the full journey in Track.
  useEffect(() => {
    if (order && ['picked_up', 'in_transit', 'nearby'].includes(order.status)) {
      startTracking().catch((error: any) =>
        showAlert('Live GPS unavailable', error?.message || 'Enable location permission and retry.', 'warning')
      );
    } else {
      stopTracking();
    }
    return () => stopTracking();
  }, [order?.id, order?.status, startTracking, stopTracking]);



  const updateDeliveryStatus = async (status: string, paymentStatus?: 'paid') => {
    if (!order || updating) return;
    const delivery = order.deliveries?.[0];
    if (!delivery?.id) {
      showAlert('Delivery unavailable', 'No delivery assignment was found for this order.', 'error');
      return;
    }
    setUpdating(true);
    try {
      await api.put(`/driver/delivery/${delivery.id}/status`, {
        status,
        ...(paymentStatus ? { paymentStatus } : {}),
      });
      // The refreshed order status triggers the GPS effect once.
      await fetchOrder();
    } catch (error: any) {
      showAlert('Update failed', error.response?.data?.error || error.message || 'Please try again.', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const confirmPaymentAndDelivery = () => {
    if (!order || updating) return;

    if (order.paymentStatus === 'paid') {
      void updateDeliveryStatus('delivered');
      return;
    }

    showAlert(
      'Confirm cash payment',
      `Have you received UGX ${Number(order.totalAmount).toLocaleString()} from the customer? Delivery will be completed only after you confirm.`,
      'confirm',
      [
        { label: 'Cancel', tone: 'secondary' },
        {
          label: 'Cash received',
          tone: 'primary',
          onPress: () => { void updateDeliveryStatus('delivered', 'paid'); },
        },
      ]
    );
  };

  const openNavigation = async () => {
    if (!destination) {
      showAlert('Destination missing', 'This order has no valid delivery map coordinates. Contact the station agent.', 'warning');
      return;
    }
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.latitude},${destination.longitude}&travelmode=driving`;
    try { await Linking.openURL(url); }
    catch { showAlert('Navigation unavailable', 'Could not open a navigation app.', 'error'); }
  };

  if (loading || !order) {
    return <View style={styles.center}><ActivityIndicator color="#F36A21" /><Text style={styles.loadingText}>Loading order…</Text></View>;
  }

  const isMoving = ['in_transit', 'nearby'].includes(order.status);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.mapCard}>
        <DriverLiveMap
          destination={destination}
          driverLocation={currentLocation}
          status={order.status}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Order Information</Text>
        <DetailRow label="Order ID" value={`#${order.id.slice(0, 8)}`} />
        <DetailRow label="Status" value={order.status.replace(/_/g, ' ').toUpperCase()} />
        <DetailRow label="Amount" value={`UGX ${Number(order.totalAmount).toLocaleString()}`} />
        <DetailRow label="Payment" value={`${order.paymentMethod} (${order.paymentStatus})`} />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Customer Destination</Text>
        <DetailRow label="Address" value={formatDeliveryAddress(order.deliveryAddress, order.deliveryCity)} />
        <DetailRow label="City" value={order.deliveryCity || 'N/A'} />
        {order.notes && <DetailRow label="Notes" value={order.notes} />}
        {isMoving && (
          <TouchableOpacity style={styles.navigationButton} onPress={openNavigation}>
            <Icon name="navigation-variant" size={18} color="#FFF8EE" />
            <Text style={styles.navigationText}>Open turn-by-turn navigation</Text>
          </TouchableOpacity>
        )}
        {!destination && <Text style={styles.warningText}>No valid map pin is saved for this customer address.</Text>}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Items</Text>
        {order.items?.length ? order.items.map((item, index) => (
          <View key={item.id || index} style={styles.itemRow}>
            <View style={{ flex: 2 }}>
              <Text style={styles.itemName}>{item.product?.name || 'Product'}</Text>
              <Text style={styles.itemMeta}>
                {[item.product?.type, item.product?.size, item.product?.weight ? `${item.product.weight} kg` : null]
                  .filter(Boolean).join(' · ') || 'Product details'}
              </Text>
              <Text style={styles.itemMeta}>UGX {Number(item.price || 0).toLocaleString()} each</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={styles.itemQty}>Qty {Number(item.quantity || 0)}</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text style={styles.itemPrice}>UGX {Number(item.subtotal || 0).toLocaleString()}</Text>
              <Text style={styles.itemMeta}>Line total</Text>
            </View>
          </View>
        )) : <Text style={styles.warningText}>No product line items were returned for this order.</Text>}
        {!!order.items?.length && (
          <View style={[styles.detailRow, { marginTop: 8 }]}>
            <Text style={styles.detailLabel}>Total quantity</Text>
            <Text style={styles.detailValue}>{order.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)} item(s)</Text>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Customer</Text>
        <DetailRow label="Name" value={order.user?.name || 'N/A'} />
        <DetailRow label="Phone" value={order.user?.phone || 'N/A'} />
      </View>

      <View style={styles.actions}>
        {order.status === 'driver_assigned' && (
          <TouchableOpacity style={[styles.actionBtn, styles.orangeButton]} disabled={updating} onPress={() => updateDeliveryStatus('picked_up')}>
            <Text style={styles.actionText}>{updating ? 'Updating…' : 'Confirm Pickup & Share Live Location'}</Text>
          </TouchableOpacity>
        )}
        {order.status === 'picked_up' && (
          <TouchableOpacity style={[styles.actionBtn, styles.orangeButton]} disabled={updating} onPress={() => updateDeliveryStatus('in_transit')}>
            <Text style={styles.actionText}>{updating ? 'Starting…' : 'Start Delivery & Share Live Location'}</Text>
          </TouchableOpacity>
        )}
        {order.status === 'in_transit' && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.arrivedButton]}
            disabled={updating}
            onPress={() => updateDeliveryStatus('nearby')}
          >
            <Icon name="map-marker-check" size={19} color="#FFF8EE" />
            <Text style={styles.actionText}>{updating ? 'Sending customer alert…' : "I've Arrived — Alert Customer"}</Text>
          </TouchableOpacity>
        )}
        {order.status === 'nearby' && (
          <View style={styles.arrivedNotice}>
            <Icon name="bell-check" size={18} color="#0A3D2E" />
            <Text style={styles.arrivedNoticeText}>Customer has been alerted that you have arrived.</Text>
          </View>
        )}
        {isMoving && (
          <TouchableOpacity style={[styles.actionBtn, styles.greenButton]} disabled={updating} onPress={confirmPaymentAndDelivery}>
            <Text style={styles.actionText}>{updating ? 'Updating…' : 'Confirm Cash Payment & Deliver'}</Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.codNote}>Cash on delivery · Confirm payment received before completing delivery.</Text>
    {alertModal}
      </ScrollView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A3D2E' },
  content: { paddingBottom: 24 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A3D2E' },
  loadingText: { color: '#0A3D2E', marginTop: 10 },
  mapCard: { height: 300, margin: 12, borderRadius: 16, overflow: 'hidden', backgroundColor: '#102D25' },
  mapPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, gap: 8, backgroundColor: '#102D25' },
  mapPlaceholderTitle: { color: '#FFF8EE', fontSize: 17, fontWeight: '800' },
  mapPlaceholderText: { color: '#D6E4DC', fontSize: 12, textAlign: 'center' },
  mapStatus: { position: 'absolute', top: 12, left: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 10, backgroundColor: '#0A3D2E' },
  dot: { width: 9, height: 9, borderRadius: 5 },
  dotLive: { backgroundColor: '#168447' },
  dotWaiting: { backgroundColor: '#F36A21' },
  mapStatusText: { color: '#0A3D2E', fontSize: 11, fontWeight: '800', flex: 1 },
  card: { backgroundColor: '#FFF8EE', marginHorizontal: 12, marginTop: 0, marginBottom: 12, borderRadius: 12, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#0A3D2E', marginBottom: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#D8CDBB' },
  detailLabel: { fontSize: 14, color: '#52685B' },
  detailValue: { fontSize: 14, fontWeight: '500', color: '#0A3D2E', flex: 1, textAlign: 'right' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#D8CDBB' },
  itemName: { color: '#0A3D2E', flex: 2, fontSize: 14 },
  itemQty: { flex: 1, textAlign: 'center', fontSize: 14, color: '#52685B' },
  itemPrice: { textAlign: 'right', fontSize: 12, fontWeight: '800', color: '#F36A21' },
  itemMeta: { color: '#52685B', fontSize: 10, marginTop: 3 },
  navigationButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, padding: 12, borderRadius: 10, backgroundColor: '#0A3D2E' },
  navigationText: { color: '#FFF8EE', fontWeight: '700', fontSize: 12 },
  warningText: { color: '#FDBA74', marginTop: 8, fontSize: 12 },
  actions: { paddingHorizontal: 12, gap: 10 },
  actionBtn: { padding: 16, borderRadius: 12, alignItems: 'center' },
  orangeButton: { backgroundColor: '#F36A21' },
  greenButton: { backgroundColor: '#168447' },
  arrivedButton: { backgroundColor: '#0D6B4B', flexDirection: 'row', justifyContent: 'center', gap: 9 },
  arrivedNotice: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 2, padding: 13, borderRadius: 10, backgroundColor: '#D9F2E5' },
  arrivedNoticeText: { color: '#0A3D2E', fontSize: 12, fontWeight: '700', flex: 1 },
  actionText: { color: '#FFF8EE', fontWeight: '800', fontSize: 14, textAlign: 'center' },
  codNote: { color: '#52685B', fontSize: 11, textAlign: 'center', margin: 14 },
});
