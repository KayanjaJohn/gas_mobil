import { useEffect, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import { emitLocation, getSocket, initializeSocket } from '../services/socketService';

export const useDriverLocation = (orderId: string | null) => {
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  const startTracking = useCallback(async () => {
    if (!orderId || locationSubscription.current) return;

    let socket = getSocket();
    if (!socket) socket = await initializeSocket();
    if (!socket) {
      console.warn('[DriverGPS] Socket unavailable; location tracking not started.');
      return;
    }

    if (!socket.connected) {
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          socket?.off('connect', onConnect);
          resolve();
        }, 10000);
        const onConnect = () => {
          clearTimeout(timeout);
          resolve();
        };
        socket?.once('connect', onConnect);
      });
    }

    if (!socket.connected) {
      console.warn('[DriverGPS] Socket did not connect within 10 seconds.');
      return;
    }

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
          accuracy: location.coords.accuracy ?? undefined,
          speed: location.coords.speed ?? undefined,
          heading: location.coords.heading ?? undefined,
        };

        console.log('[DriverGPS] Emitting location for order:', orderId, data.latitude, data.longitude);
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
