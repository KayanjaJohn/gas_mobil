import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { disconnectSocket } from '../services/socketService';
import type { User } from '../types';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';

interface Station {
 id: string;
 name: string;
 address: string;
 city: string;
}



interface AuthContextType {
 user: User | null;
 token: string | null;
 isLoading: boolean;
 login: (emailOrPhone: string, password: string) => Promise<{ success: boolean; error?: string }>;
 logout: () => Promise<void>;
 updateProfile: (details: { name: string; phone: string }) => Promise<{ success: boolean; error?: string }>;
}

// FIX: Safe default context value
const AuthContext = createContext<AuthContextType>({
 user: null,
 token: null,
 isLoading: true,
 login: async () => ({ success: false, error: 'AuthProvider not mounted' }),
 logout: async () => {},
 updateProfile: async () => ({ success: false, error: 'AuthProvider not mounted' }),
});

export function AuthProvider({ children }: { children: ReactNode }) {
 const [user, setUser] = useState<User | null>(null);
 const [token, setToken] = useState<string | null>(null);
 const [isLoading, setIsLoading] = useState(true);

 // Register the signed-in driver's EAS push token so assignments and arrival
 // alerts still reach the phone while the app is backgrounded or closed.
 useEffect(() => {
   if (!user?.id || !token) return;
   let active = true;
   const registerDevice = async () => {
     try {
       let permission = await Notifications.getPermissionsAsync();
       if (!permission.granted) permission = await Notifications.requestPermissionsAsync();
       if (!permission.granted) return;
       const projectId =
         Constants.expoConfig?.extra?.eas?.projectId ||
         (Constants.easConfig as any)?.projectId;
       if (!projectId) {
         console.warn('[Push] Driver EAS project ID is missing.');
         return;
       }
       const pushToken = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
       if (active && pushToken) {
         await api.post('/notifications/push-token', { expoPushToken: pushToken });
       }
     } catch (error: any) {
       console.warn('[Push] Driver device registration failed:', error?.message || error);
     }
   };
   void registerDevice();
   return () => { active = false; };
 }, [user?.id, token]);

 const syncDriverAvailability = async (status: 'online' | 'offline') => {
 try {
 await api.put('/driver/status', { status });
 } catch (error: any) {
 // Availability must not prevent the driver from using the app if the
 // network is briefly unavailable; retrying happens on the next app launch.
 console.warn('[Auth] Could not sync driver availability:', error?.message);
 }
 };

 useEffect(() => {
 let mounted = true;

 const verifySession = async () => {
 try {
 const storedToken = await AsyncStorage.getItem('driver_token');
 if (__DEV__) console.log('[Auth] Hydrating session, token exists:', !!storedToken);

 if (!storedToken) {
 if (mounted) {
 setUser(null);
 setToken(null);
 setIsLoading(false);
 }
 return;
 }

 try {
 const res = await api.get('/auth/me', {
 headers: { Authorization: `Bearer ${storedToken}` }
 });

 if (res.data?.success && res.data?.data) {
 const userData = res.data.data;

 // FIX: Role gate — reject non-drivers
 if (userData.role !== 'driver') {
   throw new Error('This app is for drivers only');
 }

 if (__DEV__) console.log('[Auth] Token valid, user:', userData.email);
 if (mounted) {
 setUser(userData);
 setToken(storedToken);
 await AsyncStorage.setItem('driver_user', JSON.stringify(userData));
 void syncDriverAvailability('online');
 }
 } else {
 throw new Error('Invalid response');
 }
 } catch (verifyErr: any) {
 if (__DEV__) console.log('[Auth] Token verification failed:', verifyErr.message);
 await AsyncStorage.removeItem('driver_token');
 await AsyncStorage.removeItem('driver_user');
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
 if (__DEV__) console.log('[Auth] Login attempt:', emailOrPhone);

 const res = await api.post('/auth/login', {
 emailOrPhone: emailOrPhone.trim(),
 password
 });

 if (res.data?.success && res.data?.data?.token) {
 const { token: newToken, refreshToken, user: userData } = res.data.data;

 // FIX: Role gate — only drivers allowed
 if (userData.role !== 'driver') {
   return { success: false, error: 'This app is for drivers only' };
 }

 if (__DEV__) console.log('[Auth] Login success:', userData.email);

 await AsyncStorage.setItem('driver_token', newToken);
 if (refreshToken) await AsyncStorage.setItem('driver_refresh_token', refreshToken);
 await AsyncStorage.setItem('driver_user', JSON.stringify(userData));
 setToken(newToken);
 setUser(userData);
 void syncDriverAvailability('online');
 return { success: true };
 }

 return { success: false, error: res.data?.error || 'Login failed' };
 } catch (error: any) {
 console.error('[Auth] Login error:', error.message, error.response?.data);

 const apiError = error?.response?.data?.error;
 const status = error?.response?.status;

 if (status === 429) {
 return { success: false, error: 'Too many attempts. Please wait 15 minutes and try again.' };
 }
 if (apiError) {
 return { success: false, error: apiError };
 }

 return { success: false, error: 'Network error. Please check your connection.' };
 }
 };

 const updateProfile = async (details: { name: string; phone: string }) => {
 try {
   const response = await api.put('/auth/profile', {
     name: details.name.trim(),
     phone: details.phone.trim(),
   });
   if (!response.data?.success || !response.data?.data) {
     return { success: false, error: response.data?.error || 'Profile update failed.' };
   }
   const updatedUser = { ...(user || {} as User), ...response.data.data } as User;
   setUser(updatedUser);
   await AsyncStorage.setItem('driver_user', JSON.stringify(updatedUser));
   return { success: true };
 } catch (error: any) {
   return {
     success: false,
     error: error?.response?.data?.error || error?.message || 'Could not update your profile.',
   };
 }
 };

 const logout = async () => {
 await syncDriverAvailability('offline');
 try { await api.delete('/notifications/push-token'); } catch (error) {
   console.warn('[Push] Driver device token cleanup failed:', (error as any)?.message || error);
 }
 disconnectSocket();
 await AsyncStorage.removeItem('driver_token');
 await AsyncStorage.removeItem('driver_refresh_token');
 await AsyncStorage.removeItem('driver_user');
 setToken(null);
 setUser(null);
 };

 return (
 <AuthContext.Provider value={{ user, token, isLoading, login, logout, updateProfile }}>
 {children}
 </AuthContext.Provider>
 );
}

export function useAuth() {
 const ctx = useContext(AuthContext);
 if (!ctx) throw new Error('useAuth must be used within AuthProvider');
 return ctx;
}