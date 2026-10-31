import "dotenv/config";

export default {
  expo: {
    name: "gas-mobil-app",
    slug: "gas-mobil-app",
    owner: "gasmobil-uganda",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    scheme: "gasmobil",
    userInterfaceStyle: "dark",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#070b14",
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.gasmobil.app",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#070b14",
      },
      package: "com.gasmobil.app",
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
    plugins: ["expo-router"],
  },
};