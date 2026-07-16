import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';

export const getStoredUser = async (): Promise<User | null> => {
  try {
    const user = await AsyncStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Error getting stored user:', error);
    return null;
  }
};

export const getStoredToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('access_token');
  } catch (error) {
    console.error('Error getting stored token:', error);
    return null;
  }
};

export const getStoredRefreshToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('refresh_token');
  } catch (error) {
    console.error('Error getting stored refresh token:', error);
    return null;
  }
};

export const clearAuthData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
  } catch (error) {
    console.error('Error clearing auth data:', error);
  }
};
