import { useState, useCallback } from 'react';
import * as Location from 'expo-location';
import { Alert, Platform, Linking } from 'react-native';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  address: string;
  city: string;
}

export function useLocation() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentLocation = useCallback(async (options?: {
    showAlerts?: boolean;
  }): Promise<LocationData | null> => {
    const { showAlerts = true } = options || {};
    setLoading(true);
    setError(null);

    try {
      // 1. Check permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        const msg = 'Location permission denied. GasMobil needs GPS to deliver gas to your door.';
        setError(msg);
        if (showAlerts) {
          Alert.alert(
            'Location Permission Required',
            msg,
            [
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
              { text: 'Cancel', style: 'cancel' },
            ]
          );
        }
        return null;
      }

      // 2. Check if GPS is enabled
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        const msg = 'GPS is turned off. Please enable location services to continue.';
        setError(msg);
        if (showAlerts) {
          Alert.alert(
            'GPS Disabled',
            msg,
            [
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
              { text: 'Cancel', style: 'cancel' },
            ]
          );
        }
        return null;
      }

      // 3. Get current position with high accuracy
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 5000,
      });

      if (!loc.coords.latitude || !loc.coords.longitude) {
        throw new Error('GPS returned invalid coordinates');
      }

      // 4. Reverse geocode
      const geocode = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      const place = geocode[0] || {};
      const addressParts = [
        place.street,
        place.streetNumber,
        place.district,
        place.subregion,
        place.name,
      ].filter(Boolean);

      const locationData: LocationData = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        accuracy: loc.coords.accuracy,
        address: addressParts.join(', ') || `${loc.coords.latitude.toFixed(5)}, ${loc.coords.longitude.toFixed(5)}`,
        city: place.city || place.subregion || 'Kampala',
      };

      setLocation(locationData);
      setError(null);
      return locationData;
    } catch (err: any) {
      const msg = err.message || 'Failed to get your location. Please try again.';
      setError(msg);
      setLocation(null);
      if (showAlerts) {
        Alert.alert('Location Error', msg, [
          { text: 'Retry', onPress: () => getCurrentLocation({ showAlerts }) },
          { text: 'Cancel', style: 'cancel' },
        ]);
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearLocation = useCallback(() => {
    setLocation(null);
    setError(null);
  }, []);

  return {
    location,
    loading,
    error,
    getCurrentLocation,
    clearLocation,
  };
}