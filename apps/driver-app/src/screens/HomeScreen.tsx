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

export default function HomeScreen() {
  const { user, updateStatus } = useAuth();
  const [isOnline, setIsOnline] = useState(user?.driverStatus === 'online');

  useEffect(() => {
    setupSocket();
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
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Today's Orders</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>UGX 0</Text>
          <Text style={styles.statLabel}>Earnings</Text>
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
    marginBottom: 20,
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
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 12,
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
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7380ec',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});
