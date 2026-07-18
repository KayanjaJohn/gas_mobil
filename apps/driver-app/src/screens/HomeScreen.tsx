import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { initializeSocket, disconnectSocket, onNewOrder } from '../services/socketService';
import api from '../services/api';

interface DriverStats {
  todayOrders: number;
  todayCompleted: number;
  todayEarnings: number;
  totalDeliveries: number;
}

export default function HomeScreen() {
  const { user, updateStatus } = useAuth();
  const [isOnline, setIsOnline] = useState(user?.driverStatus === 'online');
  const [stats, setStats] = useState<DriverStats>({
    todayOrders: 0,
    todayCompleted: 0,
    todayEarnings: 0,
    totalDeliveries: 0,
  });
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    setupSocket();
    fetchStats();
    return () => {
      disconnectSocket();
    };
  }, []);

  const setupSocket = async () => {
    await initializeSocket();
    onNewOrder((data) => {
      Alert.alert('New Order!', `Order #${data.orderId} has been assigned to you`);
    });
  };

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await api.get('/driver/stats');
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (error) {
      console.error('Fetch stats error:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const toggleOnlineStatus = async () => {
    const newStatus = isOnline ? 'offline' : 'online';
    try {
      await updateStatus(newStatus);
      setIsOnline(!isOnline);
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0]}</Text>
        <Text style={styles.vehicle}>{user?.vehicleNumber} • {user?.vehicleType}</Text>
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>You are currently</Text>
        <Text style={[styles.statusText, isOnline ? styles.online : styles.offline]}>
          {isOnline ? 'ONLINE' : 'OFFLINE'}
        </Text>
        <Switch
          value={isOnline}
          onValueChange={toggleOnlineStatus}
          trackColor={{ false: '#767577', true: '#41f1b6' }}
          thumbColor={isOnline ? '#fff' : '#f4f3f4'}
        />
        <Text style={styles.statusHint}>
          {isOnline ? 'You will receive new orders' : 'You will not receive orders'}
        </Text>
      </View>

      <View style={styles.statsGrid}>
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
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalDeliveries}</Text>
          <Text style={styles.statLabel}>Total Deliveries</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  vehicle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
  },
  statusText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  online: {
    color: '#41f1b6',
  },
  offline: {
    color: '#ff7782',
  },
  statusHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '47%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#7380ec',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});
