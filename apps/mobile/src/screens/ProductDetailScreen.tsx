import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../services/api';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  type: string;
  imageUrl?: string;
  isAvailable: boolean;
}

export default function ProductDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { productId } = route.params;
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProduct();
  }, []);

  const fetchProduct = async () => {
    try {
      const res = await api.get(`/products/${productId}`);
      setProduct(res.data.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = () => {
    if (!product) return;
    // TODO: Add to cart storage
    Alert.alert('Added to Cart', `${quantity}x ${product.name} added to your cart`);
  };

  if (loading || !product) {
    return <View style={styles.center}><Text>Loading...</Text></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.imageContainer}>
        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.placeholder}>
            <Icon name="gas-cylinder" size={80} color="#7380ec" />
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.type}>{product.type.toUpperCase()}</Text>
        <Text style={styles.price}>UGX {Number(product.price).toLocaleString()}</Text>
        <Text style={styles.description}>{product.description}</Text>

        <View style={styles.stockInfo}>
          <Icon name={product.stock > 0 ? "check-circle" : "close-circle"} size={20} color={product.stock > 0 ? '#41f1b6' : '#ff7782'} />
          <Text style={styles.stockText}>{product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</Text>
        </View>

        <View style={styles.quantityContainer}>
          <Text style={styles.quantityLabel}>Quantity:</Text>
          <View style={styles.quantityControls}>
            <TouchableOpacity onPress={() => setQuantity(Math.max(1, quantity - 1))} style={styles.qtyButton}>
              <Icon name="minus" size={20} color="#333" />
            </TouchableOpacity>
            <Text style={styles.quantity}>{quantity}</Text>
            <TouchableOpacity onPress={() => setQuantity(Math.min(product.stock, quantity + 1))} style={styles.qtyButton}>
              <Icon name="plus" size={20} color="#333" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.addButton, (!product.isAvailable || product.stock === 0) && styles.addButtonDisabled]}
          onPress={addToCart}
          disabled={!product.isAvailable || product.stock === 0}
        >
          <Text style={styles.addButtonText}>
            {product.isAvailable ? 'Add to Cart' : 'Unavailable'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  imageContainer: { height: 250, backgroundColor: '#f8f8f8', justifyContent: 'center', alignItems: 'center' },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  placeholder: { justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20 },
  name: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  type: { fontSize: 12, color: '#7380ec', marginTop: 4, fontWeight: '600' },
  price: { fontSize: 28, fontWeight: 'bold', color: '#7380ec', marginTop: 12 },
  description: { fontSize: 14, color: '#666', marginTop: 12, lineHeight: 20 },
  stockInfo: { flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 8 },
  stockText: { fontSize: 14, color: '#666' },
  quantityContainer: { marginTop: 20 },
  quantityLabel: { fontSize: 16, fontWeight: '600', color: '#333' },
  quantityControls: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 16 },
  qtyButton: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
  quantity: { fontSize: 18, fontWeight: 'bold', minWidth: 30, textAlign: 'center' },
  addButton: { backgroundColor: '#7380ec', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  addButtonDisabled: { backgroundColor: '#ccc' },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
