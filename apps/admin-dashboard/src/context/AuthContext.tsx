import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

type RetriableRequest = InternalAxiosRequestConfig & { _gasmobilAdminRetry?: boolean };

const AuthContext = createContext<AuthContextType | null>(null);
const API_URL = import.meta.env.VITE_API_URL || "/api";
let refreshInFlight: Promise<string> | null = null;

function clearAdminSession() {
  localStorage.removeItem("admin_token");
  localStorage.removeItem("admin_refresh_token");
  localStorage.removeItem("admin_user");
  delete axios.defaults.headers.common.Authorization;
  window.dispatchEvent(new Event("gasmobil:session-expired"));
}

async function refreshAdminAccessToken(): Promise<string> {
  const refreshToken = localStorage.getItem("admin_refresh_token");
  if (!refreshToken) throw new Error("Your session has expired. Please sign in again.");

  if (!refreshInFlight) {
    refreshInFlight = axios.post(
      `${API_URL}/auth/refresh`,
      { refreshToken },
      { timeout: 20000 }
    ).then((response) => {
      const payload = response.data?.data || response.data;
      const accessToken = payload?.accessToken || payload?.token;
      const nextRefreshToken = payload?.refreshToken;
      if (!accessToken) throw new Error("The session refresh response was incomplete.");

      localStorage.setItem("admin_token", accessToken);
      if (nextRefreshToken) localStorage.setItem("admin_refresh_token", nextRefreshToken);
      axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
      window.dispatchEvent(new CustomEvent("gasmobil:token-refreshed", {
        detail: { token: accessToken },
      }));
      return accessToken as string;
    }).finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

// All existing admin pages use Axios directly. Register one shared interceptor
// so every request receives the latest access token and retries once after refresh.
axios.defaults.timeout = 45000;
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axios.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<any>) => {
    const request = error.config as RetriableRequest | undefined;
    const url = request?.url || "";
    if (
      error.response?.status !== 401 ||
      !request ||
      request._gasmobilAdminRetry ||
      /\/auth\/(login|refresh)/i.test(url)
    ) {
      return Promise.reject(error);
    }

    request._gasmobilAdminRetry = true;
    try {
      const newToken = await refreshAdminAccessToken();
      request.headers = request.headers || ({} as any);
      request.headers.Authorization = `Bearer ${newToken}`;
      return axios.request(request);
    } catch (refreshError) {
      clearAdminSession();
      return Promise.reject(refreshError);
    }
  }
);

function friendlyAuthError(error: any): string {
  if (error?.code === "ECONNABORTED") {
    return "GasMobil could not be reached in time. Check your internet connection and try again.";
  }
  const status = error?.response?.status;
  if (status === 401) return "Your sign-in details are incorrect or your session has expired.";
  if (status === 403) return "This account is not authorised to access the admin portal.";
  if (status >= 500) return "GasMobil is temporarily unavailable. Please try again shortly.";
  return error?.response?.data?.error || error?.message || "We couldn't complete that request. Please try again.";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem("admin_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      localStorage.removeItem("admin_user");
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(localStorage.getItem("admin_token"));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onTokenRefreshed = (event: Event) => {
      const nextToken = (event as CustomEvent<{ token?: string }>).detail?.token;
      if (nextToken) setToken(nextToken);
    };
    const onExpired = () => {
      setToken(null);
      setUser(null);
      setError("Your session has expired. Please sign in again.");
      setIsLoading(false);
    };

    window.addEventListener("gasmobil:token-refreshed", onTokenRefreshed as EventListener);
    window.addEventListener("gasmobil:session-expired", onExpired);

    return () => {
      window.removeEventListener("gasmobil:token-refreshed", onTokenRefreshed as EventListener);
      window.removeEventListener("gasmobil:session-expired", onExpired);
    };
  }, []);

  useEffect(() => {
    let active = true;
    const verifyToken = async () => {
      if (!token) {
        if (active) setIsLoading(false);
        return;
      }
      try {
        const res = await axios.get(`${API_URL}/auth/verify`, { timeout: 12000 });
        const userData = res.data.data?.user || res.data.user || res.data.data;
        if (!userData || userData.role !== "admin") {
          throw new Error("This portal is for authorised administrators only.");
        }
        if (active) {
          setUser(userData);
          setError(null);
          localStorage.setItem("admin_user", JSON.stringify(userData));
        }
      } catch (err: any) {
        // Preserve the stored session during a network outage. A 401 response
        // is handled by the refresh interceptor above.
        if (active && !localStorage.getItem("admin_token")) {
          setToken(null);
          setUser(null);
        } else if (active) {
          const cached = localStorage.getItem("admin_user");
          if (cached) {
            try { setUser(JSON.parse(cached)); } catch { setUser(null); }
          }
          if (err?.code === "ECONNABORTED" || !err?.response) {
            setError("Connection is slow. Your session is being kept; check your internet and retry.");
          }
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void verifyToken();
    return () => { active = false; };
  }, [token]);

  // A light heartbeat refreshes profile/session state while the administrator
  // is actively using the portal; the Axios interceptor renews access tokens.
  useEffect(() => {
    if (!token || !user) return;
    let active = true;
    const refreshProfile = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const response = await axios.get(`${API_URL}/auth/me`, { timeout: 12000 });
        const freshUser = response.data?.data;
        if (active && freshUser?.role === "admin") {
          setUser(freshUser);
          localStorage.setItem("admin_user", JSON.stringify(freshUser));
        }
      } catch (err: any) {
        if (active && err?.code === "ECONNABORTED") {
          console.warn("[Admin Auth] Profile heartbeat timed out; keeping the session.");
        }
      }
    };
    const interval = window.setInterval(() => { void refreshProfile(); }, 5 * 60 * 1000);
    const onFocus = () => { void refreshProfile(); };
    const onVisible = () => { if (document.visibilityState === "visible") void refreshProfile(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [token, user?.id]);

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      const res = await axios.post(
        `${API_URL}/auth/login`,
        { emailOrPhone: email, password },
        { timeout: 20000 }
      );
      const responseData = res.data.data || res.data;
      const newToken = responseData.token || responseData.accessToken;
      const newRefreshToken = responseData.refreshToken;
      const newUser = responseData.user || responseData.data?.user || responseData;

      if (newUser?.role !== "admin") {
        throw new Error("This portal is for authorised administrators only.");
      }
      if (!newToken || !newRefreshToken) {
        throw new Error("The sign-in response was incomplete. Please retry or contact support.");
      }

      localStorage.setItem("admin_token", newToken);
      localStorage.setItem("admin_refresh_token", newRefreshToken);
      localStorage.setItem("admin_user", JSON.stringify(newUser));
      axios.defaults.headers.common.Authorization = `Bearer ${newToken}`;
      setToken(newToken);
      setUser(newUser);
      setError(null);
    } catch (err: any) {
      const message = friendlyAuthError(err);
      setError(message);
      throw new Error(message);
    }
  };

  const logout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_refresh_token");
    localStorage.removeItem("admin_user");
    delete axios.defaults.headers.common.Authorization;
    setToken(null);
    setUser(null);
    setError(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
