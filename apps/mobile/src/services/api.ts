import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("EXPO_PUBLIC_API_URL not set");
}

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(
  async function addToken(config) {
    const token = await AsyncStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = "Bearer " + token;
    }
    return config;
  },
  function reqError(error) {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  function resSuccess(response) {
    return response;
  },
  async function resError(error) {
    if (error.response && error.response.status === 401) {
      await AsyncStorage.multiRemove(["access_token", "refresh_token", "user"]);
    }
    return Promise.reject(error);
  }
);

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export async function apiRequest<T>(
  method: "get" | "post" | "put" | "delete" | "patch",
  url: string,
  data?: any,
  retries?: number
): Promise<ApiResponse<T>> {
  const maxRetries = retries || 3;
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt = attempt + 1) {
    try {
      const response = await api.request<ApiResponse<T>>({
        method: method,
        url: url,
        data: data,
      });
      return response.data;
    } catch (err: any) {
      lastError = err;
      const status = err.response ? err.response.status : null;
      if (status && status >= 400 && status < 500 && status !== 401 && status !== 429) {
        throw err;
      }
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise(function wait(resolve) {
          setTimeout(resolve, delay);
        });
      }
    }
  }

  throw lastError;
}

export default api;