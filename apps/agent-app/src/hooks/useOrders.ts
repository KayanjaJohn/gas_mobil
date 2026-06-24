import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  deliveryAddress: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  user?: { name: string; phone: string };
  driver?: { name: string };
  items?: any[];
}

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('agent_token');
      const res = await axios.get(`${API_URL}/admin/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(res.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, []);

  const assignDriver = useCallback(async (orderId: string, driverId: string) => {
    try {
      const token = localStorage.getItem('agent_token');
      await axios.post(`${API_URL}/admin/orders/${orderId}/assign`, {
        driverId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchOrders();
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Assignment failed');
    }
  }, [fetchOrders]);

  const cancelOrder = useCallback(async (orderId: string, reason: string) => {
    try {
      const token = localStorage.getItem('agent_token');
      await axios.post(`${API_URL}/admin/orders/${orderId}/cancel`, {
        reason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchOrders();
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Cancellation failed');
    }
  }, [fetchOrders]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, loading, error, fetchOrders, assignDriver, cancelOrder };
}
