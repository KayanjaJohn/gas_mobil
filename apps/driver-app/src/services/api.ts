import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// IMPORTANT: Set EXPO_PUBLIC_API_URL in your .env file
// Example: EXPO_PUBLIC_API_URL=http://192.168.1.100:5000/api
const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  console.warn('[API] EXPO_PUBLIC_API_URL not set. Falling back to localhost.');
}

const api = axios.create({
  baseURL: API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('driver_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const apiError = error.response?.data?.error;

    if (status === 401) {
      await AsyncStorage.removeItem('driver_token');
      await AsyncStorage.removeItem('driver_user');
    }

    if (apiError) {
      error.message = apiError;
    }

    return Promise.reject(error);
  }
);

export default api;