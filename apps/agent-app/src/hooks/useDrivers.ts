import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  driverStatus: 'online' | 'offline' | 'busy' | 'on_break';
  currentLatitude?: number;
  currentLongitude?: number;
  lastLocationUpdate?: string;
  vehicleNumber?: string;
  vehicleType?: string;
  totalDeliveries?: number;
  rating?: number;
}

export function useDrivers() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('agent_token');
      const res = await axios.get(`${API_URL}/agent/drivers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDrivers(res.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch drivers');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateDriverStatus = useCallback(async (driverId: string, status: string) => {
    try {
      const token = localStorage.getItem('agent_token');
      await axios.put(`${API_URL}/agent/drivers/${driverId}/status`, {
        status
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchDrivers();
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Status update failed');
    }
  }, [fetchDrivers]);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  return { drivers, loading, error, fetchDrivers, updateDriverStatus };
}
