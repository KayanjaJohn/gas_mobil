import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  station?: any;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (emailOrPhone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => ({ success: false, error: "AuthProvider not mounted" }),
  logout: () => {},
});

const api = axios.create({ baseURL: API_BASE_URL });

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

const subscribeTokenRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((sub) => sub(token));
  refreshSubscribers = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("agent_refresh_token");
      if (!refreshToken) {
        localStorage.removeItem("agent_token");
        localStorage.removeItem("agent_refresh_token");
        localStorage.removeItem("agent_user");
        delete api.defaults.headers.common["Authorization"];
        return Promise.reject(error);
      }

      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
          const { accessToken, refreshToken: newRefreshToken } = res.data.data || res.data;
          localStorage.setItem("agent_token", accessToken);
          if (newRefreshToken) localStorage.setItem("agent_refresh_token", newRefreshToken);
          api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
          onRefreshed(accessToken);
          isRefreshing = false;
          originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshErr) {
          isRefreshing = false;
          localStorage.removeItem("agent_token");
          localStorage.removeItem("agent_refresh_token");
          localStorage.removeItem("agent_user");
          delete api.defaults.headers.common["Authorization"];
          return Promise.reject(refreshErr);
        }
      }

      return new Promise((resolve) => {
        subscribeTokenRefresh((newToken: string) => {
          originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
          resolve(api(originalRequest));
        });
      });
    }
    return Promise.reject(error);
  }
);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const verify = async () => {
      const savedToken = localStorage.getItem("agent_token");
      if (!savedToken) {
        if (mounted) setIsLoading(false);
        return;
      }
      try {
        api.defaults.headers.common["Authorization"] = `Bearer ${savedToken}`;
        const res = await api.get("/auth/me");
        const userData = res.data?.data;
        if (!userData) throw new Error("Invalid response");
        if (userData.role !== "agent") throw new Error("This portal is for station agents only");
        if (mounted) {
          setToken(savedToken);
          setUser(userData);
        }
      } catch (err: any) {
        localStorage.removeItem("agent_token");
        localStorage.removeItem("agent_refresh_token");
        localStorage.removeItem("agent_user");
        delete api.defaults.headers.common["Authorization"];
        if (mounted) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    verify();
    return () => { mounted = false; };
  }, []);

  const login = async (emailOrPhone: string, password: string) => {
    try {
      const res = await api.post("/auth/login", { emailOrPhone, password });
      const data = res.data;
      if (!data.success) return { success: false, error: data.error || "Login failed" };
      const { accessToken, refreshToken, user: userData } = data.data;
      if (userData.role !== "agent") return { success: false, error: "This portal is for station agents only" };
      localStorage.setItem("agent_token", accessToken);
      if (refreshToken) localStorage.setItem("agent_refresh_token", refreshToken);
      if (userData) localStorage.setItem("agent_user", JSON.stringify(userData));
      api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
      setToken(accessToken);
      setUser(userData);
      return { success: true };
    } catch (error: any) {
      const msg = error.response?.data?.error || error.message || "Login failed";
      return { success: false, error: msg };
    }
  };

  const logout = () => {
    localStorage.removeItem("agent_token");
    localStorage.removeItem("agent_refresh_token");
    localStorage.removeItem("agent_user");
    delete api.defaults.headers.common["Authorization"];
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoading,
      isAuthenticated: !!user,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export { api };