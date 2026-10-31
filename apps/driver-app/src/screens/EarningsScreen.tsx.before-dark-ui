import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';

interface Earning {
  id: string;
  orderId: string;
  amount: number;
  status: string;
  createdAt: string;
  order?: { deliveryAddress: string };
}

export default function EarningsScreen() {
  const navigation = useNavigation();
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEarnings = async () => {
    try {
      const res = await api.get('/driver/earnings');
      if (res.data?.success) {
        setEarnings(res.data.data.earnings || []);
        setTotal(res.data.data.totalEarnings || 0);
      }
    } catch (err: any) {
      console.error('[Earnings] Fetch error:', err.message);
    }
  };

  useEffect(() => {
    fetchEarnings().then(() => setLoading(false));
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEarnings();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Earnings</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Earnings</Text>
        <Text style={styles.totalAmount}>UGX {total.toLocaleString()}</Text>
        <Text style={styles.totalSub}>{earnings.length} deliveries completed</Text>
      </View>

      <Text style={styles.sectionTitle}>Recent Earnings</Text>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F59E0B" />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator color="#F59E0B" style={{ marginTop: 40 }} />
        ) : earnings.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No earnings yet</Text>
            <Text style={styles.emptySub}>Complete deliveries to earn</Text>
          </View>
        ) : (
          earnings.map(e => (
            <View key={e.id} style={styles.earningCard}>
              <View style={styles.earningHeader}>
                <Text style={styles.earningId}>Order #{e.orderId?.slice(0, 8)}</Text>
                <Text style={[styles.earningStatus, { color: e.status === 'paid' ? '#22C55E' : '#F59E0B' }]}>
                  {e.status}
                </Text>
              </View>
              <Text style={styles.earningAddress}>📍 {e.order?.deliveryAddress || 'Unknown address'}</Text>
              <Text style={styles.earningAmount}>UGX {e.amount?.toLocaleString()}</Text>
              <Text style={styles.earningDate}>{new Date(e.createdAt).toLocaleDateString()}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1120' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backText: { color: '#fff', fontSize: 28, fontWeight: '300' },
  title: { color: '#fff', fontSize: 18, fontWeight: '700' },
  totalCard: {
    backgroundColor: '#1E293B', borderRadius: 16, padding: 24,
    marginHorizontal: 20, marginBottom: 20, borderWidth: 1, borderColor: '#334155',
    alignItems: 'center',
  },
  totalLabel: { color: '#94A3B8', fontSize: 14, marginBottom: 8 },
  totalAmount: { color: '#F59E0B', fontSize: 32, fontWeight: '700' },
  totalSub: { color: '#64748B', fontSize: 12, marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#fff', paddingHorizontal: 20, marginBottom: 12 },
  emptyBox: { paddingHorizontal: 20, paddingVertical: 40, alignItems: 'center' },
  emptyText: { color: '#94A3B8', fontSize: 16, fontWeight: '600' },
  emptySub: { color: '#64748B', fontSize: 13, marginTop: 4 },
  earningCard: {
    backgroundColor: '#1E293B', borderRadius: 14, padding: 16,
    marginHorizontal: 20, marginBottom: 10, borderWidth: 1, borderColor: '#334155',
  },
  earningHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  earningId: { color: '#fff', fontSize: 14, fontWeight: '600' },
  earningStatus: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  earningAddress: { color: '#94A3B8', fontSize: 12, marginBottom: 6 },
  earningAmount: { color: '#F59E0B', fontSize: 16, fontWeight: '700' },
  earningDate: { color: '#64748B', fontSize: 11, marginTop: 4 },
});
