import { useEffect, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import { getSocket } from '../services/socketService';

export const useDriverLocation = (orderId: string | null) => {
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  const startTracking = useCallback(async () => {
    if (!orderId) {
      console.log('[Location] No orderId, skipping startTracking');
      return;
    }

    try {
      console.log('[Location] Requesting location permissions...');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('[Location] Permission denied');
        return;
      }

      const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
      console.log('[Location] Background location status:', bgStatus);

      console.log('[Location] Starting position watch for order:', orderId);
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (location) => {
          try {
            const socket = getSocket();
            if (socket) {
              console.log('[Location] Emitting driver location:', location.coords.latitude, location.coords.longitude);
              socket.emit('driver_location_update', {
                orderId,
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                accuracy: location.coords.accuracy,
                speed: location.coords.speed,
                heading: location.coords.heading,
              });
            } else {
              console.warn('[Location] Socket not available, cannot emit location');
            }
          } catch (error) {
            console.error('[Location] Error emitting location:', error);
          }
        }
      );
    } catch (error) {
      console.error('[Location] Error in startTracking:', error);
    }
  }, [orderId]);

  const stopTracking = useCallback(() => {
    if (locationSubscription.current) {
      console.log('[Location] Stopping position watch');
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
  }, [stopTracking]);

  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return { startTracking, stopTracking };
};