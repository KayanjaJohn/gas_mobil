import { Tabs } from 'expo-router';
import { Home, ShoppingCart, MapPin, Leaf, User } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(8,12,22,0.92)',
          borderTopWidth: 1,
          borderTopColor: '#1F2A3D',
          paddingBottom: 18,
          paddingTop: 10,
          height: 80,
        },
        tabBarActiveTintColor: '#1484FF',
        tabBarInactiveTintColor: '#8A93A6',
        tabBarLabelStyle: {
          fontSize: 10.5,
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => <ShoppingCart size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="tracking"
        options={{
          title: 'Track',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => <MapPin size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="green"
        options={{
          title: 'Green',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => <Leaf size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}