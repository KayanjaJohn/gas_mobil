import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDriverLocation } from '../hooks/useDriverLocation';
import api from '../services/api';
import { Order, LocationPoint } from '../types';

const { width, height } = Dimensions.get('window');

export default function DeliveryScreen() {
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [route, setRoute] = useState<LocationPoint[]>([]);
  const { startTracking, stopTracking } = useDriverLocation(activeOrder?.id || null);

  useEffect(() => {
    fetchActiveDelivery();
  }, []);

  useEffect(() => {
    if (activeOrder) {
      startTracking();
    }
    return () => {
      stopTracking();
    };
  }, [activeOrder]);

  const fetchActiveDelivery = async () => {
    try {
      const res = await api.get('/driver/orders');
      const orders = res.data.data || [];
      const active = orders.find((o: Order) =>
        ['driver_assigned', 'picked_up', 'in_transit'].includes(o.status)
      );
      setActiveOrder(active || null);
    } catch (error) {
      console.error('Fetch active delivery error:', error);
    }
  };

  // FIXED: Use /driver/delivery/:id/status instead of /delivery/:id/status
  const updateStatus = async (status: string) => {
    if (!activeOrder) return;
    try {
      const deliveryId = activeOrder.deliveries?.[0]?.id;
      if (!deliveryId) {
        Alert.alert('Error', 'No delivery found for this order');
        return;
      }
      await api.put(`/driver/delivery/${deliveryId}/status`, { status });
      Alert.alert('Success', `Status updated to ${status}`);
      fetchActiveDelivery();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Update failed');
    }
  };

  if (!activeOrder) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Icon name="truck-delivery-outline" size={54} color="#F59E0B" style={{ marginBottom: 16 }} />
          <Text style={styles.emptyTitle}>No Active Delivery</Text>
          <Text style={styles.emptyText}>Accept an order to start delivery tracking</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: activeOrder.deliveryLatitude || 0.3476,
          longitude: activeOrder.deliveryLongitude || 32.5825,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        <Marker
          coordinate={{
            latitude: activeOrder.deliveryLatitude || 0,
            longitude: activeOrder.deliveryLongitude || 0,
          }}
          title="Delivery Location"
          description={activeOrder.deliveryAddress}
        />
        {route.length > 0 && (
          <Polyline
            coordinates={route.map(r => ({ latitude: r.latitude, longitude: r.longitude }))}
            strokeColor="#F59E0B"
            strokeWidth={3}
          />
        )}
      </MapView>

      <View style={styles.bottomSheet}>
        <View style={styles.infoRow}><Icon name="map-marker-outline" size={20} color="#F59E0B" /><Text style={styles.address}> {activeOrder.deliveryAddress}</Text></View>
        <View style={styles.infoRow}><Icon name="cash-multiple" size={20} color="#F59E0B" /><Text style={styles.amount}> UGX {Number(activeOrder.totalAmount).toLocaleString()}</Text></View>

        <View style={styles.actions}>
          {activeOrder.status === 'driver_assigned' && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#F59E0B' }]}
              onPress={() => updateStatus('picked_up')}
            >
              <Text style={styles.actionText}>Picked Up</Text>
            </TouchableOpacity>
          )}
          {activeOrder.status === 'picked_up' && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#F59E0B' }]}
              onPress={() => updateStatus('in_transit')}
            >
              <Text style={styles.actionText}>Start Delivery</Text>
            </TouchableOpacity>
          )}
          {activeOrder.status === 'in_transit' && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#22C55E' }]}
              onPress={() => updateStatus('delivered')}
            >
              <Text style={styles.actionText}>Mark Delivered</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1120',
  },
  map: {
    width,
    height: height * 0.6,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E2E8F0',
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 8,
  },
  bottomSheet: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 20,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  address: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  amount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F59E0B',
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
