import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useThemedAlert } from '../hooks/useThemedAlert';

export default function ProfileScreen() {
  const { user, logout, updateProfile } = useAuth();
  const { showAlert, alertModal } = useThemedAlert();
  const [editVisible, setEditVisible] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(user?.name || '');
    setPhone(user?.phone || '');
  }, [user?.name, user?.phone]);

  const handleLogout = () => {
    showAlert(
      'Sign out of GasMobil?',
      'You will need to sign in again to receive and manage deliveries.',
      'confirm',
      [
        { label: 'Cancel', tone: 'secondary' },
        { label: 'Sign out', tone: 'danger', onPress: logout },
      ]
    );
  };

  const saveProfile = async () => {
    if (!name.trim() || !phone.trim()) {
      showAlert('Details required', 'Enter your registered name and phone number.', 'warning');
      return;
    }
    setSaving(true);
    const result = await updateProfile({ name, phone });
    setSaving(false);
    if (!result.success) {
      showAlert('Profile not updated', result.error || 'Please try again.', 'error');
      return;
    }
    setEditVisible(false);
    showAlert('Profile updated', 'Your driver information has been saved.', 'success');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.trim()?.[0]?.toUpperCase() || 'D'}</Text>
        </View>
        <Text style={styles.name}>{user?.name || 'Registered driver'}</Text>
        <Text style={styles.role}>GasMobil delivery partner</Text>
      </View>

      <View style={styles.infoCard}>
        <InfoRow label="Registered name" value={user?.name} />
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

      <TouchableOpacity style={styles.editButton} onPress={() => setEditVisible(true)}>
        <Text style={styles.editText}>Edit profile information</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <Modal visible={editVisible} transparent animationType="slide" onRequestClose={() => setEditVisible(false)}>
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit driver information</Text>
            <Text style={styles.fieldLabel}>Registered name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Full registered name"
              placeholderTextColor="#8B9A91"
              autoCapitalize="words"
              style={styles.input}
              editable={!saving}
            />
            <Text style={styles.fieldLabel}>Phone number</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="Phone number"
              placeholderTextColor="#8B9A91"
              keyboardType="phone-pad"
              style={styles.input}
              editable={!saving}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setEditVisible(false)}
                disabled={saving}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={saveProfile} disabled={saving}>
                {saving ? <ActivityIndicator color="#FFF8EE" /> : <Text style={styles.saveText}>Save changes</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      {alertModal}
    </ScrollView>
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
  container: { flex: 1, backgroundColor: '#0B3D2E' },
  content: { padding: 16, paddingBottom: 34 },
  header: { alignItems: 'center', marginBottom: 24, paddingTop: 12 },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#F36A21',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 32, color: '#FFF8EE', fontWeight: 'bold' },
  name: { fontSize: 22, fontWeight: 'bold', color: '#FFF8EE', textAlign: 'center' },
  role: { fontSize: 14, color: '#FFC08F', marginTop: 4 },
  infoCard: { backgroundColor: '#FFF8EE', borderRadius: 12, padding: 16, marginBottom: 18 },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#D8CDBB',
  },
  infoLabel: { fontSize: 13, color: '#68786F', flex: 1 },
  infoValue: { fontSize: 14, fontWeight: '600', flex: 1.4, textAlign: 'right' },
  editButton: { backgroundColor: '#FFF8EE', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  editText: { color: '#0B3D2E', fontSize: 15, fontWeight: '800' },
  logoutButton: { backgroundColor: '#DC2626', padding: 16, borderRadius: 12, alignItems: 'center' },
  logoutText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  modalBackdrop: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: 'rgba(0,0,0,0.62)' },
  modalCard: { backgroundColor: '#FFF8EE', borderRadius: 18, padding: 20 },
  modalTitle: { color: '#0B3D2E', fontSize: 19, fontWeight: '800', marginBottom: 18 },
  fieldLabel: { color: '#0B3D2E', fontSize: 13, fontWeight: '700', marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: '#D8CDBB', borderRadius: 10, padding: 13,
    color: '#0B3D2E', fontSize: 15, marginBottom: 14, backgroundColor: '#FFFFFF',
  },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelButton: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: '#E8DFD1', alignItems: 'center' },
  cancelText: { color: '#0B3D2E', fontWeight: '700' },
  saveButton: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: '#F36A21', alignItems: 'center' },
  saveText: { color: '#FFF8EE', fontWeight: '800' },
});
