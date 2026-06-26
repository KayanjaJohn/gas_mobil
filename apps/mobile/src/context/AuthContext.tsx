import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import api, { apiRequest } from '../services/api';

// ── Types ────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'driver' | 'agent' | 'admin';
  stationId?: string;
  driverStatus?: string;
}

interface LoginCredentials {
  emailOrPhone: string;
  password: string;
}

interface RegisterCredentials {
  name: string;
  email: string;
  phone: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (creds: LoginCredentials) => Promise<void>;
  register: (creds: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

// ── Context ──────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // ── Hydrate: Check for existing session on mount ───────────
  useEffect(() => {
    const hydrate = async () => {
      try {
        const token = await AsyncStorage.getItem('access_token');
        const storedUser = await AsyncStorage.getItem('user');
        if (token && storedUser) {
          setUser(JSON.parse(storedUser));
          // Optionally verify token with backend
          // await apiRequest('get', '/auth/verify');
        }
      } catch {
        // Silently fail — user will see login screen
      } finally {
        setIsLoading(false);
      }
    };
    hydrate();
  }, []);

  // ── Login ──────────────────────────────────────────────────
  const login = async ({ emailOrPhone, password }: LoginCredentials) => {
    const res = await apiRequest<{ success: boolean; data: { token: string; refreshToken?: string; user: User } }>(
      'post',
      '/auth/login',
      { emailOrPhone, password }
    );

    if (!res.success) throw new Error('Login failed');

    const { token, refreshToken, user: userData } = res.data;
    await AsyncStorage.setItem('access_token', token);
    if (refreshToken) await AsyncStorage.setItem('refresh_token', refreshToken);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  // ── Register ─────────────────────────────────────────────────
  const register = async ({ name, email, phone, password }: RegisterCredentials) => {
    const res = await apiRequest<{ success: boolean; data: { token: string; refreshToken?: string; user: User } }>(
      'post',
      '/auth/register',
      { name, email, phone, password, role: 'customer' }
    );

    if (!res.success) throw new Error('Registration failed');

    // Auto-login after registration (better UX)
    const { token, refreshToken, user: userData } = res.data;
    await AsyncStorage.setItem('access_token', token);
    if (refreshToken) await AsyncStorage.setItem('refresh_token', refreshToken);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  // ── Logout ─────────────────────────────────────────────────
  const logout = async () => {
    await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
    setUser(null);
    router.replace('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}