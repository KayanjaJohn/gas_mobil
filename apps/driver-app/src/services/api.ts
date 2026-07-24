import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// IMPORTANT: Change this to your computer's actual IP address
// Find it by running `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
// Example: 'http://192.168.1.100:5000/api'
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.43.124:5000/api';

console.log('[API] Initializing with URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
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
      console.log('[API] 401 Unauthorized - clearing token');
      await AsyncStorage.removeItem('driver_token');
      await AsyncStorage.removeItem('driver_user');
    }

    // Enhance error with API message
    if (apiError) {
      error.message = apiError;
    }

    return Promise.reject(error);
  }
);

export default api;
