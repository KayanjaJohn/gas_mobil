import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking, Dimensions, ActivityIndicator,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import MapView, { Marker, Polyline, Region } from 'react-native-maps';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../services/api';
import { Order } from '../types';
import { useDriverLocation } from '../hooks/useDriverLocation';

const { width } = Dimensions.get('window');
const DEFAULT_REGION: Region = { latitude: 0.3476, longitude: 32.5825, latitudeDelta: 0.08, longitudeDelta: 0.08 };

export default function OrderDetailScreen() {
  const route = useRoute<any>();
  const { orderId } = route.params;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const mapRef = useRef<MapView>(null);
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
      Alert.alert('Error', 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  // This is the screen containing the Start Delivery action: GPS starts here,
  // immediately after the status changes to in_transit.
  useEffect(() => {
    if (order && ['in_transit', 'nearby'].includes(order.status)) {
      startTracking().catch((error: any) =>
        Alert.alert('Live GPS unavailable', error?.message || 'Enable location permission and retry.')
      );
    } else {
      stopTracking();
    }
    return () => stopTracking();
  }, [order?.id, order?.status, startTracking, stopTracking]);

  useEffect(() => {
    if (!destination || !currentLocation || !mapRef.current) return;
    mapRef.current.fitToCoordinates([
      { latitude: currentLocation.latitude, longitude: currentLocation.longitude },
      destination,
    ], { edgePadding: { top: 55, right: 45, bottom: 45, left: 45 }, animated: true });
  }, [currentLocation?.latitude, currentLocation?.longitude, destination]);

  const updateDeliveryStatus = async (status: string) => {
    if (!order || updating) return;
    const delivery = order.deliveries?.[0];
    if (!delivery?.id) {
      Alert.alert('Error', 'No delivery assignment was found for this order');
      return;
    }
    setUpdating(true);
    try {
      await api.put(`/driver/delivery/${delivery.id}/status`, { status });
      await fetchOrder();
      if (status === 'in_transit' || status === 'nearby') {
        await startTracking();
      }
    } catch (error: any) {
      Alert.alert('Update failed', error.response?.data?.error || error.message || 'Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const openNavigation = async () => {
    if (!destination) {
      Alert.alert('Destination missing', 'This order has no valid delivery map coordinates. Contact the station agent.');
      return;
    }
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.latitude},${destination.longitude}&travelmode=driving`;
    try { await Linking.openURL(url); }
    catch { Alert.alert('Navigation unavailable', 'Could not open a navigation app.'); }
  };

  if (loading || !order) {
    return <View style={styles.center}><ActivityIndicator color="#F36A21" /><Text style={styles.loadingText}>Loading order…</Text></View>;
  }

  const isMoving = ['in_transit', 'nearby'].includes(order.status);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.mapCard}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={destination ? { ...destination, latitudeDelta: 0.05, longitudeDelta: 0.05 } : DEFAULT_REGION}
          showsUserLocation
          showsMyLocationButton
          loadingEnabled
        >
          {destination && <Marker coordinate={destination} title="Customer delivery address" description={order.deliveryAddress} pinColor="#F36A21" />}
          {currentLocation && (
            <Marker
              coordinate={{ latitude: currentLocation.latitude, longitude: currentLocation.longitude }}
              title="You are here"
              description="Your live driver GPS position"
              pinColor="#0B3D2E"
            />
          )}
          {destination && currentLocation && (
            <Polyline
              coordinates={[
                { latitude: currentLocation.latitude, longitude: currentLocation.longitude },
                destination,
              ]}
              strokeColor="#F36A21"
              strokeWidth={5}
            />
          )}
        </MapView>
        <View style={styles.mapStatus}>
          <View style={[styles.dot, isMoving && currentLocation ? styles.dotLive : styles.dotWaiting]} />
          <Text style={styles.mapStatusText}>
            {isMoving ? (currentLocation ? 'LIVE · Your location is being shared' : 'Starting GPS…') : 'Your location appears when you start delivery'}
          </Text>
        </View>
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
        <DetailRow label="Address" value={order.deliveryAddress || 'N/A'} />
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
        {order.items?.map((item, index) => (
          <View key={item.id || index} style={styles.itemRow}>
            <Text style={styles.itemName}>{item.product?.name || 'Product'}</Text>
            <Text style={styles.itemQty}>x{item.quantity}</Text>
            <Text style={styles.itemPrice}>UGX {Number(item.subtotal).toLocaleString()}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Customer</Text>
        <DetailRow label="Name" value={order.user?.name || 'N/A'} />
        <DetailRow label="Phone" value={order.user?.phone || 'N/A'} />
      </View>

      <View style={styles.actions}>
        {order.status === 'driver_assigned' && (
          <TouchableOpacity style={[styles.actionBtn, styles.orangeButton]} disabled={updating} onPress={() => updateDeliveryStatus('picked_up')}>
            <Text style={styles.actionText}>{updating ? 'Updating…' : 'Confirm Pickup'}</Text>
          </TouchableOpacity>
        )}
        {order.status === 'picked_up' && (
          <TouchableOpacity style={[styles.actionBtn, styles.orangeButton]} disabled={updating} onPress={() => updateDeliveryStatus('in_transit')}>
            <Text style={styles.actionText}>{updating ? 'Starting…' : 'Start Delivery & Share Live Location'}</Text>
          </TouchableOpacity>
        )}
        {isMoving && (
          <TouchableOpacity style={[styles.actionBtn, styles.greenButton]} disabled={updating} onPress={() => updateDeliveryStatus('delivered')}>
            <Text style={styles.actionText}>{updating ? 'Updating…' : 'Mark as Delivered'}</Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.codNote}>Cash on delivery · Collect payment from the customer upon delivery.</Text>
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
  container: { flex: 1, backgroundColor: '#0B3D2E' },
  content: { paddingBottom: 24 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B3D2E' },
  loadingText: { color: '#0B3D2E', marginTop: 10 },
  mapCard: { height: 300, margin: 12, borderRadius: 16, overflow: 'hidden', backgroundColor: '#0B3D2E' },
  map: { width: width - 24, height: 300 },
  mapStatus: { position: 'absolute', top: 12, left: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 10, backgroundColor: '#0B3D2E' },
  dot: { width: 9, height: 9, borderRadius: 5 },
  dotLive: { backgroundColor: '#168447' },
  dotWaiting: { backgroundColor: '#F36A21' },
  mapStatusText: { color: '#0B3D2E', fontSize: 11, fontWeight: '800', flex: 1 },
  card: { backgroundColor: '#0B3D2E', marginHorizontal: 12, marginTop: 0, marginBottom: 12, borderRadius: 12, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#0B3D2E', marginBottom: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#D8CDBB' },
  detailLabel: { fontSize: 14, color: '#68786F' },
  detailValue: { fontSize: 14, fontWeight: '500', color: '#0B3D2E', flex: 1, textAlign: 'right' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#D8CDBB' },
  itemName: { color: '#0B3D2E', flex: 2, fontSize: 14 },
  itemQty: { flex: 1, textAlign: 'center', fontSize: 14, color: '#68786F' },
  itemPrice: { flex: 1, textAlign: 'right', fontSize: 14, fontWeight: '500', color: '#F36A21' },
  navigationButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, padding: 12, borderRadius: 10, backgroundColor: '#0B3D2E' },
  navigationText: { color: '#FFF8EE', fontWeight: '700', fontSize: 12 },
  warningText: { color: '#FDBA74', marginTop: 8, fontSize: 12 },
  actions: { paddingHorizontal: 12, gap: 10 },
  actionBtn: { padding: 16, borderRadius: 12, alignItems: 'center' },
  orangeButton: { backgroundColor: '#F36A21' },
  greenButton: { backgroundColor: '#168447' },
  actionText: { color: '#FFF8EE', fontWeight: '800', fontSize: 14, textAlign: 'center' },
  codNote: { color: '#68786F', fontSize: 11, textAlign: 'center', margin: 14 },
});
