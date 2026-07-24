import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface Station {
  id: string;
  name: string;
  address: string;
  city: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  stationId?: string;
  station?: Station | null;
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

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verify token with API on mount (page refresh)
  useEffect(() => {
    const verifySession = async () => {
      const storedToken = localStorage.getItem('agent_token');

      console.log('[Auth] Hydrating session...');

      if (!storedToken) {
        console.log('[Auth] No stored token');
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${storedToken}` }
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            console.log('[Auth] Token valid | user:', data.data.email);
            setUser(data.data);
            setToken(storedToken);
            localStorage.setItem('agent_user', JSON.stringify(data.data));
          } else {
            throw new Error('Invalid response');
          }
        } else if (res.status === 401 || res.status === 404) {
          console.log('[Auth] Token invalid or expired');
          localStorage.removeItem('agent_token');
          localStorage.removeItem('agent_user');
          setUser(null);
          setToken(null);
        } else {
          console.log('[Auth] Server error, using cached user');
          const storedUser = localStorage.getItem('agent_user');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
            setToken(storedToken);
          }
        }
      } catch (err) {
        console.log('[Auth] Network error during verification:', err);
        const storedUser = localStorage.getItem('agent_user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
        }
      } finally {
        setIsLoading(false);
      }
    };

    verifySession();
  }, []);

  const login = async (emailOrPhone: string, password: string) => {
    try {
      console.log('[Auth] Login attempt:', emailOrPhone);
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrPhone, password }),
      });

      const data = await res.json();

      if (data.success && data.data?.token) {
        const { token: newToken, user: userData } = data.data;
        console.log('[Auth] Login success:', userData.email);

        localStorage.setItem('agent_token', newToken);
        localStorage.setItem('agent_user', JSON.stringify(userData));
        setToken(newToken);
        setUser(userData);
        return { success: true };
      }

      return { success: false, error: data.error || 'Login failed' };
    } catch (err: any) {
      console.error('[Auth] Login error:', err);
      return { success: false, error: 'Network error. Please check your connection.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('agent_token');
    localStorage.removeItem('agent_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user, token, isLoading,
      isAuthenticated: !!user && !!token,
      login, logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
