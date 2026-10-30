import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

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

export const LiveTrackingMap: React.FC<Props> = ({
  deliveryLatitude,
  deliveryLongitude,
  driverLocation,
  orderStatus,
  isConnected,
}) => {
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (!driverLocation || !mapRef.current) return;
    mapRef.current.fitToCoordinates(
      [
        { latitude: driverLocation.latitude, longitude: driverLocation.longitude },
        { latitude: deliveryLatitude, longitude: deliveryLongitude },
      ],
      {
        edgePadding: { top: 70, right: 55, bottom: 150, left: 55 },
        animated: true,
      }
    );
  }, [driverLocation?.latitude, driverLocation?.longitude, deliveryLatitude, deliveryLongitude]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: deliveryLatitude,
          longitude: deliveryLongitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsCompass
        loadingEnabled
      >
        <Marker
          coordinate={{ latitude: deliveryLatitude, longitude: deliveryLongitude }}
          title="Your delivery address"
          description="Customer destination"
          pinColor="#F36A21"
        />
        {driverLocation && (
          <Marker
            coordinate={{ latitude: driverLocation.latitude, longitude: driverLocation.longitude }}
            title="Your driver"
            description={driverLocation.speed != null && driverLocation.speed >= 0
              ? `Live driver position · ${Math.round(driverLocation.speed * 3.6)} km/h`
              : 'Live driver position'}
            pinColor="#0B3D2E"
          />
        )}
        {driverLocation && (
          <Polyline
            coordinates={[
              { latitude: driverLocation.latitude, longitude: driverLocation.longitude },
              { latitude: deliveryLatitude, longitude: deliveryLongitude },
            ]}
            strokeColor="#F36A21"
            strokeWidth={4}
          />
        )}
      </MapView>

      <View style={styles.statusBar}>
        <View style={styles.statusRow}>
          <View style={[styles.dot, isConnected ? styles.dotGreen : styles.dotRed]} />
          <Text style={styles.statusText}>
            {isConnected ? 'Live tracking connected' : 'Reconnecting to driver…'}
          </Text>
        </View>
        {driverLocation ? (
          <Text style={styles.coordsText}>
            Driver location updated {driverLocation.timestamp
              ? new Date(driverLocation.timestamp).toLocaleTimeString()
              : 'just now'}
            {driverLocation.accuracy != null ? ` · GPS ±${Math.round(driverLocation.accuracy)}m` : ''}
          </Text>
        ) : (
          <View style={styles.waitingRow}>
            <ActivityIndicator size="small" color="#F36A21" />
            <Text style={styles.waitingText}>
              {orderStatus?.status === 'in_transit' || orderStatus?.status === 'nearby'
                ? 'Driver is starting GPS. Waiting for first location…'
                : 'Your driver’s live location appears when delivery starts.'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  statusBar: {
    position: 'absolute', bottom: 16, left: 16, right: 16,
    backgroundColor: '#FFF8EE', padding: 14, borderRadius: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4, elevation: 5,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  dotGreen: { backgroundColor: '#168447' },
  dotRed: { backgroundColor: '#F36A21' },
  statusText: { fontSize: 13, fontWeight: '800', color: '#0B3D2E' },
  coordsText: { fontSize: 11, color: '#527064' },
  waitingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  waitingText: { fontSize: 12, color: '#244B3D', flex: 1 },
});
