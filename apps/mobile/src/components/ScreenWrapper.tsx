import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { COLORS } from '../utils/constants';

interface Props {
  children: React.ReactNode;
  style?: object;
}

export default function ScreenWrapper({ children, style }: Props) {
  return (
    <View style={[styles.container, style]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
});