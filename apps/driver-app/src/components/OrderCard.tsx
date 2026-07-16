import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import StatusBadge from './StatusBadge';
import { Order } from '../types';

interface OrderCardProps {
  order: Order;
  onPress?: () => void;
  onAccept?: () => void;
  showActions?: boolean;
}

export default function OrderCard({ order, onPress, onAccept, showActions = true }: OrderCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.header}>
        <Text style={styles.orderId}>Order #{order.id.slice(0, 8)}</Text>
        <StatusBadge status={order.status} size="small" />
      </View>

      <View style={styles.info}>
        <Text style={styles.label}>Delivery Address</Text>
        <Text style={styles.value}>{order.deliveryAddress}</Text>
      </View>

      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={styles.label}>Amount</Text>
          <Text style={styles.amount}>UGX {Number(order.totalAmount).toLocaleString()}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.label}>Payment</Text>
          <Text style={styles.value}>{order.paymentMethod}</Text>
        </View>
      </View>

      {order.user && (
        <View style={styles.info}>
          <Text style={styles.label}>Customer</Text>
          <Text style={styles.value}>{order.user.name} • {order.user.phone}</Text>
        </View>
      )}

      {order.items && order.items.length > 0 && (
        <View style={styles.items}>
          <Text style={styles.label}>Items ({order.items.length})</Text>
          {order.items.map((item, idx) => (
            <Text key={idx} style={styles.itemText}>
              • {item.product?.name || 'Product'} x{item.quantity}
            </Text>
          ))}
        </View>
      )}

      {showActions && order.status === 'driver_assigned' && onAccept && (
        <TouchableOpacity style={styles.acceptButton} onPress={onAccept}>
          <Text style={styles.acceptText}>Accept Order</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  info: {
    marginBottom: 8,
  },
  label: {
    fontSize: 11,
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  value: {
    fontSize: 14,
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    gap: 24,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7380ec',
  },
  items: {
    marginTop: 4,
    marginBottom: 8,
  },
  itemText: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  acceptButton: {
    backgroundColor: '#41f1b6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  acceptText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
