import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (emailOrPhone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const verifySession = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        console.log('[Auth] Hydrating session, token exists:', !!storedToken);

        if (!storedToken) {
          if (mounted) {
            setUser(null);
            setToken(null);
            setIsLoading(false);
          }
          return;
        }

        try {
          const res = await apiRequest('get', '/auth/me');
          if (res.success && res.data) {
            console.log('[Auth] Token valid, user:', res.data.email);
            if (mounted) {
              setUser(res.data);
              setToken(storedToken);
            }
          } else {
            throw new Error('Invalid response');
          }
        } catch (verifyErr: any) {
          console.log('[Auth] Token verification failed:', verifyErr.message);
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('user');
          if (mounted) {
            setUser(null);
            setToken(null);
          }
        }
      } catch (err) {
        console.error('[Auth] Session hydration error:', err);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    verifySession();

    return () => { mounted = false; };
  }, []);

  const login = async (emailOrPhone: string, password: string) => {
    try {
      console.log('[Auth] Login attempt:', emailOrPhone);
      const res = await apiRequest('post', '/auth/login', { emailOrPhone, password });

      if (res.success && res.data?.token) {
        const { token: newToken, user: userData } = res.data;
        console.log('[Auth] Login success:', userData.email);
        await AsyncStorage.setItem('token', newToken);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        setToken(newToken);
        setUser(userData);
        return { success: true };
      }

      return { success: false, error: res.error || 'Login failed' };
    } catch (error: any) {
      console.error('[Auth] Login error:', error);
      const apiError = error?.response?.data?.error;
      const status = error?.response?.status;

      if (status === 429) {
        return { success: false, error: 'Too many attempts. Please wait 15 minutes.' };
      }
      if (apiError) {
        return { success: false, error: apiError };
      }
      return { success: false, error: 'Network error. Please check your connection.' };
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
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

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
