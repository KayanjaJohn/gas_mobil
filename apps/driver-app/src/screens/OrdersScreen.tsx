import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';
import { Order } from '../types';

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<any>();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/driver/orders');
      setOrders(res.data.data || []);
    } catch (error) {
      console.error('Fetch orders error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const acceptOrder = async (orderId: string) => {
    try {
      await api.post(`/driver/orders/${orderId}/accept`);
      Alert.alert('Success', 'Order accepted!');
      fetchOrders();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to accept order');
    }
  };

  const renderOrder = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>Order #{item.id.slice(0, 8)}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status.replace('_', ' ').toUpperCase()}</Text>
        </View>
      </View>

      <Text style={styles.address}>{item.deliveryAddress}</Text>
      <Text style={styles.amount}>UGX {Number(item.totalAmount).toLocaleString()}</Text>

      {item.status === 'driver_assigned' && (
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => acceptOrder(item.id)}
        >
          <Text style={styles.acceptButtonText}>Accept Order</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      driver_assigned: '#F36A21',
      picked_up: '#F36A21',
      in_transit: '#38BDF8',
      delivered: '#22C55E',
      completed: '#22C55E',
    };
    return colors[status] || '#68786F';
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchOrders} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No assigned orders</Text>
            <Text style={styles.emptySubtext}>Go online to receive orders</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B3D2E',
  },
  orderCard: {
    backgroundColor: '#FFF8EE',
    margin: 12,
    marginBottom: 0,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0B3D2E',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  address: {
    fontSize: 14,
    color: '#68786F',
    marginBottom: 8,
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F36A21',
  },
  acceptButton: {
    backgroundColor: '#21865D',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  acceptButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  empty: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#68786F',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#68786F',
    marginTop: 8,
  },
});
