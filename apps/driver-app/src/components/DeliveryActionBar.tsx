import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface ActionButton {
  label: string;
  onPress: () => void;
  color: string;
  icon?: string;
}

interface DeliveryActionBarProps {
  actions: ActionButton[];
}

export default function DeliveryActionBar({ actions }: DeliveryActionBarProps) {
  return (
    <View style={styles.container}>
      {actions.map((action, index) => (
        <TouchableOpacity
          key={index}
          style={[styles.button, { backgroundColor: action.color }]}
          onPress={action.onPress}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>{action.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
