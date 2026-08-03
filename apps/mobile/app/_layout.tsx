import React, { useEffect, useCallback }from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { useSocket } from "../src/hooks/useSocket";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { View, ActivityIndicator } from "react-native";
import { COLORS } from "../src/utils/constants";

function RootLayoutInner() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(tabs)";
    const inLoginGroup = segments[0] === "login" || segments[0] === "register";

    // Defer navigation to avoid setState-during-render errors
    const timer = setTimeout(() => {
      if (!isAuthenticated && inAuthGroup) {
        router.replace("/login");
      } else if (isAuthenticated && !inAuthGroup && !inLoginGroup) {
        router.replace("/(tabs)");
      }
    }, 0);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isLoading]);
  // NOTE: segments intentionally removed from deps to prevent redirect loops

  useSocket((data) => {
    // Optionally show a local toast or re-fetch notifications
    console.log("[Socket] Real-time notification:", data);
  });

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutInner />
    </AuthProvider>
  );
}