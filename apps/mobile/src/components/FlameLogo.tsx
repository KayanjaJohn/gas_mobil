import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { COLORS } from "../utils/constants";

interface Props {
  size?: number;
  style?: ViewStyle;
}

export default function FlameLogo({ size = 72, style }: Props) {
  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size * 0.28 }, style]}>
      <Icon name="fire" size={size * 0.58} color={COLORS.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: "#123D30",
    borderWidth: 1,
    borderColor: "#245747",
    alignItems: "center",
    justifyContent: "center",
  },
});
