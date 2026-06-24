import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface NotificationBannerProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  onDismiss?: () => void;
  duration?: number;
}

export default function NotificationBanner({
  message,
  type = 'info',
  onDismiss,
  duration = 4000,
}: NotificationBannerProps) {
  const translateY = new Animated.Value(-100);

  const colors = {
    success: '#41f1b6',
    error: '#ff7782',
    info: '#7380ec',
    warning: '#ffbb55',
  };

  const icons = {
    success: 'check-circle',
    error: 'alert-circle',
    info: 'information',
    warning: 'alert',
  };

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
    }).start();

    if (duration > 0) {
      const timer = setTimeout(() => {
        dismiss();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    Animated.timing(translateY, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => onDismiss?.());
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
      <View style={[styles.banner, { backgroundColor: colors[type] }]}>
        <Icon name={icons[type]} size={20} color="#fff" />
        <Text style={styles.message}>{message}</Text>
        <TouchableOpacity onPress={dismiss}>
          <Icon name="close" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    padding: 16,
    paddingTop: 50,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  message: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});
