import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

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
  status?: string;
  vehicleNumber?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (emailOrPhone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('driver_token');

        console.log('[Auth] Hydrating session...');

        if (!storedToken) {
          console.log('[Auth] No stored token');
          setIsLoading(false);
          return;
        }

        try {
          const res = await api.get('/auth/me', {
            headers: { Authorization: `Bearer ${storedToken}` }
          });

          if (res.data?.success && res.data?.data) {
            const userData = res.data.data;
            console.log('[Auth] Token valid | user:', userData.email);
            setUser(userData);
            setToken(storedToken);
            await AsyncStorage.setItem('driver_user', JSON.stringify(userData));
          } else {
            throw new Error('Invalid response');
          }
        } catch (verifyErr: any) {
          console.log('[Auth] Token verification failed:', verifyErr.message);
          await AsyncStorage.removeItem('driver_token');
          await AsyncStorage.removeItem('driver_user');
          setUser(null);
          setToken(null);
        }
      } catch (err) {
        console.error('[Auth] Session hydration error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    verifySession();
  }, []);

  const login = async (emailOrPhone: string, password: string) => {
    try {
      console.log('[Auth] Login attempt:', emailOrPhone);

      const res = await api.post('/auth/login', { 
        emailOrPhone: emailOrPhone.trim(), 
        password 
      });

      if (res.data?.success && res.data?.data?.token) {
        const { token: newToken, user: userData } = res.data.data;
        console.log('[Auth] Login success:', userData.email);

        await AsyncStorage.setItem('driver_token', newToken);
        await AsyncStorage.setItem('driver_user', JSON.stringify(userData));
        setToken(newToken);
        setUser(userData);
        return { success: true };
      }

      return { success: false, error: res.data?.error || 'Login failed' };
    } catch (error: any) {
      console.error('[Auth] Login error:', error.message, error.response?.data);

      // Extract specific error message from API response
      const apiError = error?.response?.data?.error;
      const status = error?.response?.status;

      if (status === 429) {
        return { success: false, error: 'Too many attempts. Please wait 15 minutes and try again.' };
      }
      if (apiError) {
        return { success: false, error: apiError };
      }

      return { success: false, error: 'Network error. Please check your connection and make sure the API server is running.' };
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('driver_token');
    await AsyncStorage.removeItem('driver_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
