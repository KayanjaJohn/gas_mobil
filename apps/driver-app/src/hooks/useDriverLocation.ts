import { useEffect, useRef, useCallback, useState } from 'react';
import * as Location from 'expo-location';
import { emitLocation, getSocket, initializeSocket } from '../services/socketService';
import { LocationPoint } from '../types';

export const useDriverLocation = (orderId: string | string[] | null) => {
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const startingRef = useRef(false);
  const [currentLocation, setCurrentLocation] = useState<LocationPoint | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const publishLocation = useCallback((coords: Location.LocationObjectCoords) => {
    const orderIds = Array.isArray(orderId) ? orderId : orderId ? [orderId] : [];
    if (!orderIds.length) return;
    const point: LocationPoint = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy ?? undefined,
      speed: coords.speed ?? undefined,
      heading: coords.heading ?? undefined,
      timestamp: new Date().toISOString(),
    };
    setCurrentLocation(point);
    orderIds.forEach((id) => emitLocation({ orderId: id, ...point }));
  }, [orderId]);

  const startTracking = useCallback(async () => {
    if (!orderId || locationSubscription.current || startingRef.current) return;
    startingRef.current = true;
    try {
      let socket = getSocket();
      if (!socket) socket = await initializeSocket();
      if (!socket) throw new Error('Unable to initialize live tracking connection');

      if (!socket.connected) {
        await new Promise<void>((resolve) => {
          const timeout = setTimeout(() => {
            socket?.off('connect', onConnect);
            resolve();
          }, 15000);
          const onConnect = () => {
            clearTimeout(timeout);
            resolve();
          };
          socket?.once('connect', onConnect);
        });
      }
      if (!socket.connected) throw new Error('Live connection unavailable. Please retry.');

      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setPermissionGranted(false);
        throw new Error('Location permission is required to share your journey with the customer.');
      }
      setPermissionGranted(true);

      // Publish a first fix immediately; do not wait for the first watch interval.
      const firstFix = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });
      publishLocation(firstFix.coords);

      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 3000,
          distanceInterval: 5,
        },
        (location) => publishLocation(location.coords)
      );
      console.log('[DriverGPS] Live tracking started for order:', orderId);
    } catch (error) {
      console.error('[DriverGPS] Could not start tracking:', error);
      throw error;
    } finally {
      startingRef.current = false;
    }
  }, [orderId, publishLocation]);

  const stopTracking = useCallback(() => {
    locationSubscription.current?.remove();
    locationSubscription.current = null;
  }, []);

  useEffect(() => stopTracking, [stopTracking]);

  return { startTracking, stopTracking, currentLocation, permissionGranted };
};
