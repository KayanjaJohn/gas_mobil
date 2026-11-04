import React, { useEffect, useMemo, useRef } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Map, Camera, Marker, GeoJSONSource, Layer } from "@maplibre/maplibre-react-native";
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
      <Map
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
            <View style={styles.destinationPin}><Text style={styles.pinLabel}>D</Text></View>
          </Marker>
        )}

        {driverPoint && (
          <Marker id="live-driver-position" lngLat={[driverPoint.longitude, driverPoint.latitude]} anchor="bottom">
            <View style={styles.driverPin}><Text style={styles.pinLabel}>Y</Text></View>
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
      </Map>

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
  container: { flex: 1, overflow: "hidden", borderRadius: 16, backgroundColor: "#D9E6E0" },
  destinationPin: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: "#F36A21",
    borderWidth: 2, borderColor: "#FFF8EE", alignItems: "center", justifyContent: "center",
  },
  driverPin: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: "#0B3D2E",
    borderWidth: 2, borderColor: "#FFF8EE", alignItems: "center", justifyContent: "center",
  },
  pinLabel: { color: "#FFF8EE", fontSize: 11, fontWeight: "900" },
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
