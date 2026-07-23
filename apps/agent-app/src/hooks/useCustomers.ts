import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  currentLatitude?: number;
  currentLongitude?: number;
  lastLocationUpdate?: string;

}

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('agent_token');
      const res = await axios.get(`${API_URL}/agent/customers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCustomers(res.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch Customers');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCustomerStatus = useCallback(async (customerId: string, status: string) => {
    try {
      const token = localStorage.getItem('agent_token');
      await axios.put(`${API_URL}/agent/customers/${customerId}/status`, {
        status
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchCustomers();
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Status update failed');
    }
  }, [fetchCustomers]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return { customers, loading, error, fetchCustomers, updateCustomerStatus };
}
