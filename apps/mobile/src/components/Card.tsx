import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../utils/constants';

interface Props {
  children: React.ReactNode;
  style?: object;
  onPress?: () => void;
  activeOpacity?: number;
}

export default function Card({ children, style, onPress, activeOpacity = 0.9 }: Props) {
  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.card, style]}
        onPress={onPress}
        activeOpacity={activeOpacity}
      >
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    padding: 18,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});