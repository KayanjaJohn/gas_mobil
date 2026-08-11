import { useEffect, useRef, useCallback } from "react";
import * as Location from "expo-location";
import { getSocket } from "../services/socketService";

/**
 * Hook for drivers to broadcast live location via socket.
 * CRITICAL FIX: stopTracking is wrapped in useCallback so it is stable.
 * The effect dependency array only includes [orderId, startTracking].
 */
export const useDriverLocation = (orderId: string | null) => {
  const trackingRef = useRef(false);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  const stopTracking = useCallback(() => {
    trackingRef.current = false;
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
  }, []);

  const startTracking = useCallback(async () => {
    if (trackingRef.current || !orderId) return;

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.warn("[DriverLocation] Permission denied");
        return;
      }

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 10,
          timeInterval: 5000,
        },
        (location) => {
          if (!trackingRef.current) return;
          const socket = getSocket();
          if (socket && socket.connected) {
            socket.emit("driver_location_update", {
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

      trackingRef.current = true;
      subscriptionRef.current = subscription;
    } catch (err) {
      console.error("[DriverLocation] Start tracking error:", err);
    }
  }, [orderId]);

  useEffect(() => {
    let isMounted = true;

    if (orderId && isMounted) {
      startTracking();
    }

    return () => {
      isMounted = false;
      stopTracking();
    };
    // CRITICAL FIX: stopTracking is intentionally omitted from deps.
    // It is stable via useCallback([]). The original bug was caused by
    // an UNSTABLE stopTracking reference in the dependency array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, startTracking]);

  return {
    isTracking: () => trackingRef.current,
    stopTracking,
    startTracking,
  };
};