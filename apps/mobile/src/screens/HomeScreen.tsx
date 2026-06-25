import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, RefreshControl, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

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

export default function HomeScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['all', 'cylinder', 'accessory']);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data.data || []);
    } catch (error) {
      console.error('Fetch products error:', error);
    }
  };

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.type === selectedCategory);

  const addToCart = (product: Product) => {
    setCartCount(prev => prev + 1);
    // TODO: Implement proper cart with AsyncStorage
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
    >
      <View style={styles.imageContainer}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Icon name="gas-cylinder" size={40} color="#7380ec" />
          </View>
        )}
        {!item.isAvailable && (
          <View style={styles.unavailableOverlay}>
            <Text style={styles.unavailableText}>Out of Stock</Text>
          </View>
        )}
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productDesc} numberOfLines={2}>{item.description}</Text>
        <View style={styles.productFooter}>
          <Text style={styles.productPrice}>UGX {Number(item.price).toLocaleString()}</Text>
          <TouchableOpacity
            style={[styles.addButton, !item.isAvailable && styles.addButtonDisabled]}
            onPress={() => addToCart(item)}
            disabled={!item.isAvailable}
          >
            <Icon name="plus" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0] || 'Guest'}</Text>
          <Text style={styles.subtitle}>Order gas delivered to your door</Text>
        </View>
        <TouchableOpacity style={styles.cartButton} onPress={() => navigation.navigate('Cart')}>
          <Icon name="cart" size={24} color="#333" />
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}>
              {cat === 'all' ? 'All' : cat === 'cylinder' ? 'Gas Cylinders' : 'Accessories'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={styles.productRow}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchProducts} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="package-variant" size={64} color="#ddd" />
            <Text style={styles.emptyText}>No products available</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 20 },
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 4 },
  cartButton: { padding: 8, position: 'relative' },
  cartBadge: { position: 'absolute', top: 4, right: 4, backgroundColor: '#ff7782', borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center' },
  cartBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  categories: { paddingHorizontal: 12, marginBottom: 8 },
  categoryChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', marginHorizontal: 4, borderWidth: 1, borderColor: '#ddd' },
  categoryChipActive: { backgroundColor: '#7380ec', borderColor: '#7380ec' },
  categoryText: { fontSize: 14, color: '#666', textTransform: 'capitalize' },
  categoryTextActive: { color: '#fff', fontWeight: '600' },
  productRow: { justifyContent: 'space-between', paddingHorizontal: 12 },
  productCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, margin: 6, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  imageContainer: { height: 120, backgroundColor: '#f8f8f8', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  productImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  placeholderImage: { justifyContent: 'center', alignItems: 'center' },
  unavailableOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  unavailableText: { color: '#fff', fontWeight: 'bold' },
  productInfo: { padding: 12 },
  productName: { fontSize: 14, fontWeight: '600', color: '#333' },
  productDesc: { fontSize: 12, color: '#999', marginTop: 4 },
  productFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  productPrice: { fontSize: 16, fontWeight: 'bold', color: '#7380ec' },
  addButton: { backgroundColor: '#7380ec', width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  addButtonDisabled: { backgroundColor: '#ccc' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, color: '#999', marginTop: 12 },
});
