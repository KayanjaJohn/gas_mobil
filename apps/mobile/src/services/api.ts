import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error('[API] EXPO_PUBLIC_API_URL is not set. Please check your .env file.');
}

console.log('[API] Initializing with URL:', API_URL);

let isRefreshing = false;
const refreshSubscribers: Array<(token: string) => void> = [];

const subscribeTokenRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((sub) => sub(token));
  refreshSubscribers.length = 0;
};

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;

        try {
          const refreshToken = await AsyncStorage.getItem('refresh_token');

          // SAFETY: If no refresh token, clear auth and reject
          if (!refreshToken) {
            console.log('[API] No refresh token available');
            await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
            isRefreshing = false;
            return Promise.reject(error);
          }

          console.log('[API] Refreshing token...');
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data.data || response.data;
          await AsyncStorage.setItem('access_token', accessToken);
          if (newRefreshToken) {
            await AsyncStorage.setItem('refresh_token', newRefreshToken);
          }

          api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
          onRefreshed(accessToken);
          console.log('[API] Token refreshed successfully');
        } catch (refreshError) {
          console.error('[API] Token refresh failed:', refreshError);
          await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
          isRefreshing = false;
          return Promise.reject(error);
        } finally {
          isRefreshing = false;
        }
      }

      // Wait for token refresh to complete, then retry
      return new Promise((resolve) => {
        subscribeTokenRefresh((token: string) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(api(originalRequest));
        });
      });
    }

    return Promise.reject(error);
  }
);

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export const apiRequest = async <T = any>(
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  url: string,
  data?: any,
  retries: number = 2
): Promise<ApiResponse<T>> => {
  let lastError: any;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[API] ${method.toUpperCase()} ${url} (attempt ${attempt}/${retries})`);
      const response = await api[method]<ApiResponse<T>>(url, data);
      console.log(`[API] Response:`, response.data);
      return response.data;
    } catch (error: any) {
      lastError = error;
      const status = error.response?.status;
      const message = error.response?.data?.error || error.message;

      console.error(`[API] Error on attempt ${attempt}/${retries}: ${status} - ${message}`);

      if (status && status >= 400 && status < 500 && status !== 401 && status !== 429) {
        throw error;
      }

      if (attempt < retries) {
        const delay = Math.pow(2, attempt - 1) * 1000;
        console.log(`[API] Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
};

export default api;