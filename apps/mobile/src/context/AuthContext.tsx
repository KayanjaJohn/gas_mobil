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
  clearAuth: () => Promise<void>;
}

// ── Create context with safe default ─────────────────────────
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => { throw new Error('AuthProvider not mounted'); },
  register: async () => { throw new Error('AuthProvider not mounted'); },
  logout: async () => { throw new Error('AuthProvider not mounted'); },
  clearAuth: async () => { throw new Error('AuthProvider not mounted'); },
});

// ── Provider ─────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  const isAuthenticated = !!user;

  const clearAuth = useCallback(async () => {
    console.log('[Auth] Clearing auth state');
    await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
    setUser(null);
  }, []);

  // ── Hydrate: Verify token with API before trusting it ──────
  useEffect(() => {
    let mounted = true;
    const hydrate = async () => {
      try {
        console.log('[Auth] Hydrating session from AsyncStorage...');
        const token = await AsyncStorage.getItem('access_token');
        const storedUser = await AsyncStorage.getItem('user');
        console.log('[Auth] Token exists:', !!token, '| User exists:', !!storedUser);

        if (!token || !storedUser) {
          console.log('[Auth] No stored session found');
          if (mounted) {
            setIsLoading(false);
            setIsReady(true);
          }
          return;
        }

        // CRITICAL FIX: Verify token with API before trusting it
        console.log('[Auth] Verifying token with API...');
        try {
          const res = await apiRequest<{ success: boolean; data: User }>(
            'get', '/auth/me'
          );
          if (res.success && res.data) {
            console.log('[Auth] Token valid | user:', res.data.email);
            setUser(res.data);
          } else {
            throw new Error('Token verification failed');
          }
        } catch (verifyError: any) {
          const status = verifyError?.response?.status;
          console.warn('[Auth] Token verification failed | status:', status);
          // 401 = token expired/invalid, 404 = user deleted from DB
          if (status === 401 || status === 404 || status === 403) {
            console.log('[Auth] Token invalid or user deleted — clearing session');
            await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
            setUser(null);
          } else {
            // Network error — use cached user but it may be stale
            console.warn('[Auth] Network error — using cached user (may be stale)');
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
          }
        }
      } catch (err) {
        console.warn('[Auth] Hydration error:', err);
      } finally {
        if (mounted) {
          console.log('[Auth] Hydration complete, isLoading=false');
          setIsLoading(false);
          setIsReady(true);
        }
      }
    };
    hydrate();
    return () => { mounted = false; };
  }, []);

  // ── Route protection ───────────────────────────────────────
  useEffect(() => {
    if (!isReady || isLoading) return;

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'register';
    console.log('[Auth] Route check | authenticated:', isAuthenticated, '| inAuthGroup:', inAuthGroup);

    if (!isAuthenticated && !inAuthGroup) {
      console.log('[Auth] → Redirecting to /login');
      router.replace('/login');
    } else if (isAuthenticated && inAuthGroup) {
      console.log('[Auth] → Redirecting to /(tabs)');
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, isReady, segments, router]);

  // ── Login ──────────────────────────────────────────────────
  const login = useCallback(async ({ emailOrPhone, password }: LoginCredentials) => {
    console.log('[Auth] Login attempt for:', emailOrPhone);
    try {
      const res = await apiRequest<{ success: boolean; data: { token: string; refreshToken?: string; user: User } }>(
        'post', '/auth/login', { emailOrPhone, password }
      );

      if (!res.success) throw new Error('Login failed');

      const { token, refreshToken, user: userData } = res.data;
      console.log('[Auth] Login success | user:', userData.email);
      await AsyncStorage.setItem('access_token', token);
      if (refreshToken) await AsyncStorage.setItem('refresh_token', refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } catch (error: any) {
      console.error('[Auth] Login failed:', error?.response?.data?.error || error?.message);
      throw error;
    }
  }, []);

  // ── Register ───────────────────────────────────────────────
  const register = useCallback(async ({ name, email, phone, password }: RegisterCredentials) => {
    console.log('[Auth] Register attempt for:', email);
    try {
      const res = await apiRequest<{ success: boolean; data: { token: string; refreshToken?: string; user: User } }>(
        'post', '/auth/register', { name, email, phone, password, role: 'customer' }
      );

      if (!res.success) throw new Error('Registration failed');

      const { token, refreshToken, user: userData } = res.data;
      console.log('[Auth] Register success | user:', userData.email);
      await AsyncStorage.setItem('access_token', token);
      if (refreshToken) await AsyncStorage.setItem('refresh_token', refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } catch (error: any) {
      console.error('[Auth] Register failed:', error?.response?.data?.error || error?.message);
      throw error;
    }
  }, []);

  // ── Logout ─────────────────────────────────────────────────
  const logout = useCallback(async () => {
    console.log('[Auth] Logging out user');
    await clearAuth();
    router.replace('/login');
  }, [clearAuth, router]);

  // ── Context value ──────────────────────────────────────────
  const value = React.useMemo(
    () => ({
      user,
      isAuthenticated,
      isLoading,
      login,
      register,
      logout,
      clearAuth,
    }),
    [user, isAuthenticated, isLoading, login, register, logout, clearAuth]
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
