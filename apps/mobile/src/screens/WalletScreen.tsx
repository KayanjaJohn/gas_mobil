import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../services/api';

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  date: string;
}

export default function WalletScreen() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [showTopUp, setShowTopUp] = useState(false);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      // TODO: Implement wallet endpoints
      // const res = await api.get('/wallet');
      // setBalance(res.data.data.balance);
      // setTransactions(res.data.data.transactions);
    } catch (error) {
      console.error('Fetch wallet error:', error);
    }
  };

  const handleTopUp = async () => {
    const amount = Number(topUpAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    // TODO: Implement top-up via mobile money
    Alert.alert('Top Up', `Initiating top-up of UGX ${amount.toLocaleString()}`);
    setShowTopUp(false);
    setTopUpAmount('');
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <View style={styles.transaction}>
      <View style={styles.transactionLeft}>
        <Icon
          name={item.type === 'credit' ? 'arrow-down-circle' : 'arrow-up-circle'}
          size={24}
          color={item.type === 'credit' ? '#41f1b6' : '#ff7782'}
        />
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionDesc}>{item.description}</Text>
          <Text style={styles.transactionDate}>{new Date(item.date).toLocaleDateString()}</Text>
        </View>
      </View>
      <Text style={[styles.transactionAmount, { color: item.type === 'credit' ? '#41f1b6' : '#ff7782' }]}>
        {item.type === 'credit' ? '+' : '-'} UGX {Number(item.amount).toLocaleString()}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Wallet Balance</Text>
        <Text style={styles.balanceAmount}>UGX {balance.toLocaleString()}</Text>
        <TouchableOpacity style={styles.topUpButton} onPress={() => setShowTopUp(true)}>
          <Text style={styles.topUpText}>Top Up</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Recent Transactions</Text>
      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={item => item.id}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No transactions yet</Text>
          </View>
        }
      />

      {showTopUp && (
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Top Up Wallet</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter amount (UGX)"
              keyboardType="numeric"
              value={topUpAmount}
              onChangeText={setTopUpAmount}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowTopUp(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={handleTopUp}>
                <Text style={styles.confirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  balanceCard: { backgroundColor: '#7380ec', margin: 16, padding: 24, borderRadius: 16, alignItems: 'center' },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  balanceAmount: { color: '#fff', fontSize: 36, fontWeight: 'bold', marginTop: 8 },
  topUpButton: { marginTop: 16, backgroundColor: '#fff', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 },
  topUpText: { color: '#7380ec', fontWeight: '600', fontSize: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '600', margin: 16, color: '#333' },
  transaction: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8, padding: 16, borderRadius: 12 },
  transactionLeft: { flexDirection: 'row', alignItems: 'center' },
  transactionInfo: { marginLeft: 12 },
  transactionDesc: { fontSize: 14, fontWeight: '500', color: '#333' },
  transactionDate: { fontSize: 12, color: '#999', marginTop: 2 },
  transactionAmount: { fontSize: 14, fontWeight: 'bold' },
  empty: { alignItems: 'center', marginTop: 40 },
  emptyText: { fontSize: 14, color: '#999' },
  modal: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', padding: 24, borderRadius: 16, width: '80%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 16 },
  modalButtons: { flexDirection: 'row', gap: 12 },
  cancelButton: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  cancelText: { color: '#666' },
  confirmButton: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#7380ec', alignItems: 'center' },
  confirmText: { color: '#fff', fontWeight: '600' },
});
