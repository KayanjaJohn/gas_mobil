import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error('[API] EXPO_PUBLIC_API_URL is not set. Please check your .env file.');
}

console.log('[API] Initializing with URL:', API_URL);

let isRefreshing = false;
const refreshSubscribers: Array<(token: string) => void> = [];
const refreshRejecters: Array<(error: any) => void> = [];

const subscribeTokenRefresh = (onSuccess: (token: string) => void, onError: (error: any) => void) => {
  refreshSubscribers.push(onSuccess);
  refreshRejecters.push(onError);
};

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((sub) => sub(token));
  refreshSubscribers.length = 0;
  refreshRejecters.length = 0;
};

const onRefreshFailed = (error: any) => {
  refreshRejecters.forEach((sub) => sub(error));
  refreshSubscribers.length = 0;
  refreshRejecters.length = 0;
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
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;

    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // Wait for refresh to complete, then retry
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh(
            (token: string) => {
              originalRequest.headers!.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            },
            (err: any) => {
              reject(err);
            }
          );
        });
      }

      isRefreshing = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refresh_token');

        if (!refreshToken) {
          throw new Error('No refresh token available');
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

        onRefreshed(accessToken);
        originalRequest.headers!.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error('[API] Token refresh failed:', refreshError);
        onRefreshFailed(refreshError);
        await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export const apiRequest = async <T>(
  method: 'get' | 'post' | 'put' | 'delete' | 'patch',
  url: string,
  data?: any,
  retries = 3
): Promise<ApiResponse<T>> => {
  let lastError: AxiosError | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await api.request<ApiResponse<T>>({
        method,
        url,
        data,
      });
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