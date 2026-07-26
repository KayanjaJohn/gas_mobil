import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error(
    '[API] EXPO_PUBLIC_API_URL is not set. Please check your .env file.'
  );
}

console.log('[API] Initializing with URL:', API_URL);

// Queue for refresh token requests
interface PendingRequest {
  resolve: (token: string) => void;
  reject: (error: any) => void;
}

let isRefreshing = false;
const refreshSubscribers: PendingRequest[] = [];

const subscribeTokenRefresh = (resolveCb: (token: string) => void, rejectCb: (err: any) => void) => {
  refreshSubscribers.push({ resolve: resolveCb, reject: rejectCb });
};

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((sub) => sub.resolve(token));
  refreshSubscribers.length = 0;
};

const onRefreshFailed = (error: any) => {
  refreshSubscribers.forEach((sub) => sub.reject(error));
  refreshSubscribers.length = 0;
};

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Add token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('access_token');
    if (token) {
      if (!config.headers) config.headers = {} as any;
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Handle 401 and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If there's no original request (some other error), bail out
    if (!originalRequest) return Promise.reject(error);

    // Avoid trying to refresh if the failing request was the refresh endpoint itself
    if (originalRequest.url && originalRequest.url.includes('/auth/refresh')) {
      // Clear auth data and let caller handle redirect
      await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (!isRefreshing) {
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

          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          await AsyncStorage.setItem('access_token', accessToken);
          if (newRefreshToken) {
            await AsyncStorage.setItem('refresh_token', newRefreshToken);
          }

          api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
          onRefreshed(accessToken);
          console.log('[API] Token refreshed successfully');
        } catch (refreshError) {
          console.error('[API] Token refresh failed:', refreshError);
          onRefreshFailed(refreshError);
          // Clear auth data and reject so callers can redirect to login
          await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      // Wait for token refresh to complete, then retry
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((token: string) => {
          if (!originalRequest.headers) originalRequest.headers = {};
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(api(originalRequest));
        }, (err) => {
          reject(err);
        });
      });
    }

    return Promise.reject(error);
  }
);

// Type-safe API request function
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

      console.error(
        `[API] Error on attempt ${attempt}/${retries}: ${status} - ${message}`
      );

      // Don't retry on client errors (4xx) except 401 and 429
      if (status && status >= 400 && status < 500 && status !== 401 && status !== 429) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
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
