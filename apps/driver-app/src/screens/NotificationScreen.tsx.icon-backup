import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl,
  ActivityIndicator, SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDriverNotifications, DriverNotification } from '../hooks/useDriverNotifications';

const ICONS: Record<string, string> = {
  new_order_assigned: '📦',
  order_placed: '🛒',
  order_confirmed: '✅',
  driver_assigned: '🚚',
  picked_up: '📦',
  in_transit: '🚛',
  nearby: '📍',
  delivered: '🏠',
  cancelled: '❌',
  payment_received: '💰',
  payment_failed: '💳',
  system_announcement: '📢',
};

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
  } = useDriverNotifications();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: DriverNotification }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => {
        if (!item.isRead) markAsRead(item.id);
        if (item.orderId) {
          navigation.navigate('OrderDetail' as never, { orderId: item.orderId } as never);
        }
      }}
      style={[styles.item, !item.isRead && styles.itemUnread]}
    >
      <View style={styles.iconBox}>
        <Text style={{ fontSize: 22 }}>{ICONS[item.type] || '🔔'}</Text>
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, !item.isRead && styles.titleUnread]}>
          {item.title}
        </Text>
        <Text style={styles.message}>{item.message}</Text>
        <Text style={styles.time}>{new Date(item.createdAt).toLocaleString()}</Text>
      </View>
      <TouchableOpacity
        onPress={() => deleteNotification(item.id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={styles.deleteBtn}>×</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.markAll}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {unreadCount > 0 && (
        <View style={styles.unreadBar}>
          <Text style={styles.unreadText}>{unreadCount} unread</Text>
        </View>
      )}

      {loading && notifications.length === 0 ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#F59E0B" />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F59E0B" />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🔔</Text>
              <Text style={styles.emptyTitle}>No notifications</Text>
              <Text style={styles.emptySub}>You'll see order updates here.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1120' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#1E293B',
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1E293B', alignItems: 'center', justifyContent: 'center' },
  backIcon: { color: '#fff', fontSize: 18 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700', flex: 1, marginLeft: 12 },
  markAll: { color: '#F59E0B', fontSize: 13, fontWeight: '600' },
  unreadBar: { backgroundColor: 'rgba(245,158,11,0.1)', paddingHorizontal: 20, paddingVertical: 8 },
  unreadText: { color: '#F59E0B', fontSize: 12, fontWeight: '600' },
  item: {
    flexDirection: 'row', alignItems: 'flex-start',
    padding: 16, marginHorizontal: 16, marginTop: 10,
    backgroundColor: '#1E293B', borderRadius: 14, borderWidth: 1, borderColor: '#334155',
  },
  itemUnread: { borderColor: '#F59E0B', backgroundColor: 'rgba(245,158,11,0.06)' },
  iconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  content: { flex: 1 },
  title: { color: '#fff', fontSize: 14, fontWeight: '600' },
  titleUnread: { fontWeight: '700' },
  message: { color: '#94A3B8', fontSize: 12, marginTop: 3, lineHeight: 18 },
  time: { color: '#64748B', fontSize: 11, marginTop: 6 },
  deleteBtn: { color: '#64748B', fontSize: 20, paddingHorizontal: 4 },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  emptySub: { color: '#64748B', fontSize: 13, marginTop: 4 },
});