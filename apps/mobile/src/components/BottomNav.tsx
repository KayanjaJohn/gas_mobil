import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { COLORS } from '../utils/constants';

const TABS = [
  { key: 'home', label: 'Home', icon: '🏠', route: '/(tabs)' },
  { key: 'cart', label: 'Cart', icon: '🛒', route: '/cart' },
  { key: 'tracking', label: 'Track', icon: '📍', route: '/tracking' },
  { key: 'green', label: 'Green', icon: '🌱', route: '/green' },
  { key: 'profile', label: 'Profile', icon: '👤', route: '/profile' },
];

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (route: string) => {
    if (route === '/(tabs)' && (pathname === '/' || pathname === '/(tabs)')) return true;
    return pathname.includes(route.replace('/(tabs)', ''));
  };

  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const active = isActive(tab.route);
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.item, active && styles.itemActive]}
            onPress={() => router.push(tab.route as any)}
            activeOpacity={0.7}
          >
            <Text style={[styles.icon, active && styles.iconActive]}>{tab.icon}</Text>
            <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingBottom: 28,
    backgroundColor: 'rgba(8,12,22,0.92)',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    zIndex: 60,
  },
  item: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
    flex: 1,
  },
  itemActive: {
    // Active styling handled by icon/label
  },
  icon: {
    fontSize: 20,
    opacity: 0.5,
  },
  iconActive: {
    opacity: 1,
    backgroundColor: 'rgba(20,132,255,0.15)',
    padding: 7,
    borderRadius: 12,
    overflow: 'hidden',
  },
  label: {
    fontSize: 10.5,
    color: COLORS.muted,
  },
  labelActive: {
    color: COLORS.accent,
  },
});