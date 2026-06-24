import { useEffect, useRef, useCallback } from 'react';
import * as Location from 'expo-location';

// Use require to avoid static module resolution/type errors for the socket service
declare function require(path: string): any;

export const useDriverLocation = (orderId: string | null) => {
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  const startTracking = useCallback(async () => {
    if (!orderId) return;

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.error('Location permission denied');
      return;
    }

    // Also request background permission for continuous tracking
    const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
    console.log('Background location status:', bgStatus);

    locationSubscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 5000, // Update every 5 seconds
        distanceInterval: 10, // Or every 10 meters
      },
      (location) => {
        const socket = getSocket();
        if (socket) {
          socket.emit('driver_location_update', {
            orderId,
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            speed: location.coords.speed,
            heading: location.coords.heading,
          });
        }
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