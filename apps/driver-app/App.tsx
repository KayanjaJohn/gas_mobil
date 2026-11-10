import React, { useEffect } from 'react';
import { Platform, View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import HomeScreen from './src/screens/HomeScreen';
import OrderDetailScreen from './src/screens/OrderDetailScreen';
import DeliveryScreen from './src/screens/DeliveryScreen';
import EarningsScreen from './src/screens/EarningsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import NotificationsScreen from './src/screens/NotificationScreen';

const Notifications: typeof import('expo-notifications') | null = Constants.executionEnvironment === 'storeClient' ? null : require('expo-notifications');

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A3D2E' }}>
        <ActivityIndicator color="#F59E0B" />
        <Text style={{ color: '#94A3B8', marginTop: 12 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
            <Stack.Screen name="Delivery" component={DeliveryScreen} />
            <Stack.Screen name="Earnings" component={EarningsScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            {/* ── NEW: Notifications screen ── */}
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

if (Notifications) Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    // Foreground alerts are shown from the socket event as a local alert;
    // suppress the matching remote push to avoid duplicate banners.
    const isSocketAlert = notification.request.content.data?.source === "socket";
    return {
      shouldShowBanner: isSocketAlert,
      shouldShowList: isSocketAlert,
      shouldPlaySound: isSocketAlert,
      shouldSetBadge: true,
    };
  },
});

export default function App() {
  useEffect(() => {
    if (!Notifications || Platform.OS === 'web') return;
    const configure = async () => {
      const permission = await Notifications.getPermissionsAsync();
      if (!permission.granted) {
        await Notifications.requestPermissionsAsync();
      }
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('gasmobil-alerts-v3', {
          name: 'GasMobil Order & Delivery Alerts',
          importance: Notifications.AndroidImportance.MAX,
          sound: 'default',
          vibrationPattern: [0, 500, 180, 500, 180, 650],
          enableVibrate: true,
          enableLights: true,
          lightColor: "#0A3D2E",
          showBadge: true,
        });
      }
    };
    void configure();
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: "#0A3D2E" }}>
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}