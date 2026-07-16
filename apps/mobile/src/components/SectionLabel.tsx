import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../utils/constants';

interface Props {
  title: string;
  action?: { label: string; onPress: () => void };
}

export default function SectionLabel({ title, action }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {action && (
        <TouchableOpacity onPress={action.onPress} activeOpacity={0.7}>
          <Text style={styles.action}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 8,
  },
  title: {
    fontSize: 11,
    letterSpacing: 1.5,
    color: COLORS.muted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  action: {
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: '600',
  },
});