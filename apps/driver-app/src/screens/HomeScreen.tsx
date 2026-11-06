import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect, type NavigationProp } from '@react-navigation/native';
import { useDriverLocation } from '../hooks/useDriverLocation';
import { useAuth } from '../context/AuthContext';
import { useDriverNotifications } from '../hooks/useDriverNotifications';
import api from '../services/api';

type DriverStackParamList = {
  Login: undefined;
  Home: undefined;
  OrderDetail: { orderId: string };
  Delivery: undefined;
  Earnings: undefined;
  Profile: undefined;
  Notifications: undefined;
};

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
  const navigation = useNavigation<NavigationProp<DriverStackParamList>>();
  const { user, logout } = useAuth();
  const { unreadCount } = useDriverNotifications();

  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats>({
    todayOrders: 0, todayCompleted: 0, todayEarnings: 0, totalDeliveries: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [driverStatus, setDriverStatus] = useState<string>(user?.driverStatus || 'offline');
  const [savingStatus, setSavingStatus] = useState(false);
  const [statusError, setStatusError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [ordersRes, statsRes, profileRes] = await Promise.all([
        api.get('/driver/orders'),
        api.get('/driver/stats'),
        api.get('/driver/profile'),
      ]);

      if (ordersRes.data?.success) {
        setOrders(ordersRes.data.data || []);
      }
      if (statsRes.data?.success) {
        setStats(statsRes.data.data || { todayOrders: 0, todayCompleted: 0, todayEarnings: 0, totalDeliveries: 0 });
      }
      if (profileRes.data?.success) {
        setDriverStatus(profileRes.data.data?.driverStatus || 'offline');
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

  const activeOrders = orders.filter(o => ['in_transit', 'nearby'].includes(o.status));
  const pendingOrders = orders.filter(o => ['confirmed', 'driver_assigned', 'picked_up'].includes(o.status));
  const handleAvailabilityToggle = async () => {
    if (driverStatus === "busy" || driverStatus === "on_break") {
      setStatusError("Your status is controlled by your current delivery or break.");
      return;
    }
    if (driverStatus === "online" && activeOrders.length > 0) {
      setStatusError("Complete your active delivery before going offline.");
      return;
    }
    const nextStatus = driverStatus === "online" ? "offline" : "online";
    setSavingStatus(true);
    setStatusError("");
    try {
      const response = await api.put("/driver/status", { status: nextStatus });
      if (!response.data?.success) throw new Error(response.data?.error || "Status update failed.");
      setDriverStatus(nextStatus);
    } catch (error: any) {
      setStatusError(error?.response?.data?.error || error?.message || "Could not update your availability.");
    } finally {
      setSavingStatus(false);
    }
  };

  const activeOrderIds = useMemo(() => activeOrders.map((order) => order.id), [orders]);
  const activeOrderKey = activeOrderIds.join(',');
  const { startTracking, stopTracking, currentLocation } = useDriverLocation(activeOrderIds);

  // Resume location sharing after app restart while an assigned delivery is active.
  // Focus cleanup prevents Home and OrderDetail from running duplicate GPS watchers.
  useFocusEffect(
    useCallback(() => {
      if (activeOrderIds.length === 0) return;
      startTracking().catch((error: any) => {
        console.error('[Home] Unable to resume active delivery GPS:', error?.message || error);
      });
      return () => stopTracking();
    }, [activeOrderKey, startTracking, stopTracking])
  );

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
            <Icon name="bell-ring" size={25} color="#0A3D2E" />
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
        <View style={styles.availabilityCard}>
          <View style={styles.availabilityCopy}>
            <View style={styles.availabilityTitleRow}>
              <View style={[styles.availabilityDot, { backgroundColor: driverStatus === "online" ? "#16A34A" : "#9CA3AF" }]} />
              <Text style={styles.availabilityTitle}>Driver availability</Text>
            </View>
            <Text style={styles.availabilitySub}>
              {driverStatus === "online" ? "You are available for new deliveries." :
               driverStatus === "busy" ? "You are currently on a delivery." :
               driverStatus === "on_break" ? "You are currently on a break." :
               "You are offline and will not receive new assignments."}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.availabilityButton, (savingStatus || driverStatus === "busy" || driverStatus === "on_break") && styles.availabilityButtonDisabled]}
            onPress={handleAvailabilityToggle}
            disabled={savingStatus || driverStatus === "busy" || driverStatus === "on_break"}
            activeOpacity={0.85}
          >
            {savingStatus ? <ActivityIndicator color="#FFFFFF" size="small" /> :
              <Text style={styles.availabilityButtonText}>{driverStatus === "online" ? "Go offline" : "Go online"}</Text>}
          </TouchableOpacity>
          {!!statusError && <Text style={styles.availabilityError}>{statusError}</Text>}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.todayOrders}</Text>
            <Text style={styles.statLabel}>Orders Today</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.todayCompleted}</Text>
            <Text style={styles.statLabel}>Completed Today</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>UGX {stats.todayEarnings.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Earnings</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Earnings' as never)}>
            <Icon name="cash-multiple" size={25} color="#F59E0B" style={styles.actionIcon} />
            <Text style={styles.actionText}>Earnings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Profile' as never)}>
            <Icon name="cog-outline" size={25} color="#F59E0B" style={styles.actionIcon} />
            <Text style={styles.actionText}>Settings</Text>
          </TouchableOpacity>
        </View>

        {/* Active delivery is separate from pending orders and restored after app restart. */}
        <Text style={styles.sectionTitle}>Active Deliveries ({activeOrders.length})</Text>
        {activeOrders.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No delivery currently in progress</Text>
          </View>
        ) : (
          activeOrders.map(order => (
            <TouchableOpacity
              key={order.id}
              style={[styles.orderCard, styles.activeOrderCard]}
              onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
              activeOpacity={0.8}
            >
              <View style={styles.orderHeader}>
                <Text style={styles.orderId}>Order #{order.id.slice(0, 8)}</Text>
                <View style={[styles.statusBadge, { backgroundColor: 'rgba(22,163,74,0.25)' }]}>
                  <Text style={styles.statusText}>{order.status.replace(/_/g, ' ').toUpperCase()}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Icon name="map-marker-outline" size={17} color="#F36A21" />
                <Text style={styles.orderAddress}> {order.deliveryAddress}</Text>
              </View>
              <View style={styles.infoRow}>
                <Icon name="crosshairs-gps" size={17} color={currentLocation ? '#22C55E' : '#F36A21'} />
                <Text style={styles.orderCustomer}>
                  {currentLocation ? 'Your live location is sharing' : 'Connecting to GPS…'}
                </Text>
              </View>
              <Text style={styles.orderAmount}>UGX {Number(order.totalAmount || 0).toLocaleString()}</Text>
              <Text style={styles.openDeliveryText}>VIEW LIVE DELIVERY  →</Text>
            </TouchableOpacity>
          ))
        )}

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
              onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
              activeOpacity={0.8}
            >
              <View style={styles.orderHeader}>
                <Text style={styles.orderId}>Order #{order.id.slice(0, 8)}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                  <Text style={styles.statusText}>{order.status.replace('_', ' ')}</Text>
                </View>
              </View>
              <View style={styles.infoRow}><Icon name="map-marker-outline" size={17} color="#94A3B8" /><Text style={styles.orderAddress}> {order.deliveryAddress}</Text></View>
              <View style={styles.infoRow}><Icon name="account-outline" size={17} color="#94A3B8" /><Text style={styles.orderCustomer}> {order.user?.name || 'Customer'}</Text></View>
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
  container: { flex: 1, backgroundColor: '#0A3D2E' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
  },
  greeting: { fontSize: 20, fontWeight: '700', color: '#FFF8EE' },
  subtitle: { fontSize: 13, color: '#D8E7DE', marginTop: 2 },
  bellBtn: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFF8EE',
    borderWidth: 2, borderColor: '#F36A21', alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
    position: 'relative',
  },
  badge: {
    position: 'absolute', top: -4, right: -4, shadowColor: '#E11D48', shadowOpacity: 0.55, shadowRadius: 5, shadowOffset: { width: 0, height: 1 }, elevation: 8,
    minWidth: 20, height: 20, borderRadius: 10,
    backgroundColor: '#E11D48', borderWidth: 2, borderColor: '#0A3D2E',
    alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { color: '#FFF8EE', fontSize: 10, fontWeight: '700' },
  profileBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#F36A21',
    alignItems: 'center', justifyContent: 'center',
  },
  profileText: { color: '#FFF8EE', fontWeight: '700', fontSize: 16 },
  availabilityCard: { marginHorizontal: 16, marginTop: 8, marginBottom: 18, padding: 15, borderRadius: 16, backgroundColor: '#FFF8EE', borderWidth: 1, borderColor: '#D8CDBB', flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  availabilityCopy: { flex: 1, minWidth: 170 },
  availabilityTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  availabilityDot: { width: 9, height: 9, borderRadius: 5 },
  availabilityTitle: { color: '#0A3D2E', fontSize: 14, fontWeight: '800' },
  availabilitySub: { color: '#68786F', fontSize: 11, marginTop: 5, lineHeight: 15 },
  availabilityButton: { minWidth: 100, minHeight: 42, paddingHorizontal: 13, borderRadius: 11, backgroundColor: '#138A43', alignItems: 'center', justifyContent: 'center' },
  availabilityButtonDisabled: { backgroundColor: '#75847C', opacity: .75 },
  availabilityButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  availabilityError: { width: '100%', color: '#B9362D', fontSize: 11, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 18 },
  statCard: {
    flex: 1, backgroundColor: '#FFF8EE', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 8,
    borderWidth: 1, borderColor: '#D8CDBB', alignItems: 'center',
  },
  statNumber: { fontSize: 18, fontWeight: '700', color: '#F36A21' },
  statLabel: { fontSize: 11, color: '#68786F', marginTop: 4 },
  actionsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 20 },
  actionBtn: {
    flex: 1, backgroundColor: '#FFF8EE', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#D8CDBB', alignItems: 'center',
  },
  actionIcon: { marginBottom: 6 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  actionText: { color: '#0A3D2E', fontSize: 13, fontWeight: '500' },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#FFF8EE', paddingHorizontal: 20, marginTop: 4, marginBottom: 12 },
  emptyBox: { paddingHorizontal: 20, paddingVertical: 30, alignItems: 'center' },
  emptyText: { color: '#68786F', fontSize: 14 },
  activeOrderCard: { borderColor: '#168447', borderWidth: 1.5, padding: 18, borderRadius: 17 },
  openDeliveryText: { color: '#F36A21', fontSize: 12, fontWeight: '900', letterSpacing: 0.4, marginTop: 12 },
  orderCard: {
    backgroundColor: '#FFF8EE', borderRadius: 14, padding: 16,
    marginHorizontal: 20, marginBottom: 10, borderWidth: 1, borderColor: '#D8CDBB',
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  orderId: { color: '#0A3D2E', fontSize: 14, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { color: '#0A3D2E', fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  orderAddress: { color: '#68786F', fontSize: 13, marginBottom: 4 },
  orderCustomer: { color: '#68786F', fontSize: 13, marginBottom: 4 },
  orderAmount: { color: '#F36A21', fontSize: 14, fontWeight: '700' },
});
