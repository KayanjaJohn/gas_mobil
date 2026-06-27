import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { COLORS } from '../utils/constants';

interface Props {
  message: string;
  visible: boolean;
  onHide?: () => void;
  duration?: number;
}

export default function Toast({ message, visible, onHide, duration = 2200 }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(translateAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.timing(translateAnim, { toValue: 20, duration: 300, useNativeDriver: true }),
        ]).start(() => onHide?.());
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: fadeAnim, transform: [{ translateY: translateAnim }] },
      ]}
    >
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 110,
    left: '50%',
    transform: [{ translateX: -100 }],
    backgroundColor: '#0e1521',
    borderWidth: 1,
    borderColor: COLORS.accent,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 999,
    zIndex: 100,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
  },
  text: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
});