import { useEffect, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import { emitLocation, getSocket } from '../services/socketService';

export const useDriverLocation = (orderId: string | null) => {
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  const startTracking = useCallback(async () => {
    if (!orderId) return;

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.error('Location permission denied');
      return;
    }

    // Request background permission for continuous tracking
    const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
    console.log('Background location status:', bgStatus);

    locationSubscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 5000,
        distanceInterval: 10,
      },
      (location) => {
        const data = {
          orderId,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          speed: location.coords.speed,
          heading: location.coords.heading,
        };

        emitLocation(data);
      }
    );
  }, [orderId]);

  const stopTracking = useCallback(() => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return { startTracking, stopTracking };
};
