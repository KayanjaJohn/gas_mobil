import React from 'react';
import { Text, StyleSheet } from 'react-native';

interface Props {
  size?: number;
  style?: object;
}

export default function FlameLogo({ size = 72, style }: Props) {
  return (
    <Text style={[styles.flame, { fontSize: size }, style]}>
      🔥
    </Text>
  );
}

const styles = StyleSheet.create({
  flame: {
    textShadowColor: 'rgba(20,132,255,0.45)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 20,
  },
});