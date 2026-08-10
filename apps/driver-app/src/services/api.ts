import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  console.warn("[API] EXPO_PUBLIC_API_URL not set. Falling back to localhost.");
}

const api = axios.create({
  baseURL: API_URL || "http://localhost:5000/api",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("driver_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * HIGH FIX: Only clear auth on 401 from auth endpoints or when refresh fails.
 * Attempts token refresh before logging out.
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || "";

    if (status === 401) {
      if (requestUrl.includes("/auth/login")) {
        return Promise.reject(error);
      }

      try {
        const refreshToken = await AsyncStorage.getItem("driver_refresh_token");
        if (refreshToken && !requestUrl.includes("/auth/refresh")) {
          const refreshRes = await axios.post(`${API_URL || "http://localhost:5000/api"}/auth/refresh`, {
            refreshToken,
          });
          if (refreshRes.data?.success && refreshRes.data?.data?.accessToken) {
            const newToken = refreshRes.data.data.accessToken;
            await AsyncStorage.setItem("driver_token", newToken);
            error.config.headers.Authorization = "Bearer " + newToken;
            return api.request(error.config);
          }
        }
      } catch (refreshErr) {
        console.error("[Driver API] Token refresh failed:", refreshErr);
      }

      await AsyncStorage.multiRemove(["driver_token", "driver_refresh_token", "driver_user"]);
    }

    const apiError = error.response?.data?.error;
    if (apiError) {
      error.message = apiError;
    }

    return Promise.reject(error);
  }
);

export default api;