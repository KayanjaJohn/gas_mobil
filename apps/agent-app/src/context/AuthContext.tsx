import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const api = axios.create({ baseURL: API_BASE_URL });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const verify = async () => {
      const savedToken = localStorage.getItem('agent_token');
      if (!savedToken) {
        if (mounted) setIsLoading(false);
        return;
      }

      try {
        api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
        const res = await api.get('/auth/me');

        // Backend returns { success: true, data: { ...user } }
        const userData = res.data?.data;

        if (!userData) {
          throw new Error('Invalid response');
        }

        if (mounted) {
          setToken(savedToken);
          setUser(userData);
        }
      } catch (err: any) {
        // ANY error = wipe everything, no stale fallback
        console.log('[Agent Auth] Token invalid, clearing:', err?.response?.data?.error || err.message);
        localStorage.removeItem('agent_token');
        localStorage.removeItem('agent_refresh_token');
        localStorage.removeItem('agent_user');
        delete api.defaults.headers.common['Authorization'];
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
      const res = await api.post('/auth/login', { emailOrPhone, password });
      const data = res.data;

      if (!data.success) {
        return { success: false, error: data.error || 'Login failed' };
      }

      const { accessToken, refreshToken, user: userData } = data.data;

      localStorage.setItem('agent_token', accessToken);
      if (refreshToken) localStorage.setItem('agent_refresh_token', refreshToken);
      if (userData) localStorage.setItem('agent_user', JSON.stringify(userData));

      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      setToken(accessToken);
      setUser(userData);

      return { success: true };
    } catch (error: any) {
      const msg = error.response?.data?.error || error.message || 'Login failed';
      return { success: false, error: msg };
    }
  };

  const logout = () => {
    localStorage.removeItem('agent_token');
    localStorage.removeItem('agent_refresh_token');
    localStorage.removeItem('agent_user');
    delete api.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoading,
      isAuthenticated: !!user && !!token,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export { api };