import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import api from '../services/api';

interface EarningRecord {
  id: string;
  date: string;
  orderId: string;
  amount: number;
  status: 'pending' | 'paid';
  customerName: string;
}

interface EarningsData {
  earnings: EarningRecord[];
  totalEarnings: number;
}

export default function EarningsScreen() {
  const [earnings, setEarnings] = useState<EarningRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/driver/earnings');
      if (res.data.success) {
        const data: EarningsData = res.data.data;
        setEarnings(data.earnings);
        setTotal(data.totalEarnings);
      }
    } catch (error) {
      console.error('Fetch earnings error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderEarning = ({ item }: { item: EarningRecord }) => (
    <View style={styles.earningCard}>
      <View style={{ flex: 1 }}>
        <Text style={styles.orderId}>Order #{item.orderId.slice(0, 8)}</Text>
        <Text style={styles.customer}>{item.customerName}</Text>
        <Text style={styles.date}>{new Date(item.date).toLocaleDateString()}</Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.amount}>UGX {item.amount.toLocaleString()}</Text>
        <View style={[styles.statusBadge, item.status === 'paid' ? styles.paid : styles.pending]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total Earnings</Text>
        <Text style={styles.summaryAmount}>UGX {total.toLocaleString()}</Text>
      </View>

      <Text style={styles.sectionTitle}>Recent Earnings</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#7380ec" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={earnings}
          renderItem={renderEarning}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No earnings yet</Text>
              <Text style={styles.emptySubtext}>Complete deliveries to start earning</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  summaryCard: {
    backgroundColor: '#7380ec',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
  },
  summaryLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  summaryAmount: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  earningCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  customer: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  date: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7380ec',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 4,
  },
  paid: {
    backgroundColor: '#41f1b6',
  },
  pending: {
    backgroundColor: '#ffbb55',
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  empty: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bbb',
    marginTop: 8,
  },
});
