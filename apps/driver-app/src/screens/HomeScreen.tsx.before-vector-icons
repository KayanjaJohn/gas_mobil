import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useDriverNotifications } from '../hooks/useDriverNotifications';
import api from '../services/api';

interface Order {
  id: string;
  status: string;
  deliveryAddress: string;
  totalAmount: number;
  createdAt: string;
  user?: { name: string; phone: string };
}

interface Stats {
  todayOrders: number;
  todayCompleted: number;
  todayEarnings: number;
  totalDeliveries: number;
}

export default function HomeScreen() {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const { unreadCount } = useDriverNotifications();

  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats>({
    todayOrders: 0, todayCompleted: 0, todayEarnings: 0, totalDeliveries: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [ordersRes, statsRes] = await Promise.all([
        api.get('/driver/orders'),
        api.get('/driver/stats'),
      ]);

      if (ordersRes.data?.success) {
        setOrders(ordersRes.data.data || []);
      }
      if (statsRes.data?.success) {
        setStats(statsRes.data.data || { todayOrders: 0, todayCompleted: 0, todayEarnings: 0, totalDeliveries: 0 });
      }
    } catch (err: any) {
      console.error('[Home] Fetch error:', err.message);
    }
  }, []);

  useEffect(() => {
    fetchData().then(() => setLoading(false));
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const pendingOrders = orders.filter(o => ['confirmed', 'driver_assigned', 'picked_up'].includes(o.status));

  return (
    <View style={styles.container}>
      {/* ── HEADER WITH NOTIFICATION BELL ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0] || 'Driver'}</Text>
          <Text style={styles.subtitle}>{user?.station?.name || 'GasMobil Driver'}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity
            style={styles.bellBtn}
            onPress={() => navigation.navigate('Notifications' as never)}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 18 }}>🔔</Text>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => navigation.navigate('Profile' as never)}
          >
            <Text style={styles.profileText}>{user?.name?.charAt(0)?.toUpperCase() || 'D'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F59E0B" />}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.todayOrders}</Text>
            <Text style={styles.statLabel}>Today's Orders</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.todayCompleted}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>UGX {stats.todayEarnings.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Earnings</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Earnings' as never)}>
            <Text style={styles.actionIcon}>💰</Text>
            <Text style={styles.actionText}>Earnings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Profile' as never)}>
            <Text style={styles.actionIcon}>⚙️</Text>
            <Text style={styles.actionText}>Settings</Text>
          </TouchableOpacity>
        </View>

        {/* Pending Orders */}
        <Text style={styles.sectionTitle}>Pending Orders ({pendingOrders.length})</Text>
        {loading ? (
          <ActivityIndicator style={{ marginTop: 20 }} color="#F59E0B" />
        ) : pendingOrders.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No pending orders</Text>
          </View>
        ) : (
          pendingOrders.map(order => (
            <TouchableOpacity
              key={order.id}
              style={styles.orderCard}
              onPress={() => navigation.navigate('OrderDetail' as never, { orderId: order.id } as never)}
              activeOpacity={0.8}
            >
              <View style={styles.orderHeader}>
                <Text style={styles.orderId}>Order #{order.id.slice(0, 8)}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                  <Text style={styles.statusText}>{order.status.replace('_', ' ')}</Text>
                </View>
              </View>
              <Text style={styles.orderAddress}>📍 {order.deliveryAddress}</Text>
              <Text style={styles.orderCustomer}>👤 {order.user?.name || 'Customer'}</Text>
              <Text style={styles.orderAmount}>UGX {order.totalAmount?.toLocaleString() || '0'}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'confirmed': return 'rgba(59,130,246,0.2)';
    case 'driver_assigned': return 'rgba(245,158,11,0.2)';
    case 'picked_up': return 'rgba(139,92,246,0.2)';
    case 'in_transit': return 'rgba(6,182,212,0.2)';
    case 'delivered': return 'rgba(34,197,94,0.2)';
    default: return 'rgba(148,163,184,0.2)';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1120' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
  },
  greeting: { fontSize: 20, fontWeight: '700', color: '#fff' },
  subtitle: { fontSize: 13, color: '#94A3B8', marginTop: 2 },
  bellBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#1E293B',
    borderWidth: 1, borderColor: '#334155', alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute', top: -2, right: -2,
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: '#dc2626', borderWidth: 2, borderColor: '#0B1120',
    alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  profileBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#F59E0B',
    alignItems: 'center', justifyContent: 'center',
  },
  profileText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 20 },
  statCard: {
    flex: 1, backgroundColor: '#1E293B', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#334155', alignItems: 'center',
  },
  statNumber: { fontSize: 18, fontWeight: '700', color: '#F59E0B' },
  statLabel: { fontSize: 11, color: '#94A3B8', marginTop: 4 },
  actionsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 20 },
  actionBtn: {
    flex: 1, backgroundColor: '#1E293B', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#334155', alignItems: 'center',
  },
  actionIcon: { fontSize: 24, marginBottom: 6 },
  actionText: { color: '#fff', fontSize: 13, fontWeight: '500' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#fff', paddingHorizontal: 20, marginBottom: 12 },
  emptyBox: { paddingHorizontal: 20, paddingVertical: 30, alignItems: 'center' },
  emptyText: { color: '#64748B', fontSize: 14 },
  orderCard: {
    backgroundColor: '#1E293B', borderRadius: 14, padding: 16,
    marginHorizontal: 20, marginBottom: 10, borderWidth: 1, borderColor: '#334155',
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  orderId: { color: '#fff', fontSize: 14, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { color: '#fff', fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  orderAddress: { color: '#94A3B8', fontSize: 13, marginBottom: 4 },
  orderCustomer: { color: '#94A3B8', fontSize: 13, marginBottom: 4 },
  orderAmount: { color: '#F59E0B', fontSize: 14, fontWeight: '700' },
});