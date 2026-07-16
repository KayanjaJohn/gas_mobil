import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatusBadgeProps {
  status: string;
  size?: 'small' | 'medium' | 'large';
}

const STATUS_COLORS: Record<string, string> = {
  online: '#41f1b6',
  offline: '#ff7782',
  busy: '#ffbb55',
  on_break: '#7380ec',
  pending: '#ffbb55',
  confirmed: '#7380ec',
  driver_assigned: '#7380ec',
  picked_up: '#ffbb55',
  in_transit: '#ff7782',
  nearby: '#7380ec',
  delivered: '#41f1b6',
  completed: '#41f1b6',
  cancelled: '#ff7782',
  failed: '#ff7782',
  refunded: '#999',
};

const STATUS_LABELS: Record<string, string> = {
  online: 'Online',
  offline: 'Offline',
  busy: 'Busy',
  on_break: 'On Break',
  pending: 'Pending',
  confirmed: 'Confirmed',
  driver_assigned: 'Assigned',
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
  nearby: 'Nearby',
  delivered: 'Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled',
  failed: 'Failed',
  refunded: 'Refunded',
};

export default function StatusBadge({ status, size = 'medium' }: StatusBadgeProps) {
  const color = STATUS_COLORS[status] || '#999';
  const label = STATUS_LABELS[status] || status.replace('_', ' ');

  const sizeStyles = {
    small: { paddingVertical: 2, paddingHorizontal: 6, fontSize: 10 },
    medium: { paddingVertical: 4, paddingHorizontal: 8, fontSize: 12 },
    large: { paddingVertical: 6, paddingHorizontal: 12, fontSize: 14 },
  };

  return (
    <View style={[styles.badge, { backgroundColor: color }, sizeStyles[size]]}>
      <Text style={[styles.text, { fontSize: sizeStyles[size].fontSize }]}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  text: {
    color: '#fff',
    fontWeight: '700',
  },
});
