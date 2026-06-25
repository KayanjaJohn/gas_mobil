import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../services/api';

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  deliveryAddress: string;
  createdAt: string;
  items?: any[];
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#ffbb55',
  confirmed: '#7380ec',
  driver_assigned: '#7380ec',
  picked_up: '#ffbb55',
  in_transit: '#ff7782',
  nearby: '#7380ec',
  delivered: '#41f1b6',
  completed: '#41f1b6',
  cancelled: '#ff7782',
};

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<any>();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders');
      setOrders(res.data.data || []);
    } catch (error) {
      console.error('Fetch orders error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const renderOrder = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => navigation.navigate('OrderTracking', { orderId: item.id })}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>Order #{item.id.slice(0, 8)}</Text>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] || '#999' }]}>
          <Text style={styles.statusText}>{item.status.replace('_', ' ').toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.address}>{item.deliveryAddress}</Text>
      <View style={styles.orderFooter}>
        <Text style={styles.amount}>UGX {Number(item.totalAmount).toLocaleString()}</Text>
        <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>
      {item.status === 'pending' && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => cancelOrder(item.id)}
        >
          <Text style={styles.cancelText}>Cancel Order</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  const cancelOrder = async (orderId: string) => {
    try {
      await api.post(`/orders/${orderId}/cancel`, { reason: 'Customer cancelled' });
      fetchOrders();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to cancel');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Orders</Text>
      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchOrders} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="package-variant" size={64} color="#ddd" />
            <Text style={styles.emptyText}>No orders yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: 'bold', padding: 16, color: '#333' },
  orderCard: { backgroundColor: '#fff', margin: 12, marginBottom: 0, padding: 16, borderRadius: 12 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  orderId: { fontSize: 16, fontWeight: '600', color: '#333' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  address: { fontSize: 14, color: '#666', marginBottom: 8 },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amount: { fontSize: 16, fontWeight: 'bold', color: '#7380ec' },
  date: { fontSize: 12, color: '#999' },
  cancelButton: { marginTop: 12, padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#ff7782', alignItems: 'center' },
  cancelText: { color: '#ff7782', fontWeight: '600' },
  empty: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 16, color: '#999', marginTop: 12 },
});
