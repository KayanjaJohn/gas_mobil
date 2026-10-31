import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import api from '../services/api';
import { Order } from '../types';

export default function OrderDetailScreen() {
  const route = useRoute<any>();
  const { orderId } = route.params;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, []);

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/orders/${orderId}`);
      setOrder(res.data.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Use /driver/delivery/:id/status instead of /delivery/:id/status
  const updateDeliveryStatus = async (status: string) => {
    try {
      const deliveryId = order?.deliveries?.[0]?.id;
      if (!deliveryId) {
        Alert.alert('Error', 'No delivery found for this order');
        return;
      }
      await api.put(`/driver/delivery/${deliveryId}/status`, { status });
      Alert.alert('Success', 'Status updated');
      fetchOrder();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Update failed');
    }
  };

  if (loading || !order) {
    return (
      <View style={styles.center}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Order Information</Text>
        <DetailRow label="Order ID" value={`#${order.id.slice(0, 8)}`} />
        <DetailRow label="Status" value={order.status.replace('_', ' ').toUpperCase()} />
        <DetailRow label="Amount" value={`UGX ${Number(order.totalAmount).toLocaleString()}`} />
        <DetailRow label="Payment" value={`${order.paymentMethod} (${order.paymentStatus})`} />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Delivery Details</Text>
        <DetailRow label="Address" value={order.deliveryAddress} />
        <DetailRow label="City" value={order.deliveryCity || 'N/A'} />
        {order.notes && <DetailRow label="Notes" value={order.notes} />}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Items</Text>
        {order.items?.map((item, index) => (
          <View key={index} style={styles.itemRow}>
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
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#7380ec' }]}
            onPress={() => updateDeliveryStatus('picked_up')}
          >
            <Text style={styles.actionText}>Confirm Pickup</Text>
          </TouchableOpacity>
        )}
        {order.status === 'picked_up' && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#ffbb55' }]}
            onPress={() => updateDeliveryStatus('in_transit')}
          >
            <Text style={styles.actionText}>Start Delivery</Text>
          </TouchableOpacity>
        )}
        {order.status === 'in_transit' && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#41f1b6' }]}
            onPress={() => updateDeliveryStatus('delivered')}
          >
            <Text style={styles.actionText}>Mark as Delivered</Text>
          </TouchableOpacity>
        )}
      </View>
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
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    margin: 12,
    marginBottom: 0,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemName: {
    flex: 2,
    fontSize: 14,
  },
  itemQty: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
  },
  itemPrice: {
    flex: 1,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '500',
    color: '#7380ec',
  },
  actions: {
    padding: 12,
    gap: 12,
  },
  actionBtn: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
