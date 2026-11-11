import { Stack } from 'expo-router';

export default function TabsLayout() {
  return <Stack screenOptions={{ headerShown: false }}><Stack.Screen name="help" options={{ title: "Help & Support" }} /></Stack>;
}
