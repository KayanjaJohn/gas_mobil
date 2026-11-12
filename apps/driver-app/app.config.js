import "dotenv/config";

export default ({ config }) => ({
  ...config,
  name: "Deliver@GasMobil",
  slug: "gas-mobil-driver",
  owner: "gasmobil-uganda",
  version: config.version || "1.0.0",
  orientation: "portrait",
  userInterfaceStyle: "dark",
  newArchEnabled: true,
  icon: "./assets/icon.png",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#0A3D2E",
  },
  android: {
    ...config.android,
    package: "com.gasmobil.driver",
    googleServicesFile: "./google-services.json",
    permissions: [
      "POST_NOTIFICATIONS",
      "ACCESS_COARSE_LOCATION",
      "ACCESS_FINE_LOCATION",
      "FOREGROUND_SERVICE",
      "FOREGROUND_SERVICE_LOCATION",
    ],
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#0A3D2E",
    },
  },
  plugins: [
    ...(config.plugins || []).filter((plugin) => {
      const name = Array.isArray(plugin) ? plugin[0] : plugin;
      return name !== "expo-notifications" && name !== "expo-location";
    }),
    ["expo-notifications", {
      icon: "./assets/adaptive-icon.png",
      color: "#0A3D2E",
      defaultChannel: "gasmobil-alerts-v5",
    }],
    ["expo-location", {
      locationWhenInUsePermission: "GasMobil Driver uses your location to navigate to deliveries and share live delivery progress with customers.",
      locationAlwaysAndWhenInUsePermission: "GasMobil Driver uses your location during active deliveries, including when the screen is locked, to share live delivery progress.",
      isAndroidBackgroundLocationEnabled: true,
      isAndroidForegroundServiceEnabled: true,
      isIosBackgroundLocationEnabled: true,
    }],
    "@maplibre/maplibre-react-native",
  ],
  extra: {
    ...config.extra,
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
    eas: {
      projectId: "f08f487f-63c6-4116-872a-3ce9f5917c8b",
    },
  },
});
