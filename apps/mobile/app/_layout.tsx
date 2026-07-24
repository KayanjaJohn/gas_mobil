import React, { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "../src/context/AuthContext";
import { View, ActivityIndicator } from "react-native";
import { COLORS } from "../src/utils/constants";

export default function RootLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(tabs)";
    console.log("[Auth] Route check | authenticated:", isAuthenticated, "| inAuthGroup:", inAuthGroup);

    if (!isAuthenticated && inAuthGroup) {
      console.log("[Auth] → Redirecting to /login");
      router.replace("/login");
    } else if (isAuthenticated && !inAuthGroup) {
      console.log("[Auth] → Redirecting to /(tabs)");
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="order" options={{ headerShown: false }} />
        <Stack.Screen name="order-summary" options={{ headerShown: false }} />
        <Stack.Screen name="tracking" options={{ headerShown: false }} />
        <Stack.Screen name="accessories" options={{ headerShown: false }} />
        <Stack.Screen name="stations" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}
