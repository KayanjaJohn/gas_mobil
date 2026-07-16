import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
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

  if (!driverLocation) {
    return (
      <View style={styles.container}>
        <Text>Waiting for driver location...</Text>
        <Text>Connection: {isConnected ? 'Connected' : 'Disconnected'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: driverLocation.latitude,
          longitude: driverLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {/* Driver marker */}
        <Marker
          coordinate={{
            latitude: driverLocation.latitude,
            longitude: driverLocation.longitude,
          }}
          title="Driver"
          description="Your delivery driver"
          pinColor="blue"
        />

        {/* Delivery location marker */}
        <Marker
          coordinate={{
            latitude: deliveryLatitude,
            longitude: deliveryLongitude,
          }}
          title="Delivery Location"
          pinColor="red"
        />

        {/* Route line */}
        <Polyline
          coordinates={[
            { latitude: driverLocation.latitude, longitude: driverLocation.longitude },
            { latitude: deliveryLatitude, longitude: deliveryLongitude },
          ]}
          strokeColor="#2196F3"
          strokeWidth={3}
        />
      </MapView>

      {orderStatus && (
        <View style={styles.statusBar}>
          <Text style={styles.statusText}>{orderStatus.message}</Text>
        </View>
      )}
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
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});