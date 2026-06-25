import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.[0]}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.menu}>
        <MenuItem icon="map-marker" label="Saved Addresses" />
        <MenuItem icon="wallet" label="My Wallet" />
        <MenuItem icon="credit-card" label="Payment Methods" />
        <MenuItem icon="bell" label="Notifications" />
        <MenuItem icon="help-circle" label="Help & Support" />
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Icon name="logout" size={20} color="#ff7782" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

function MenuItem({ icon, label }: { icon: string; label: string }) {
  return (
    <TouchableOpacity style={styles.menuItem}>
      <Icon name={icon} size={24} color="#7380ec" />
      <Text style={styles.menuText}>{label}</Text>
      <Icon name="chevron-right" size={20} color="#999" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { alignItems: 'center', padding: 24, backgroundColor: '#fff', marginBottom: 12 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#7380ec', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 32, color: '#fff', fontWeight: 'bold' },
  name: { fontSize: 22, fontWeight: 'bold', marginTop: 12, color: '#333' },
  email: { fontSize: 14, color: '#666', marginTop: 4 },
  menu: { backgroundColor: '#fff' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  menuText: { flex: 1, marginLeft: 16, fontSize: 16, color: '#333' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', margin: 16, padding: 16, backgroundColor: '#fff', borderRadius: 12 },
  logoutText: { marginLeft: 8, fontSize: 16, color: '#ff7782', fontWeight: '600' },
});
