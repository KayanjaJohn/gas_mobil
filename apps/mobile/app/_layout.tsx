import React, { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { View, ActivityIndicator, Platform } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";
import * as Location from "expo-location";
import { COLORS } from "../src/utils/constants";

const Notifications: typeof import("expo-notifications") | null =
  Constants.executionEnvironment === "storeClient" ? null : require("expo-notifications");

if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

function RootLayoutInner() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS === "web") return;
    let active = true;
    const configureDevicePermissions = async () => {
      try {
        // Ask for permission at first launch; Android/iOS still require the user
        // to approve the system prompt.
        const locationPermission = await Location.getForegroundPermissionsAsync();
        if (active && !locationPermission.granted) {
          await Location.requestForegroundPermissionsAsync();
        }
        if (!Notifications) return;
        let notificationPermission = await Notifications.getPermissionsAsync();
        if (!notificationPermission.granted) {
          notificationPermission = await Notifications.requestPermissionsAsync();
        }
        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("gasmobil-alerts-v5", {
            name: "GasMobil Order & Delivery Alerts",
            importance: Notifications.AndroidImportance.MAX,
            sound: "default",
            vibrationPattern: [0, 500, 180, 500, 180, 650],
            enableVibrate: true,
            enableLights: true,
            lightColor: "#0A3D2E",
            showBadge: true,
          });
        }
      } catch (error) {
        console.warn("[DevicePermissions] Setup did not complete:", error);
      }
    };
    void configureDevicePermissions();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === "(tabs)";
    const inLoginGroup = ["login", "register", "forgot-password"].includes(String(segments[0] || ""));
    const timer = setTimeout(() => {
      if (!isAuthenticated && inAuthGroup) router.replace("/login");
      else if (isAuthenticated && !inAuthGroup && !inLoginGroup) router.replace("/(tabs)");
    }, 0);
    return () => clearTimeout(timer);
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.bg }}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  return (
    <>
      <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
          <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </SafeAreaView>
      <StatusBar style="light" />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootLayoutInner />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
