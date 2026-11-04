import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const API_URL = import.meta.env.VITE_API_URL || "/api";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  station?: { id?: string; name?: string; address?: string; city?: string } | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (emailOrPhone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshCurrentUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
  login: async () => ({ success: false, error: "AuthProvider not mounted" }),
  logout: () => {},
  refreshCurrentUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearSession = () => {
    localStorage.removeItem("agent_token");
    localStorage.removeItem("agent_refresh_token");
    localStorage.removeItem("agent_user");
    delete api.defaults.headers.common.Authorization;
    setToken(null);
    setUser(null);
    setError(null);
  };

  const refreshCurrentUser = async () => {
    if (!localStorage.getItem("agent_token")) return;
    const response = await api.get(`${API_URL}/auth/me`);
    const freshUser = response.data?.data;
    if (!freshUser || freshUser.role !== "agent") {
      throw new Error("Agent account is no longer available.");
    }
    setUser(freshUser);
    localStorage.setItem("agent_user", JSON.stringify(freshUser));
  };

  useEffect(() => {
    const onExpired = () => clearSession();
    const onTokenRefreshed = (event: Event) => {
      const nextToken = (event as CustomEvent<{ token?: string }>).detail?.token;
      if (nextToken) setToken(nextToken);
    };
    window.addEventListener("gasmobil:session-expired", onExpired);
    window.addEventListener("gasmobil:token-refreshed", onTokenRefreshed as EventListener);

    let mounted = true;
    const verify = async () => {
      const savedToken = localStorage.getItem("agent_token");
      if (!savedToken) {
        if (mounted) setIsLoading(false);
        return;
      }

      setToken(savedToken);
      api.defaults.headers.common.Authorization = `Bearer ${savedToken}`;

      try {
        const response = await api.get(`${API_URL}/auth/me`);
        const userData = response.data?.data;
        if (!userData || userData.role !== "agent") {
          throw new Error("This portal is for station agents only.");
        }
        if (mounted) {
          setUser(userData);
          localStorage.setItem("agent_user", JSON.stringify(userData));
        }
      } catch (verifyError: any) {
        if (mounted && !localStorage.getItem("agent_token")) {
          setUser(null);
          setToken(null);
        } else if (mounted) {
          // Temporary network/server failures should not erase a valid session.
          const cached = localStorage.getItem("agent_user");
          if (cached) {
            try { setUser(JSON.parse(cached)); } catch { clearSession(); }
          }
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    void verify();
    return () => {
      mounted = false;
      window.removeEventListener("gasmobil:session-expired", onExpired);
      window.removeEventListener("gasmobil:token-refreshed", onTokenRefreshed as EventListener);
    };
  }, []);

  // Refresh /auth/me while the portal is active so station changes made by an
  // admin appear without requiring the agent to reload the browser.
  useEffect(() => {
    if (!token || !user) return;

    let active = true;
    const refreshSafely = async () => {
      try {
        if (active) await refreshCurrentUser();
      } catch (refreshError: any) {
        if (active) console.warn("[Agent Auth] Profile refresh failed:", refreshError?.message || refreshError);
      }
    };
    const onFocus = () => { void refreshSafely(); };
    const onVisibility = () => {
      if (document.visibilityState === "visible") void refreshSafely();
    };

    const interval = window.setInterval(() => { void refreshSafely(); }, 60000);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [token, user?.id]);

  const login = async (emailOrPhone: string, password: string) => {
    try {
      const response = await api.post(`${API_URL}/auth/login`, { emailOrPhone, password });
      const data = response.data;
      if (!data.success) return { success: false, error: data.error || "Login failed" };

      const payload = data.data || data;
      const accessToken = payload.accessToken || payload.token;
      const userData = payload.user;
      if (!accessToken || !userData) {
        return { success: false, error: "Login response was incomplete. Please contact support." };
      }
      if (userData.role !== "agent") {
        return { success: false, error: "This portal is for station agents only" };
      }

      localStorage.setItem("agent_token", accessToken);
      if (payload.refreshToken) localStorage.setItem("agent_refresh_token", payload.refreshToken);
      localStorage.setItem("agent_user", JSON.stringify(userData));
      api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
      setToken(accessToken);
      setUser(userData);
      setError(null);
      return { success: true };
    } catch (loginError: any) {
      const message = loginError.response?.data?.error || loginError.message || "Login failed";
      return { success: false, error: message };
    }
  };

  const logout = () => clearSession();

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoading,
      isAuthenticated: !!user,
      error,
      login,
      logout,
      refreshCurrentUser,
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
