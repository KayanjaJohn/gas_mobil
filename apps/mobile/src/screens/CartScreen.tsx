import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

export default function CartScreen() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const navigation = useNavigation<any>();

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const updateQuantity = (id: string, delta: number) => {
    setCartItems(prev => prev.map(item =>
      item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
    ));
  };

  const removeItem = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const renderItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItem}>
      <View style={styles.itemImage}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.image} />
        ) : (
          <Icon name="gas-cylinder" size={30} color="#7380ec" />
        )}
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPrice}>UGX {Number(item.price).toLocaleString()}</Text>
      </View>
      <View style={styles.itemControls}>
        <View style={styles.quantityControls}>
          <TouchableOpacity onPress={() => updateQuantity(item.id, -1)} style={styles.qtyButton}>
            <Icon name="minus" size={16} color="#333" />
          </TouchableOpacity>
          <Text style={styles.quantity}>{item.quantity}</Text>
          <TouchableOpacity onPress={() => updateQuantity(item.id, 1)} style={styles.qtyButton}>
            <Icon name="plus" size={16} color="#333" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => removeItem(item.id)}>
          <Icon name="delete" size={20} color="#ff7782" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Shopping Cart</Text>

      <FlatList
        data={cartItems}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="cart-off" size={64} color="#ddd" />
            <Text style={styles.emptyText}>Your cart is empty</Text>
            <TouchableOpacity style={styles.browseButton} onPress={() => navigation.navigate('Home')}>
              <Text style={styles.browseText}>Browse Products</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {cartItems.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalAmount}>UGX {total.toLocaleString()}</Text>
          </View>
          <TouchableOpacity style={styles.checkoutButton} onPress={() => navigation.navigate('Checkout')}>
            <Text style={styles.checkoutText}>Proceed to Checkout</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: 'bold', padding: 16, color: '#333' },
  cartItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 12, marginBottom: 8, padding: 12, borderRadius: 12 },
  itemImage: { width: 60, height: 60, backgroundColor: '#f8f8f8', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  image: { width: 60, height: 60, borderRadius: 8 },
  itemInfo: { flex: 1, marginLeft: 12 },
  itemName: { fontSize: 14, fontWeight: '600', color: '#333' },
  itemPrice: { fontSize: 14, color: '#7380ec', marginTop: 4 },
  itemControls: { alignItems: 'center' },
  quantityControls: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  qtyButton: { width: 28, height: 28, backgroundColor: '#f0f0f0', borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  quantity: { fontSize: 14, fontWeight: 'bold', marginHorizontal: 12, minWidth: 20, textAlign: 'center' },
  empty: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 16, color: '#999', marginTop: 12 },
  browseButton: { marginTop: 20, backgroundColor: '#7380ec', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  browseText: { color: '#fff', fontWeight: '600' },
  footer: { backgroundColor: '#fff', padding: 16, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  totalLabel: { fontSize: 18, color: '#666' },
  totalAmount: { fontSize: 20, fontWeight: 'bold', color: '#7380ec' },
  checkoutButton: { backgroundColor: '#7380ec', padding: 16, borderRadius: 12, alignItems: 'center' },
  checkoutText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
