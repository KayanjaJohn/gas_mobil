import React, { useEffect, useMemo, useRef } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, type Region } from "react-native-maps";
import type { LocationPoint } from "../types";

type Coordinate = { latitude: number; longitude: number };

interface Props {
  destination: Coordinate | null;
  driverLocation: LocationPoint | null;
  status: string;
}

const KAMPALA: Region = {
  latitude: 0.3136,
  longitude: 32.5811,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};

export default function DriverLiveMap({ destination, driverLocation, status }: Props) {
  const mapRef = useRef<MapView>(null);

  const driverPoint = useMemo<Coordinate | null>(() => {
    if (!driverLocation) return null;
    const latitude = Number(driverLocation.latitude);
    const longitude = Number(driverLocation.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) ||
      latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180 ||
      (latitude === 0 && longitude === 0)) return null;
    return { latitude, longitude };
  }, [driverLocation?.latitude, driverLocation?.longitude]);

  const initialRegion = useMemo<Region>(() => {
    const center = driverPoint || destination || KAMPALA;
    return {
      latitude: center.latitude,
      longitude: center.longitude,
      latitudeDelta: 0.035,
      longitudeDelta: 0.035,
    };
  }, [driverPoint?.latitude, driverPoint?.longitude, destination?.latitude, destination?.longitude]);

  useEffect(() => {
    if (!mapRef.current) return;
    const coordinates = [driverPoint, destination].filter(Boolean) as Coordinate[];
    if (coordinates.length === 2) {
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 70, right: 50, bottom: 125, left: 50 },
        animated: true,
      });
    } else if (coordinates.length === 1) {
      mapRef.current.animateToRegion({
        latitude: coordinates[0].latitude,
        longitude: coordinates[0].longitude,
        latitudeDelta: 0.025,
        longitudeDelta: 0.025,
      }, 450);
    }
  }, [driverPoint?.latitude, driverPoint?.longitude, destination?.latitude, destination?.longitude]);

  const inMotion = ["in_transit", "nearby"].includes(status);
  const hasAnyLocation = !!driverPoint || !!destination;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        initialRegion={initialRegion}
        showsCompass
        showsScale
        showsTraffic={false}
        loadingEnabled
        toolbarEnabled
        accessibilityLabel="Live delivery map"
      >
        {destination && (
          <Marker
            coordinate={destination}
            title="Customer delivery address"
            description="Delivery destination"
            pinColor="#F36A21"
          />
        )}
        {driverPoint && (
          <Marker
            coordinate={driverPoint}
            title="Your current position"
            description="Live GPS position"
            pinColor="#168447"
            rotation={driverLocation?.heading || 0}
          />
        )}
        {driverPoint && destination && (
          <Polyline
            coordinates={[driverPoint, destination]}
            strokeColor="#F36A21"
            strokeWidth={4}
            lineDashPattern={[8, 5]}
          />
        )}
      </MapView>

      <View style={styles.statusPanel}>
        <View style={[styles.dot, driverPoint && inMotion ? styles.liveDot : styles.waitDot]} />
        <View style={styles.statusCopy}>
          <Text style={styles.statusTitle}>
            {driverPoint && inMotion ? "LIVE · Your GPS is sharing" :
              driverPoint ? "GPS location available" :
              destination ? "Waiting for your first GPS fix" : "Delivery map"}
          </Text>
          <Text style={styles.statusSub}>
            {destination
              ? "Orange pin: customer · Green pin: you"
              : "Customer destination pin has not been saved"}
          </Text>
        </View>
        {!driverPoint && inMotion && <ActivityIndicator size="small" color="#F36A21" />}
        {!hasAnyLocation && <Text style={styles.waiting}>Map centred on Kampala until a location is available.</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: "hidden", borderRadius: 16, backgroundColor: "#D9E6E0" },
  statusPanel: {
    position: "absolute", left: 12, right: 12, bottom: 12,
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 13, paddingVertical: 11, borderRadius: 13,
    backgroundColor: "#FFF8EE", borderWidth: 1, borderColor: "#D8CDBB",
    shadowColor: "#000", shadowOpacity: .18, shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 }, elevation: 6,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  liveDot: { backgroundColor: "#168447" },
  waitDot: { backgroundColor: "#F36A21" },
  statusCopy: { flex: 1 },
  statusTitle: { color: "#0B3D2E", fontSize: 12, fontWeight: "800" },
  statusSub: { color: "#68786F", fontSize: 10, marginTop: 3 },
  waiting: { color: "#68786F", fontSize: 10 },
});
