import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.[0]}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.role}>Driver</Text>
      </View>

      <View style={styles.infoCard}>
        <InfoRow label="Email" value={user?.email} />
        <InfoRow label="Phone" value={user?.phone} />
        <InfoRow label="Vehicle" value={`${user?.vehicleType || 'Vehicle not set'} • ${user?.vehicleNumber || 'No number'}`} />
        <InfoRow label="Station" value={user?.station?.name || 'Not assigned'} />
        <InfoRow 
          label="Status" 
          value={user?.driverStatus?.toUpperCase()} 
          valueColor={user?.driverStatus === 'online' ? '#168447' : '#F36A21'}
        />
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

function InfoRow({ label, value, valueColor = '#0B3D2E' }: { label: string; value?: string; valueColor?: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, { color: valueColor }]}>{value || 'N/A'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B3D2E',
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F36A21',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    color: '#FFF8EE',
    fontWeight: 'bold',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0B3D2E',
  },
  role: {
    fontSize: 14,
    color: '#F36A21',
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: '#FFF8EE',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#D8CDBB',
  },
  infoLabel: {
    fontSize: 14,
    color: '#68786F',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: '#DC2626',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
