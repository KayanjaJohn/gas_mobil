import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';
import api, { apiRequest } from '../services/api';
import { User } from '../types';

// ── Types ────────────────────────────────────────────────────
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

// ── Create context with safe default ─────────────────────────
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => { throw new Error('AuthProvider not mounted'); },
  register: async () => { throw new Error('AuthProvider not mounted'); },
  logout: async () => { throw new Error('AuthProvider not mounted'); },
});

// ── Provider ─────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  // Compute isAuthenticated from user state (always defined)
  const isAuthenticated = !!user;

  // ── Hydrate: Check for existing session on mount ───────────
  useEffect(() => {
    let mounted = true;
    const hydrate = async () => {
      try {
        const token = await AsyncStorage.getItem('access_token');
        const storedUser = await AsyncStorage.getItem('user');
        if (mounted && token && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        }
      } catch (err) {
        console.warn('[AuthContext] Hydration error:', err);
      } finally {
        if (mounted) {
          setIsLoading(false);
          setIsReady(true);
        }
      }
    };
    hydrate();
    return () => { mounted = false; };
  }, []);

  // ── Route protection (only after hydration) ────────────────
  useEffect(() => {
    if (!isReady || isLoading) return;

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'register';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, isReady, segments, router]);

  // ── Login ──────────────────────────────────────────────────
  const login = useCallback(async ({ emailOrPhone, password }: LoginCredentials) => {
    const res = await apiRequest<{ success: boolean; data: { token: string; refreshToken?: string; user: User } }>(
      'post', '/auth/login', { emailOrPhone, password }
    );

    if (!res.success) throw new Error('Login failed');

    const { token, refreshToken, user: userData } = res.data;
    await AsyncStorage.setItem('access_token', token);
    if (refreshToken) await AsyncStorage.setItem('refresh_token', refreshToken);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  // ── Register ───────────────────────────────────────────────
  const register = useCallback(async ({ name, email, phone, password }: RegisterCredentials) => {
    const res = await apiRequest<{ success: boolean; data: { token: string; refreshToken?: string; user: User } }>(
      'post', '/auth/register', { name, email, phone, password, role: 'customer' }
    );

    if (!res.success) throw new Error('Registration failed');

    const { token, refreshToken, user: userData } = res.data;
    await AsyncStorage.setItem('access_token', token);
    if (refreshToken) await AsyncStorage.setItem('refresh_token', refreshToken);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  // ── Logout ─────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
    setUser(null);
    router.replace('/login');
  }, [router]);

  // ── Context value (stable reference) ───────────────────────
  const value = React.useMemo(
    () => ({
      user,
      isAuthenticated,
      isLoading,
      login,
      register,
      logout,
    }),
    [user, isAuthenticated, isLoading, login, register, logout]
  );

  return (
    <AuthContext.Provider value={value}>
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