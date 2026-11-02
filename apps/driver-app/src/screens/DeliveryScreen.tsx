import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDriverLocation } from '../hooks/useDriverLocation';
import api from '../services/api';
import { useThemedAlert } from '../hooks/useThemedAlert';
import { Order } from '../types';


export default function DeliveryScreen() {
  const { showAlert, alertModal } = useThemedAlert();
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { startTracking, stopTracking, currentLocation, permissionGranted } =
    useDriverLocation(activeOrder?.id || null);

  const destination = useMemo(() => {
    const latitude = Number(activeOrder?.deliveryLatitude);
    const longitude = Number(activeOrder?.deliveryLongitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) ||
        latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180 ||
        (latitude === 0 && longitude === 0)) return null;
    return { latitude, longitude };
  }, [activeOrder?.deliveryLatitude, activeOrder?.deliveryLongitude]);

  const fetchActiveDelivery = useCallback(async () => {
    try {
      const res = await api.get('/driver/orders');
      const orders: Order[] = res.data.data || [];
      const active = orders.find((o) => ['driver_assigned', 'picked_up', 'in_transit', 'nearby'].includes(o.status));
      setActiveOrder(active || null);
    } catch (error) {
      console.error('[DriverDelivery] Fetch active delivery error:', error);
      showAlert('Delivery unavailable', 'Could not load your assigned delivery. Please retry.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchActiveDelivery(); }, [fetchActiveDelivery]);

  // GPS starts only when the driver starts the journey, and remains active while
  // this delivery is in transit/nearby. A first GPS fix is published immediately.
  useEffect(() => {
    if (activeOrder && ['in_transit', 'nearby'].includes(activeOrder.status)) {
      startTracking().catch((error: any) => {
        showAlert('Live tracking unavailable', error?.message || 'Enable location and retry.', 'warning');
      });
    } else {
      stopTracking();
    }
    return () => stopTracking();
  }, [activeOrder?.id, activeOrder?.status, startTracking, stopTracking]);



  const updateStatus = async (status: string) => {
    if (!activeOrder || updating) return;
    const delivery = activeOrder.deliveries?.find((item) => item.driverId) || activeOrder.deliveries?.[0];
    if (!delivery?.id) {
      showAlert('Delivery unavailable', 'No delivery assignment was found for this order.', 'error');
      return;
    }
    setUpdating(true);
    try {
      await api.put(`/driver/delivery/${delivery.id}/status`, { status });
      // Refreshing activeOrder triggers the GPS lifecycle effect exactly once.
      await fetchActiveDelivery();
    } catch (error: any) {
      showAlert('Could not update delivery', error.response?.data?.error || error.message || 'Please try again.', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const openNavigation = async () => {
    if (!destination) {
      showAlert('Destination missing', 'This order does not have valid delivery coordinates. Contact the station agent to correct the address pin.', 'warning');
      return;
    }
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.latitude},${destination.longitude}&travelmode=driving`;
    try { await Linking.openURL(url); }
    catch { showAlert('Navigation unavailable', 'Could not open a maps application.', 'error'); }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#F36A21" /><Text style={styles.emptyText}>Loading assigned delivery…</Text></View>;
  }

  if (!activeOrder) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Icon name="truck-delivery-outline" size={54} color="#F36A21" style={{ marginBottom: 16 }} />
          <Text style={styles.emptyTitle}>No Active Delivery</Text>
          <Text style={styles.emptyText}>Accept an order to see the delivery destination and start live tracking.</Text>
          <TouchableOpacity style={styles.secondaryButton} onPress={fetchActiveDelivery}>
            <Text style={styles.secondaryButtonText}>Refresh orders</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const isMoving = ['in_transit', 'nearby'].includes(activeOrder.status);
  const hasDriverLocation = !!currentLocation;

  return (
    <View style={styles.container}>
      <View style={styles.map}>
        <View style={styles.mapPlaceholder}>
          <Icon name="map-marker-radius-outline" size={42} color="#F36A21" />
          <Text style={styles.mapPlaceholderTitle}>Delivery location</Text>
          <Text style={styles.mapPlaceholderText}>
            {destination
              ? `Destination: ${destination.latitude.toFixed(5)}, ${destination.longitude.toFixed(5)}`
              : 'Waiting for a valid customer delivery pin'}
          </Text>
          <Text style={styles.mapPlaceholderText}>
            {currentLocation
              ? `Your GPS: ${currentLocation.latitude.toFixed(5)}, ${currentLocation.longitude.toFixed(5)}`
              : 'Your GPS position will appear when tracking starts'}
          </Text>
        </View>
      </View>

      <View style={styles.liveBadge}>
        <View style={[styles.liveDot, isMoving && hasDriverLocation ? styles.liveDotOn : styles.liveDotOff]} />
        <Text style={styles.liveBadgeText}>
          {isMoving ? (hasDriverLocation ? 'LIVE · Sharing your location' : 'Starting GPS…') : 'Delivery not started'}
        </Text>
      </View>

      <View style={styles.bottomSheet}>
        <View style={styles.sheetHandle} />
        <View style={styles.headingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.kicker}>ACTIVE DELIVERY · #{activeOrder.id.slice(0, 8).toUpperCase()}</Text>
            <Text style={styles.address}>{activeOrder.deliveryAddress || 'Customer address unavailable'}</Text>
          </View>
          <View style={styles.statusPill}><Text style={styles.statusText}>{activeOrder.status.replace(/_/g, ' ').toUpperCase()}</Text></View>
        </View>
        <View style={styles.customerRow}>
          <Icon name="account-circle-outline" size={20} color="#F36A21" />
          <Text style={styles.customerText}>{activeOrder.user?.name || 'Customer'} · {activeOrder.user?.phone || 'Phone unavailable'}</Text>
        </View>
        <View style={styles.gpsRow}>
          <Icon name={hasDriverLocation ? 'crosshairs-gps' : 'crosshairs'} size={18} color={hasDriverLocation ? '#16A34A' : '#F36A21'} />
          <Text style={styles.gpsText}>
            {hasDriverLocation
              ? `Your position: ${currentLocation!.latitude.toFixed(5)}, ${currentLocation!.longitude.toFixed(5)}`
              : (isMoving ? 'Acquiring your GPS position…' : 'Your position will appear when delivery starts')}
          </Text>
        </View>
        {!destination && <Text style={styles.warningText}>Customer map pin is missing. Ask the station agent to update the delivery coordinates.</Text>}
        <View style={styles.actions}>
          {activeOrder.status === 'driver_assigned' && (
            <TouchableOpacity style={[styles.actionButton, styles.orangeButton]} disabled={updating} onPress={() => updateStatus('picked_up')}>
              <Text style={styles.actionText}>{updating ? 'Updating…' : 'Confirm Pickup'}</Text>
            </TouchableOpacity>
          )}
          {activeOrder.status === 'picked_up' && (
            <TouchableOpacity style={[styles.actionButton, styles.orangeButton]} disabled={updating} onPress={() => updateStatus('in_transit')}>
              <Text style={styles.actionText}>{updating ? 'Starting…' : 'Start Delivery & Live GPS'}</Text>
            </TouchableOpacity>
          )}
          {isMoving && (
            <>
              <TouchableOpacity style={[styles.actionButton, styles.darkButton]} onPress={openNavigation}>
                <Icon name="navigation-variant" size={18} color="#FFF8EE" />
                <Text style={styles.actionText}>Navigate</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.greenButton]} disabled={updating} onPress={() => updateStatus('delivered')}>
                <Text style={styles.actionText}>{updating ? 'Updating…' : 'Mark Delivered'}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
        <Text style={styles.paymentText}>Cash on delivery · UGX {Number(activeOrder.totalAmount).toLocaleString()}</Text>
      </View>
    {alertModal}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B3D2E' },
  center: { flex: 1, backgroundColor: '#0B3D2E', alignItems: 'center', justifyContent: 'center', gap: 12 },
  map: { height: '58%', minHeight: 260, margin: 12, borderRadius: 16, overflow: 'hidden', backgroundColor: '#102D25' },
  mapPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, gap: 8 },
  mapPlaceholderTitle: { color: '#FFF8EE', fontSize: 17, fontWeight: '800' },
  mapPlaceholderText: { color: '#D6E4DC', fontSize: 12, textAlign: 'center' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 28 },
  emptyTitle: { fontSize: 21, fontWeight: '800', color: '#FFF8EE' },
  emptyText: { fontSize: 14, color: '#D6E4DC', marginTop: 8, textAlign: 'center' },
  secondaryButton: { marginTop: 18, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, backgroundColor: '#F36A21' },
  secondaryButtonText: { color: '#FFF8EE', fontWeight: '700' },
  liveBadge: { position: 'absolute', top: 14, left: 14, right: 14, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 14, backgroundColor: '#FFF8EE', elevation: 4 },
  liveDot: { width: 9, height: 9, borderRadius: 5 },
  liveDotOn: { backgroundColor: '#16A34A' },
  liveDotOff: { backgroundColor: '#F36A21' },
  liveBadgeText: { color: '#0B3D2E', fontSize: 12, fontWeight: '800' },
  bottomSheet: { flex: 1, marginTop: -18, backgroundColor: '#FFF8EE', borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 18 },
  sheetHandle: { width: 42, height: 4, borderRadius: 2, backgroundColor: '#D8D1C6', alignSelf: 'center', marginBottom: 14 },
  headingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  kicker: { color: '#527064', fontSize: 10, fontWeight: '800', letterSpacing: 0.8, marginBottom: 5 },
  address: { color: '#0B3D2E', fontSize: 16, lineHeight: 21, fontWeight: '800', flexShrink: 1 },
  statusPill: { backgroundColor: '#E8EFE9', paddingHorizontal: 9, paddingVertical: 6, borderRadius: 20 },
  statusText: { color: '#0B3D2E', fontSize: 9, fontWeight: '800' },
  customerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  customerText: { color: '#244B3D', fontSize: 12, fontWeight: '600', flex: 1 },
  gpsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  gpsText: { color: '#244B3D', fontSize: 11, flex: 1 },
  warningText: { color: '#A54112', fontSize: 11, marginTop: 8 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 14 },
  actionButton: { flex: 1, minHeight: 46, paddingHorizontal: 10, paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  orangeButton: { backgroundColor: '#F36A21' },
  darkButton: { backgroundColor: '#0B3D2E' },
  greenButton: { backgroundColor: '#168447' },
  actionText: { color: '#FFF8EE', fontWeight: '800', fontSize: 11, textAlign: 'center' },
  paymentText: { color: '#527064', fontSize: 10, marginTop: 10, textAlign: 'right', fontWeight: '600' },
});
