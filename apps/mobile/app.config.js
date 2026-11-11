import "dotenv/config";

export default {
  expo: {
    name: "GasMobil Uganda",
    slug: "gas-mobil-app",
    owner: "gasmobil-uganda",
    version: "1.0.0",
    orientation: "portrait",
    newArchEnabled: true,
    icon: "./assets/gasmobil-icon.png",
    scheme: "gasmobil",
    userInterfaceStyle: "dark",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#0A3D2E",
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.gasmobil.app",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#0A3D2E",
      },
      package: "com.gasmobil.app",
      versionCode: 4,
      googleServicesFile: "./google-services.json",
    },
    web: {
      favicon: "./assets/icon.png",
    },
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL,
      eas: {
        projectId: "e63f5e6a-5e16-4297-9623-c7475c34d842",
      },
    },
    plugins: ["expo-router", ["expo-notifications", { icon: "./assets/adaptive-icon.png", defaultChannel: "gasmobil-alerts-v5", color: "#0A3D2E" }], ["expo-location", { locationWhenInUsePermission: "GasMobil uses your location to find nearby gas stations and deliver orders to your address." }], "@maplibre/maplibre-react-native"],
  },
};