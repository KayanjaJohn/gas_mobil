import React, { useEffect, useMemo, useRef } from "react";
import { View, StyleSheet, Text, ActivityIndicator } from "react-native";
import { Map, Camera, Marker, GeoJSONSource, Layer } from "@maplibre/maplibre-react-native";

interface Props {
  orderId: string;
  deliveryLatitude: number;
  deliveryLongitude: number;
  driverLocation: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    heading?: number;
    speed?: number;
    timestamp?: string;
  } | null;
  orderStatus: { message?: string; status?: string } | null;
  isConnected: boolean;
}

const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

export const LiveTrackingMap: React.FC<Props> = ({
  deliveryLatitude,
  deliveryLongitude,
  driverLocation,
  orderStatus,
  isConnected,
}) => {
  const cameraRef = useRef<any>(null);

  const validDestination =
    Number.isFinite(deliveryLatitude) &&
    Number.isFinite(deliveryLongitude) &&
    !(deliveryLatitude === 0 && deliveryLongitude === 0);

  const driverPoint = useMemo(() => {
    if (!driverLocation) return null;
    const latitude = Number(driverLocation.latitude);
    const longitude = Number(driverLocation.longitude);
    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 || latitude > 90 ||
      longitude < -180 || longitude > 180 ||
      (latitude === 0 && longitude === 0)
    ) return null;
    return { latitude, longitude };
  }, [driverLocation?.latitude, driverLocation?.longitude]);

  const route = useMemo(() => ({
    type: "FeatureCollection" as const,
    features: driverPoint && validDestination
      ? [{
          type: "Feature" as const,
          properties: {},
          geometry: {
            type: "LineString" as const,
            coordinates: [
              [driverPoint.longitude, driverPoint.latitude],
              [deliveryLongitude, deliveryLatitude],
            ],
          },
        }]
      : [],
  }), [driverPoint?.latitude, driverPoint?.longitude, deliveryLatitude, deliveryLongitude, validDestination]);

  useEffect(() => {
    if (!cameraRef.current || !validDestination) return;
    if (driverPoint) {
      const west = Math.min(driverPoint.longitude, deliveryLongitude);
      const east = Math.max(driverPoint.longitude, deliveryLongitude);
      const south = Math.min(driverPoint.latitude, deliveryLatitude);
      const north = Math.max(driverPoint.latitude, deliveryLatitude);
      cameraRef.current.fitBounds(
        [west, south, east, north],
        { top: 64, right: 54, bottom: 154, left: 54 },
        500
      );
    } else {
      cameraRef.current.easeTo({
        center: [deliveryLongitude, deliveryLatitude],
        zoom: 13,
        duration: 500,
      });
    }
  }, [driverPoint?.latitude, driverPoint?.longitude, deliveryLatitude, deliveryLongitude, validDestination]);

  return (
    <View style={styles.container}>
      <Map
        style={styles.map}
        mapStyle={MAP_STYLE}
        attribution
        compass
      >
        <Camera
          ref={cameraRef}
          initialViewState={{
            center: validDestination
              ? [deliveryLongitude, deliveryLatitude]
              : [32.5825, 0.3476],
            zoom: 12,
          }}
        />

        {validDestination && (
          <Marker
            id="customer-destination"
            lngLat={[deliveryLongitude, deliveryLatitude]}
            anchor="bottom"
          >
            <View style={styles.destinationPin}>
              <Text style={styles.pinLabel}>D</Text>
            </View>
          </Marker>
        )}

        {driverPoint && (
          <Marker
            id="live-driver-position"
            lngLat={[driverPoint.longitude, driverPoint.latitude]}
            anchor="bottom"
          >
            <View style={styles.driverPin}>
              <Text style={styles.pinLabel}>G</Text>
            </View>
          </Marker>
        )}

        {route.features.length > 0 && (
          <GeoJSONSource id="delivery-route-source" data={route as any}>
            <Layer
              id="delivery-route-line"
              type="line"
              paint={{
                "line-color": "#F36A21",
                "line-width": 4,
                "line-opacity": 0.9,
              }}
            />
          </GeoJSONSource>
        )}
      </Map>

      <View style={styles.statusBar}>
        <View style={styles.statusRow}>
          <View style={[styles.dot, isConnected ? styles.dotGreen : styles.dotRed]} />
          <Text style={styles.statusText}>
            {isConnected ? "Live tracking connected" : "Reconnecting to driver…"}
          </Text>
        </View>
        {driverPoint ? (
          <Text style={styles.coordsText}>
            Driver location updated {driverLocation?.timestamp
              ? new Date(driverLocation.timestamp).toLocaleTimeString()
              : "just now"}
            {driverLocation?.accuracy != null
              ? ` · GPS ±${Math.round(driverLocation.accuracy)}m`
              : ""}
            {driverLocation?.speed != null && driverLocation.speed >= 0
              ? ` · ${Math.round(driverLocation.speed * 3.6)} km/h`
              : ""}
          </Text>
        ) : (
          <View style={styles.waitingRow}>
            <ActivityIndicator size="small" color="#F36A21" />
            <Text style={styles.waitingText}>
              {orderStatus?.status === "in_transit" || orderStatus?.status === "nearby"
                ? "Driver is starting GPS. Waiting for first location…"
                : "Waiting for the driver's first GPS update…"}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, overflow: "hidden", backgroundColor: "#D9E6E0" },
  map: { flex: 1 },
  destinationPin: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: "#F36A21", borderWidth: 2, borderColor: "#FFF8EE",
    alignItems: "center", justifyContent: "center",
  },
  driverPin: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: "#0B3D2E", borderWidth: 2, borderColor: "#FFF8EE",
    alignItems: "center", justifyContent: "center",
  },
  pinLabel: { color: "#FFF8EE", fontSize: 11, fontWeight: "900" },
  statusBar: {
    position: "absolute", bottom: 16, left: 16, right: 16,
    backgroundColor: "#FFF8EE", padding: 14, borderRadius: 14,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4, elevation: 5,
  },
  statusRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  dotGreen: { backgroundColor: "#168447" },
  dotRed: { backgroundColor: "#F36A21" },
  statusText: { fontSize: 13, fontWeight: "800", color: "#0B3D2E" },
  coordsText: { fontSize: 11, color: "#527064" },
  waitingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  waitingText: { fontSize: 12, color: "#244B3D", flex: 1 },
});
