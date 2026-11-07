import React, { useMemo } from "react";
import Constants from "expo-constants";
import { View, StyleSheet, Text, ActivityIndicator, Linking } from "react-native";
import Icon from "@expo/vector-icons/MaterialCommunityIcons";


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
  let NativeMap: any = null;
  let Camera: any = null;
  let Marker: any = null;
  let GeoJSONSource: any = null;
  let Layer: any = null;
  let nativeMapAvailable = false;
  if (Constants.executionEnvironment !== "storeClient") try {
    const maplibre = require("@maplibre/maplibre-react-native");
    NativeMap = maplibre.Map; Camera = maplibre.Camera; Marker = maplibre.Marker;
    GeoJSONSource = maplibre.GeoJSONSource; Layer = maplibre.Layer;
    nativeMapAvailable = !!(NativeMap && Camera && Marker && GeoJSONSource && Layer);
  } catch { nativeMapAvailable = false; }

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



  return (
    <View style={styles.container}>
      {nativeMapAvailable ? (
        <NativeMap style={styles.map} mapStyle={MAP_STYLE} attribution compass>
          <Camera initialViewState={{ center: validDestination ? [deliveryLongitude, deliveryLatitude] : [32.5825, 0.3476], zoom: 12 }} />
          {validDestination && <Marker id="customer-destination" lngLat={[deliveryLongitude, deliveryLatitude]} anchor="bottom"><View style={styles.destinationPin}><Icon name="home-map-marker" size={23} color="#FFFFFF" /></View></Marker>}
          {driverPoint && <Marker id="live-driver-position" lngLat={[driverPoint.longitude, driverPoint.latitude]} anchor="bottom"><View style={styles.driverPin}><Icon name="truck-delivery" size={21} color="#FFFFFF" /></View></Marker>}
          {route.features.length > 0 && <GeoJSONSource id="delivery-route-source" data={route as any}><Layer id="delivery-route-line" source="delivery-route-source" type="line" paint={{ "line-color": "#F36A21", "line-width": 4, "line-opacity": 0.9 }} /></GeoJSONSource>}
        </NativeMap>
      ) : (
        <View style={styles.expoFallback}>
          <Text style={styles.fallbackTitle}>Live delivery location</Text>
          <Text style={styles.fallbackText}>The tracking connection remains active. Expo Go does not include the MapLibre native module; use a GasMobil development or production build for the embedded live map.</Text>
          {driverPoint && <Text style={styles.fallbackCoords}>Driver: {driverPoint.latitude.toFixed(5)}, {driverPoint.longitude.toFixed(5)}</Text>}
          {validDestination && <Text style={styles.fallbackCoords}>Delivery: {deliveryLatitude.toFixed(5)}, {deliveryLongitude.toFixed(5)}</Text>}
          <Text onPress={() => Linking.openURL(driverPoint ? `https://www.google.com/maps/dir/${driverPoint.latitude},${driverPoint.longitude}/${deliveryLatitude},${deliveryLongitude}` : `https://www.google.com/maps/search/?api=1&query=${deliveryLatitude},${deliveryLongitude}`)} style={styles.openMapText}>Open route in Google Maps</Text>
        </View>
      )}

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
  expoFallback: { flex: 1, padding: 22, alignItems: "center", justifyContent: "center", backgroundColor: "#EAF2ED" },
  fallbackTitle: { color: "#0B3D2E", fontSize: 18, fontWeight: "900", marginBottom: 8 },
  fallbackText: { color: "#40594D", fontSize: 12, lineHeight: 18, textAlign: "center" },
  fallbackCoords: { color: "#0B3D2E", fontSize: 12, fontWeight: "700", marginTop: 8 },
  openMapText: { color: "#F36A21", fontWeight: "800", fontSize: 12, marginTop: 14 },
  destinationPin: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: "#F36A21", borderWidth: 2, borderColor: "#FFF8EE",
    alignItems: "center", justifyContent: "center",
  },
  driverPin: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: "#0B3D2E", borderWidth: 2, borderColor: "#FFF8EE",
    alignItems: "center", justifyContent: "center",
  },
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
