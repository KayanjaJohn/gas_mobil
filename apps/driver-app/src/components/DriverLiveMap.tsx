import React, { useEffect, useMemo, useRef } from "react";
import Constants from "expo-constants";
import { Linking, TouchableOpacity } from "react-native";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import Icon from "@expo/vector-icons/MaterialCommunityIcons";

import type { LocationPoint } from "../types";

type Coordinate = { latitude: number; longitude: number };

interface Props {
  destination: Coordinate | null;
  driverLocation: LocationPoint | null;
  status: string;
}

const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
const KAMPALA: Coordinate = { latitude: 0.3476, longitude: 32.5825 };

export default function DriverLiveMap({ destination, driverLocation, status }: Props) {
  const cameraRef = useRef<any>(null);
  // MapLibre is a native module absent from the Expo Go binary.
  let NativeMap: any = null, Camera: any = null, Marker: any = null, GeoJSONSource: any = null, Layer: any = null;
  let nativeMapAvailable = false;
  if (Constants.executionEnvironment !== "storeClient") {
    try {
      const maplibre = require("@maplibre/maplibre-react-native");
      NativeMap = maplibre.Map; Camera = maplibre.Camera; Marker = maplibre.Marker;
      GeoJSONSource = maplibre.GeoJSONSource; Layer = maplibre.Layer;
      nativeMapAvailable = !!(NativeMap && Camera && Marker && GeoJSONSource && Layer);
    } catch { nativeMapAvailable = false; }
  }

  const driverPoint = useMemo<Coordinate | null>(() => {
    if (!driverLocation) return null;
    const latitude = Number(driverLocation.latitude);
    const longitude = Number(driverLocation.longitude);
    if (
      !Number.isFinite(latitude) || !Number.isFinite(longitude) ||
      latitude < -90 || latitude > 90 ||
      longitude < -180 || longitude > 180 ||
      (latitude === 0 && longitude === 0)
    ) return null;
    return { latitude, longitude };
  }, [driverLocation?.latitude, driverLocation?.longitude]);

  const destinationPoint = useMemo<Coordinate | null>(() => {
    if (!destination) return null;
    const latitude = Number(destination.latitude);
    const longitude = Number(destination.longitude);
    if (
      !Number.isFinite(latitude) || !Number.isFinite(longitude) ||
      latitude < -90 || latitude > 90 ||
      longitude < -180 || longitude > 180 ||
      (latitude === 0 && longitude === 0)
    ) return null;
    return { latitude, longitude };
  }, [destination?.latitude, destination?.longitude]);

  const route = useMemo(() => ({
    type: "FeatureCollection" as const,
    features: driverPoint && destinationPoint
      ? [{
          type: "Feature" as const,
          properties: {},
          geometry: {
            type: "LineString" as const,
            coordinates: [
              [driverPoint.longitude, driverPoint.latitude],
              [destinationPoint.longitude, destinationPoint.latitude],
            ],
          },
        }]
      : [],
  }), [driverPoint?.latitude, driverPoint?.longitude, destinationPoint?.latitude, destinationPoint?.longitude]);

  const inMotion = ["in_transit", "nearby"].includes(status);
  const hasAnyLocation = !!driverPoint || !!destinationPoint;

  useEffect(() => {
    if (!cameraRef.current) return;
    const points = [driverPoint, destinationPoint].filter(Boolean) as Coordinate[];
    if (points.length === 2) {
      const west = Math.min(points[0].longitude, points[1].longitude);
      const east = Math.max(points[0].longitude, points[1].longitude);
      const south = Math.min(points[0].latitude, points[1].latitude);
      const north = Math.max(points[0].latitude, points[1].latitude);
      cameraRef.current.fitBounds(
        [west, south, east, north],
        { top: 64, right: 50, bottom: 128, left: 50 },
        500
      );
    } else if (points.length === 1) {
      cameraRef.current.easeTo({
        center: [points[0].longitude, points[0].latitude],
        zoom: 14,
        duration: 450,
      });
    }
  }, [driverPoint?.latitude, driverPoint?.longitude, destinationPoint?.latitude, destinationPoint?.longitude]);

  const center = driverPoint || destinationPoint || KAMPALA;

  return (
    <View style={styles.container}>
      {nativeMapAvailable ? <NativeMap
        style={StyleSheet.absoluteFillObject}
        mapStyle={MAP_STYLE}
        attribution
        compass
        scaleBar
      >
        <Camera
          ref={cameraRef}
          initialViewState={{
            center: [center.longitude, center.latitude],
            zoom: 12,
          }}
        />

        {destinationPoint && (
          <Marker id="customer-destination" lngLat={[destinationPoint.longitude, destinationPoint.latitude]} anchor="bottom">
            <View style={styles.destinationPin}><Icon name="home-map-marker" size={22} color="#FFFFFF" /></View>
          </Marker>
        )}

        {driverPoint && (
          <Marker id="live-driver-position" lngLat={[driverPoint.longitude, driverPoint.latitude]} anchor="bottom">
            <View style={styles.driverPin}><Icon name="truck-delivery" size={21} color="#FFFFFF" /></View>
          </Marker>
        )}

        {route.features.length > 0 && (
          <GeoJSONSource id="driver-route-source" data={route as any}>
            <Layer
              id="driver-route-line"
              source="driver-route-source"
              type="line"
              paint={{
                "line-color": "#F36A21",
                "line-width": 4,
                "line-opacity": 0.9,
                "line-dasharray": [2, 1.5],
              }}
            />
          </GeoJSONSource>
        )}
      </NativeMap> : (
        <View style={styles.expoFallback}>
          <Text style={styles.fallbackTitle}>Delivery map preview</Text>
          <Text style={styles.fallbackCopy}>Your GPS and delivery updates can still be tested in Expo Go. The embedded live map requires the GasMobil development or production build.</Text>
          {driverPoint && <Text style={styles.fallbackCoordinate}>Your GPS: {driverPoint.latitude.toFixed(5)}, {driverPoint.longitude.toFixed(5)}</Text>}
          {destinationPoint && <Text style={styles.fallbackCoordinate}>Customer: {destinationPoint.latitude.toFixed(5)}, {destinationPoint.longitude.toFixed(5)}</Text>}
          <TouchableOpacity style={styles.navigateButton} onPress={() => {
            if (!destinationPoint) return;
            const url = driverPoint
              ? "https://www.google.com/maps/dir/" + driverPoint.latitude + "," + driverPoint.longitude + "/" + destinationPoint.latitude + "," + destinationPoint.longitude
              : "https://www.google.com/maps/search/?api=1&query=" + destinationPoint.latitude + "," + destinationPoint.longitude;
            void Linking.openURL(url);
          }}><Text style={styles.navigateText}>Open Google Maps navigation</Text></TouchableOpacity>
        </View>
      )}

      <View style={styles.statusPanel}>
        <View style={[styles.dot, driverPoint && inMotion ? styles.liveDot : styles.waitDot]} />
        <View style={styles.statusCopy}>
          <Text style={styles.statusTitle}>
            {driverPoint && inMotion ? "LIVE · Your GPS is sharing" :
              driverPoint ? "GPS location available" :
              "Waiting for your first GPS fix"}
          </Text>
          <Text style={styles.statusSub}>
            {destinationPoint
              ? "Orange pin: customer · Green pin: your current position"
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
  container: { flex: 1, overflow: "hidden", borderRadius: 16, backgroundColor: "#E8F0E9" },
  expoFallback: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", padding: 22, backgroundColor: "#E8F0E9" },
  fallbackTitle: { color: "#0A3D2E", fontSize: 19, fontWeight: "900", marginBottom: 8 },
  fallbackCopy: { color: "#52685B", textAlign: "center", fontSize: 12, lineHeight: 18 },
  fallbackCoordinate: { color: "#0A3D2E", fontSize: 12, fontWeight: "700", marginTop: 8 },
  navigateButton: { marginTop: 14, backgroundColor: "#F36A21", paddingHorizontal: 16, paddingVertical: 11, borderRadius: 10 },
  navigateText: { color: "#FFFFFF", fontWeight: "800", fontSize: 12 },
  destinationPin: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: "#F36A21",
    borderWidth: 2, borderColor: "#FFF8EE", alignItems: "center", justifyContent: "center",
  },
  driverPin: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: "#0A3D2E",
    borderWidth: 2, borderColor: "#FFF8EE", alignItems: "center", justifyContent: "center",
  },
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
  statusTitle: { color: "#0A3D2E", fontSize: 12, fontWeight: "800" },
  statusSub: { color: "#68786F", fontSize: 10, marginTop: 3 },
  waiting: { color: "#68786F", fontSize: 10 },
});
