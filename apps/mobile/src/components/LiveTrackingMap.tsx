import React from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useOrderTracking } from '../hooks/useOrderTracking';

interface Props {
  orderId: string;
  deliveryLatitude: number;
  deliveryLongitude: number;
}

export const LiveTrackingMap: React.FC<Props> = ({
  orderId,
  deliveryLatitude,
  deliveryLongitude,
}) => {
  const { driverLocation, orderStatus, isConnected } = useOrderTracking(orderId);

  const initialRegion = {
    latitude: deliveryLatitude,
    longitude: deliveryLongitude,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton
      >
        {/* Delivery location marker */}
        <Marker
          coordinate={{
            latitude: deliveryLatitude,
            longitude: deliveryLongitude,
          }}
          title="Delivery Location"
          pinColor="green"
        />

        {/* Driver marker (if available) */}
        {driverLocation && (
          <Marker
            coordinate={{
              latitude: driverLocation.latitude,
              longitude: driverLocation.longitude,
            }}
            title="Driver"
            description={`Accuracy: ${Math.round(driverLocation.accuracy || 0)}m`}
            pinColor="blue"
          />
        )}

        {/* Route line */}
        {driverLocation && (
          <Polyline
            coordinates={[
              {
                latitude: driverLocation.latitude,
                longitude: driverLocation.longitude,
              },
              {
                latitude: deliveryLatitude,
                longitude: deliveryLongitude,
              },
            ]}
            strokeColor="#2196F3"
            strokeWidth={3}
          />
        )}
      </MapView>

      {/* Status overlay */}
      <View style={styles.statusBar}>
        <View style={styles.statusRow}>
          <View style={[styles.dot, isConnected ? styles.dotGreen : styles.dotRed]} />
          <Text style={styles.statusText}>
            {isConnected ? 'Live Tracking Active' : 'Reconnecting...'}
          </Text>
        </View>
        {driverLocation && (
          <Text style={styles.coordsText}>
            Driver: {driverLocation.latitude.toFixed(5)}, {driverLocation.longitude.toFixed(5)}
          </Text>
        )}
        {orderStatus && (
          <Text style={styles.orderStatusText}>{orderStatus.message}</Text>
        )}
        {!driverLocation && (
          <View style={styles.waitingRow}>
            <ActivityIndicator size="small" color="#2196F3" />
            <Text style={styles.waitingText}>Waiting for driver location...</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  statusBar: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 14,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  dotGreen: {
    backgroundColor: '#4CAF50',
  },
  dotRed: {
    backgroundColor: '#F44336',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  coordsText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  orderStatusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2196F3',
  },
  waitingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  waitingText: {
    fontSize: 13,
    color: '#666',
  },
});