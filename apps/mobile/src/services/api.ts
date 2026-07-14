import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// ── Environment ──────────────────────────────────────────────
const API_URL = Constants.expoConfig?.extra?.apiUrl
  || process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  console.error(
    '\n[api.ts] ❌ EXPO_PUBLIC_API_URL is not set.\n' +
    'Add it to your .env file:\n' +
    '  EXPO_PUBLIC_API_URL=process.env.EXPO_PUBLIC_API_URL\n' +
    'Then restart with: npx expo start --clear\n'
  );
}

const api = axios.create({
  baseURL: API_URL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach token ────────────────────────
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      console.log('[API] Request:', config.method?.toUpperCase(), config.url);
    } catch {
      // Silent fail — request proceeds without token
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle 401 + refresh ─────────────
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

api.interceptors.response.use(
  (response) => {
    console.log('[API] Response:', response.config.method?.toUpperCase(), response.config.url, '| status:', response.status);
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (!originalRequest) {
      console.error('[API] Request error (no config):', error.message);
      return Promise.reject(error);
    }

    console.log('[API] Response error:', originalRequest.method?.toUpperCase(), originalRequest.url, '| status:', error.response?.status, '| message:', error.message);

    // 401 Unauthorized → try refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        console.log('[API] Already refreshing, queuing request');
        return new Promise((resolve) => {
          addRefreshSubscriber((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refresh_token');
        if (!refreshToken) throw new Error('No refresh token');

        console.log('[API] Attempting token refresh...');
        const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = res.data.data;
        console.log('[API] Token refresh success');

        await AsyncStorage.setItem('access_token', accessToken);
        if (newRefreshToken) await AsyncStorage.setItem('refresh_token', newRefreshToken);

        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        onRefreshed(accessToken);
        isRefreshing = false;

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error('[API] Token refresh failed, clearing session');
        isRefreshing = false;
        await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ── Retry wrapper for network errors ─────────────────────────
export async function apiRequest<T>(
  method: 'get' | 'post' | 'put' | 'delete',
  url: string,
  data?: unknown,
  retries = 2
): Promise<T> {
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await api.request({ method, url, data });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      const shouldRetry =
        i < retries &&
        (!axiosError.response || axiosError.response.status >= 500);
      if (!shouldRetry) throw error;
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw new Error('Unexpected error');
}

export default api;