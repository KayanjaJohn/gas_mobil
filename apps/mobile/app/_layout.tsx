import React, { useEffect, useCallback }from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { View, ActivityIndicator, Platform } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import Constants from "expo-constants";
import { COLORS } from "../src/utils/constants";
import { initializeSocket } from "../src/services/socketService";
// Avoid importing expo-notifications in Expo Go (remote notifications were removed on Android SDK 53+).
const Notifications: typeof import('expo-notifications') | null = Constants.executionEnvironment === 'storeClient' ? null : require('expo-notifications');

// Expo Go no longer supports remote push notifications on Android (SDK 53+).
// Notification handling and permission prompts are configured only in native builds.
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

  // Keep one app-wide foreground notification listener alive on every tab.
  // Socket alerts are converted into local OS notifications so the user gets
  // a banner, sound and vibration while actively using the app.
  useEffect(() => {
    if (!Notifications || Platform.OS === "web" || !isAuthenticated) return;
    let mounted = true;
    let socket: any = null;
    const onNotification = async (payload: any) => {
      if (!mounted || !payload?.id) return;
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: payload.title || "GasMobil",
            body: payload.message || "You have a new update.",
            sound: "default",
            vibrate: [0, 500, 180, 500, 180, 650],
            data: { ...(payload.data || {}), notificationId: payload.id, source: "socket" },
          },
          trigger: null,
        });
      } catch (error: any) {
        console.warn("[Push] Could not show foreground customer alert:", error?.message || error);
      }
    };
    void initializeSocket().then((connectedSocket) => {
      if (!mounted || !connectedSocket) return;
      socket = connectedSocket;
      socket.on("notification", onNotification);
    });
    return () => {
      mounted = false;
      socket?.off("notification", onNotification);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    // Remote notifications are not supported in Expo Go on Android SDK 53+.
    if (!Notifications || Platform.OS === "web") return;
    const configureNotifications = async () => {
      const permission = await Notifications.getPermissionsAsync();
      if (!permission.granted) {
        await Notifications.requestPermissionsAsync();
      }
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("gasmobil-alerts-v3", {
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
    };
    void configureNotifications();
  }, []);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(tabs)";
    const inLoginGroup = ["login", "register", "forgot-password"].includes(String(segments[0] || ""));

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

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.bg }}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  return (
    <>
      <SafeAreaView
        edges={["top", "bottom"]}
        style={{ flex: 1, backgroundColor: COLORS.bg }}
      >
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