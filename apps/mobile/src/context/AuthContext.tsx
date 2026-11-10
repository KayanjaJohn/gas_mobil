import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';
import Constants from 'expo-constants';

import { AppState, Platform } from 'react-native';
import { apiRequest } from '../services/api';
import { User } from '../types';
import { initializeSocket, disconnectSocket } from '../services/socketService';
// Load expo-notifications only in a native build; its module throws in Expo Go on Android SDK 53+.
const Notifications: typeof import('expo-notifications') | null = Constants.executionEnvironment === 'storeClient' ? null : require('expo-notifications');

// Show remote pushes while the app is open; Android channel settings still
// control whether the user hears a sound or sees a heads-up alert.
if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
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
  address?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (creds: LoginCredentials) => Promise<void>;
  register: (creds: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  clearAuth: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => { throw new Error('AuthProvider not mounted'); },
  register: async () => { throw new Error('AuthProvider not mounted'); },
  logout: async () => { throw new Error('AuthProvider not mounted'); },
  clearAuth: async () => { throw new Error('AuthProvider not mounted'); },
  updateUser: async () => { throw new Error('AuthProvider not mounted'); },
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  const isAuthenticated = !!user;

  // Own the shared socket lifecycle at the authenticated-session boundary.
  useEffect(() => {
    if (isLoading) return;
    if (user) {
      initializeSocket();
    } else {
      disconnectSocket();
    }
  }, [user, isLoading]);

  const clearAuth = useCallback(async () => {
    if (__DEV__) console.log('[Auth] Clearing auth state');
    disconnectSocket();
    await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
    setUser(null);
  }, []);

  useEffect(() => {
    let mounted = true;
    const hydrate = async () => {
      try {
        if (__DEV__) console.log('[Auth] Hydrating session...');
        const token = await AsyncStorage.getItem('access_token');
        const storedUser = await AsyncStorage.getItem('user');
        if (__DEV__) console.log('[Auth] Token exists:', !!token, '| User exists:', !!storedUser);

        if (!token || !storedUser) {
          if (__DEV__) console.log('[Auth] No stored session');
          if (mounted) { setIsLoading(false); setIsReady(true); }
          return;
        }

        try {
          const res = await apiRequest<User>('get', '/auth/me');
          if (res.success && res.data) {
            if (__DEV__) console.log('[Auth] Token valid | user:', res.data.email);
            setUser(res.data);
          } else {
            throw new Error('Token verification failed');
          }
        } catch (verifyError: any) {
          const status = verifyError?.response?.status;
          if (__DEV__) console.warn('[Auth] Token verification failed | status:', status);
          if (status === 401 || status === 404 || status === 403) {
            await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
            setUser(null);
          } else {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
          }
        }
      } catch (err) {
        console.warn('[Auth] Hydration error:', err);
      } finally {
        if (mounted) { setIsLoading(false); setIsReady(true); }
      }
    };
    hydrate();
    return () => { mounted = false; };
  }, []);

  // Register the customer's Expo token on login and whenever the app returns
  // to the foreground. This also repairs transient network/permission failures.
  useEffect(() => {
    if (!user?.id || Platform.OS === 'web' || !Notifications) return;
    let active = true;
    let registering = false;
    const registerDevice = async () => {
      if (!active || registering) return;
      registering = true;
      try {
        let permission = await Notifications.getPermissionsAsync();
        if (!permission.granted) permission = await Notifications.requestPermissionsAsync();
        if (!permission.granted) {
          console.warn('[Push] Customer notifications are not permitted on this device.');
          return;
        }
        if (Platform.OS === 'android') {
          const channel = await Notifications.setNotificationChannelAsync('gasmobil-alerts-v3', {
            name: 'GasMobil Order & Delivery Alerts',
            importance: Notifications.AndroidImportance.MAX,
            sound: 'default',
            vibrationPattern: [0, 500, 180, 500, 180, 650],
            enableVibrate: true,
            enableLights: true,
            lightColor: '#0A3D2E',
            lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
            showBadge: true,
          });
          console.info('[Push] Customer channel configured:', {
            id: channel.id, importance: channel.importance, sound: channel.sound,
          });
        }
        const projectId = Constants.expoConfig?.extra?.eas?.projectId ||
          (Constants.easConfig as any)?.projectId;
        if (!projectId) {
          console.error('[Push] Customer EAS project ID is missing.');
          return;
        }
        const pushToken = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        if (!active || !pushToken) return;
        const response = await apiRequest('post', '/notifications/push-token', { expoPushToken: pushToken });
        console.info('[Push] Customer token registration:', {
          tokenAcquired: true,
          tokenFormatValid: /^(Expo|Exponent)PushToken\[[^\]]+\]$/.test(pushToken),
          registrationSucceeded: !!response?.success,
        });
        if (!response?.success) console.warn('[Push] Customer token registration was not confirmed.');
      } catch (error: any) {
        console.error('[Push] Customer device registration failed:', {
          message: error?.message || String(error),
          status: error?.response?.status ?? null,
          response: error?.response?.data ?? null,
        });
      } finally {
        registering = false;
      }
    };
    void registerDevice();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void registerDevice();
    });
    return () => { active = false; subscription.remove(); };
  }, [user?.id]);
  // Route protection
  useEffect(() => {
    if (!isReady || isLoading) return;
    const inAuthGroup = ['login', 'register', 'forgot-password'].includes(String(segments[0] || ''));
    if (__DEV__) console.log('[Auth] Route check | auth:', isAuthenticated, '| inAuth:', inAuthGroup);

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, isReady, segments, router]);

  const login = useCallback(async ({ emailOrPhone, password }: LoginCredentials) => {
    if (__DEV__) console.log('[Auth] Login attempt:', emailOrPhone);
    const res = await apiRequest<{ token: string; accessToken?: string; refreshToken?: string; user: User }>(
      'post', '/auth/login', { emailOrPhone, password }
    );
    if (!res.success || !res.data) throw new Error('Login failed');
    const { token, refreshToken, user: userData } = res.data;
    if (__DEV__) console.log('[Auth] Login success:', userData.email);
    await AsyncStorage.setItem('access_token', token);
    if (refreshToken) await AsyncStorage.setItem('refresh_token', refreshToken);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const register = useCallback(async ({ name, email, phone, password, address, city, latitude, longitude }: RegisterCredentials) => {
    if (__DEV__) console.log('[Auth] Register attempt:', email);
    const res = await apiRequest<{ token: string; accessToken?: string; refreshToken?: string; user: User }>(
      'post', '/auth/register', {
        name, email, phone, password, role: 'customer',
        address, city, latitude, longitude,
      }
    );
    if (!res.success || !res.data) throw new Error('Registration failed');
    const { token, refreshToken, user: userData } = res.data;
    if (__DEV__) console.log('[Auth] Register success:', userData.email);
    await AsyncStorage.setItem('access_token', token);
    if (refreshToken) await AsyncStorage.setItem('refresh_token', refreshToken);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const updateUser = useCallback(async (data: Partial<User>) => {
    const res = await apiRequest<User>("put", "/auth/profile", data);
    if (!res.success || !res.data) {
      throw new Error(res.error || "Failed to update profile");
    }
    setUser(res.data);
    await AsyncStorage.setItem("user", JSON.stringify(res.data));
  }, []);


  const logout = useCallback(async () => {
    if (__DEV__) console.log('[Auth] Logging out');
    try {
      if (Platform.OS !== 'web') await apiRequest('delete', '/notifications/push-token');
    } catch (error: any) {
      console.warn('[Push] Customer device token cleanup failed:', error?.message || error);
    }
    await clearAuth();
    router.replace('/login');
  }, [clearAuth, router]);

  const value = React.useMemo(() => ({
    user, isAuthenticated, isLoading, login, register, logout, clearAuth, updateUser,
  }), [user, isAuthenticated, isLoading, login, register, logout, clearAuth, updateUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}