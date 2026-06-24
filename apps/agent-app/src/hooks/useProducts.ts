import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  type: string;
  isAvailable: boolean;
  imageUrl?: string;
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('agent_token');
      const res = await axios.get(`${API_URL}/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(res.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, []);

  const createProduct = useCallback(async (productData: Omit<Product, 'id'>) => {
    try {
      const token = localStorage.getItem('agent_token');
      await axios.post(`${API_URL}/products`, productData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchProducts();
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Failed to create product');
    }
  }, [fetchProducts]);

  const updateProduct = useCallback(async (id: string, updates: Partial<Product>) => {
    try {
      const token = localStorage.getItem('agent_token');
      await axios.put(`${API_URL}/products/${id}`, updates, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchProducts();
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Failed to update product');
    }
  }, [fetchProducts]);

  const toggleAvailability = useCallback(async (id: string, isAvailable: boolean) => {
    try {
      const token = localStorage.getItem('agent_token');
      await axios.patch(`${API_URL}/products/${id}/availability`, {
        isAvailable
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchProducts();
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Failed to toggle availability');
    }
  }, [fetchProducts]);

  const deleteProduct = useCallback(async (id: string) => {
    try {
      const token = localStorage.getItem('agent_token');
      await axios.delete(`${API_URL}/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchProducts();
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Failed to delete product');
    }
  }, [fetchProducts]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    fetchProducts,
    createProduct,
    updateProduct,
    toggleAvailability,
    deleteProduct,
  };
}
