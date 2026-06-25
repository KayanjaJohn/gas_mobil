import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { useRoute } from '@react-navigation/native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../services/api';
import { initializeSocket, getSocket } from '../services/socketService';

const { width, height } = Dimensions.get('window');

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  deliveryAddress: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  driver?: {
    name: string;
    phone: string;
    currentLatitude?: number;
    currentLongitude?: number;
  };
}

const STATUS_STEPS = [
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'driver_assigned', label: 'Driver Assigned' },
  { key: 'picked_up', label: 'Picked Up' },
  { key: 'in_transit', label: 'In Transit' },
  { key: 'delivered', label: 'Delivered' },
];

export default function OrderTrackingScreen() {
  const route = useRoute<any>();
  const { orderId } = route.params;
  const [order, setOrder] = useState<Order | null>(null);
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
    setupSocket();
    return () => {
      const socket = getSocket();
      if (socket) {
        socket.emit('leave_order_tracking', orderId);
        socket.off('location_update');
      }
    };
  }, []);

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/orders/${orderId}`);
      setOrder(res.data.data);
      if (res.data.data.driver?.currentLatitude) {
        setDriverLocation({
          lat: res.data.data.driver.currentLatitude,
          lng: res.data.data.driver.currentLongitude
        });
      }
    } catch (error) {
      console.error('Fetch order error:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupSocket = async () => {
    const socket = await initializeSocket();
    if (socket) {
      socket.emit('join_order_tracking', orderId);
      socket.on('location_update', (data: any) => {
        setDriverLocation({ lat: data.latitude, lng: data.longitude });
      });
    }
  };

  const getCurrentStepIndex = () => {
    if (!order) return 0;
    const idx = STATUS_STEPS.findIndex(s => s.key === order.status);
    return idx >= 0 ? idx : 0;
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#7380ec" /></View>;
  }

  if (!order) {
    return <View style={styles.center}><Text>Order not found</Text></View>;
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: order.deliveryLatitude || 0.3476,
          longitude: order.deliveryLongitude || 32.5825,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        <Marker
          coordinate={{
            latitude: order.deliveryLatitude || 0,
            longitude: order.deliveryLongitude || 0,
          }}
          title="Delivery Location"
        >
          <View style={styles.homeMarker}>
            <Icon name="home" size={20} color="#fff" />
          </View>
        </Marker>
        {driverLocation && (
          <Marker
            coordinate={{ latitude: driverLocation.lat, longitude: driverLocation.lng }}
            title={order.driver?.name || 'Driver'}
          >
            <View style={styles.driverMarker}>
              <Icon name="truck-delivery" size={20} color="#fff" />
            </View>
          </Marker>
        )}
      </MapView>

      <View style={styles.bottomSheet}>
        <Text style={styles.title}>Order #{order.id.slice(0, 8)}</Text>
        <Text style={styles.status}>{order.status.replace('_', ' ').toUpperCase()}</Text>

        {order.driver && (
          <View style={styles.driverInfo}>
            <Icon name="account" size={20} color="#7380ec" />
            <Text style={styles.driverText}>{order.driver.name} • {order.driver.phone}</Text>
          </View>
        )}

        <View style={styles.progressBar}>
          {STATUS_STEPS.map((step, index) => (
            <View key={step.key} style={styles.stepContainer}>
              <View style={[styles.stepDot, index <= getCurrentStepIndex() && styles.stepDotActive]} />
              <Text style={[styles.stepLabel, index <= getCurrentStepIndex() && styles.stepLabelActive]}>
                {step.label}
              </Text>
              {index < STATUS_STEPS.length - 1 && (
                <View style={[styles.stepLine, index < getCurrentStepIndex() && styles.stepLineActive]} />
              )}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  map: { width, height: height * 0.5 },
  homeMarker: { backgroundColor: '#41f1b6', padding: 8, borderRadius: 20, borderWidth: 2, borderColor: '#fff' },
  driverMarker: { backgroundColor: '#7380ec', padding: 8, borderRadius: 20, borderWidth: 2, borderColor: '#fff' },
  bottomSheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, flex: 1 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  status: { fontSize: 14, color: '#7380ec', fontWeight: '600', marginTop: 4 },
  driverInfo: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 },
  driverText: { fontSize: 14, color: '#666' },
  progressBar: { flexDirection: 'row', marginTop: 20, justifyContent: 'space-between' },
  stepContainer: { alignItems: 'center', flex: 1 },
  stepDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#ddd' },
  stepDotActive: { backgroundColor: '#7380ec' },
  stepLabel: { fontSize: 10, color: '#999', marginTop: 4, textAlign: 'center' },
  stepLabelActive: { color: '#7380ec', fontWeight: '600' },
  stepLine: { position: 'absolute', top: 5, right: -50, width: 40, height: 2, backgroundColor: '#ddd' },
  stepLineActive: { backgroundColor: '#7380ec' },
});
