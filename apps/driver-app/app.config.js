import "dotenv/config";

export default ({ config }) => ({
  ...config,
  owner: "gasmobil-uganda",
  newArchEnabled: true,
  android: {
    ...config.android,
  },
  plugins: [...(config.plugins || []).filter((plugin) => !(Array.isArray(plugin) ? plugin[0] : plugin) || (Array.isArray(plugin) ? plugin[0] : plugin) !== "expo-notifications"), "@maplibre/maplibre-react-native"],
  extra: {
    ...config.extra,
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
    eas: {
      projectId: "f08f487f-63c6-4116-872a-3ce9f5917c8b",
    },
  },
});
