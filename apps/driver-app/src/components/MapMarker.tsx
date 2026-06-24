import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface MapMarkerProps {
  type: 'pickup' | 'delivery' | 'driver';
  label?: string;
}

export default function MapMarker({ type, label }: MapMarkerProps) {
  const colors = {
    pickup: '#7380ec',
    delivery: '#41f1b6',
    driver: '#ffbb55',
  };

  const icons = {
    pickup: 'store',
    delivery: 'home',
    driver: 'truck-delivery',
  };

  return (
    <View style={styles.container}>
      <View style={[styles.marker, { backgroundColor: colors[type] }]}>
        <Icon name={icons[type]} size={16} color="#fff" />
      </View>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.triangle, { borderTopColor: colors[type] }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  marker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: '#333',
    backgroundColor: '#fff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    elevation: 2,
  },
  triangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2,
  },
});
